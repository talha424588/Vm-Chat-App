<?php

namespace App\Http\Controllers\Chat;

use App\Enum\MessageEnum as EnumMessageEnum;
use App\Http\Controllers\Controller;
use App\Http\Controllers\MailController;
use App\Models\GroupMessage;
use App\Models\User;
use App\Repositories\ChatRepository;
use App\Services\FirebaseService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{

    public function __construct(protected ChatRepository $chatRepository, protected FirebaseService $firebaseService) {}

    public function index(Request $request)
    {
        if ($request->has('is_delete')) {
            $del_msg_group_id = $request->group_id ?? null;
            $de_message_id = $request->message_id ?? null;
            $is_delete = $request->input('is_delete');
            if ($is_delete === "1") {
                $this->chatRepository->deleteMessage($request);
            }
            // $del_msg_group_id =  null;
            // $de_message_id =  null;
            return view('chat', compact("del_msg_group_id", "de_message_id", "is_delete"));
        }
        $group_id = $request->group_id ?? null;
        $message_id = $request->message_id ?? null;
        $is_delete = null;
        return view('chat', compact("group_id", "message_id", "is_delete"));
    }
    //
    public function searchGroupMessages(Request $request)
    {
        $validatorResponse = $this->validateInputDetails($request, [
            'query' => 'required',
            //'page' => 'required|integer|min:1',
        ]);

        if (isset($validatorResponse) && $validatorResponse->getStatusCode() == 400)
            return $validatorResponse;
        else
            return $this->chatRepository->searchChatMessages($request);
    }

    public function getUserAllGroupsMessages(Request $request)
    {

        $validatorResponse = $this->validateInputDetails($request, [
            'groupId' => 'required',
            'page' => 'required|integer|min:1',
        ]);
        if (isset($validatorResponse) && $validatorResponse->getStatusCode() == 400)
            return $validatorResponse;

        else
            return $this->chatRepository->fetchUserAllGroupsMessages($request);
    }

    private function validateInputDetails(Request $request, array $params)
    {
        $rules = [];
        $messages = [];

        foreach ($params as $paramName => $ruleset) {
            $messages["{$paramName}.required"] = ucfirst($paramName) . ' is required.';

            $rules[$paramName] = $ruleset;
        }

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 400);
        }

        return null;
    }

    public function store(Request $request)
    {
        $user = $request->input('user');
        $uniqueId = $user['unique_id'];

        $message = new GroupMessage;
        $message->msg = $request->message;
        $message->sender = $uniqueId;
        $message->seen_by = $uniqueId;
        $message->reply_id = $request->reply_id;
        $message->group_id = $request->group_id;
        $message->type = $request->type;
        $message->media_name = $request->mediaName;
        $message->time = $request->time;
        $message->status = $request->status ?? EnumMessageEnum::NEW;
        $message->is_compose = false;
        $message->is_privacy_breach = $request->privacy_breach ?? false;
        // $message->compose_id = isset($request->compose_id) ?? null;
        if (isset($request->compose_id)) {
            $message->compose_id = $request->input('compose_id');
        } else {
            $message->compose_id = null;
        }
        if ($message->save()) {
            $message->user = User::where("unique_id", $uniqueId)->first();
            if ($message->reply_id) {
                $message->reply ? GroupMessage::where("id", $message->reply_id)->first() : "null";
                $message->reply->user ? User::where("unique_id", $message->sender)->first() : "null";
            } else {
                $message->reply = null;
            }
            $this->firebaseService->sendNotification($message);
            return response()->json($message, 201);
        }
    }

    public function delete(Request $request)
    {
        return $this->chatRepository->deleteMessage($request);
    }

    public function getMessageReadStatus($messageId)
    {
        return $this->chatRepository->getMessageStatus($messageId);
    }

    public function updateMessageReadStatus(Request $request)
    {
        return $this->chatRepository->updateMessageIsReadStatus($request);
    }

    public function searchMessage($query, $groupId, $offset = 0, $limit = 40)
    {
        return $this->chatRepository->searchGroupMessages($query, $groupId, $offset, $limit);
    }

    public function getMessageDetails($id)
    {
        return $this->chatRepository->getMessageById($id);
    }

    public function updateGroupMessage(Request $request)
    {
        return $this->chatRepository->updateMessage($request);
    }

    public function messageCorrection(Request $request)
    {
        return $this->chatRepository->messageCorrection($request);
    }

    public function moveMessages(Request $request)
    {
        $newGroupId = $request->input('newGroupId');
        $messages = $request->input('messageList');
        $moveMessageConvMsg = [];
        $moveMessages = [];
        $mainMessages = [];

        foreach ($messages as $message) {
            if (is_array($message) && isset($message[0])) {
                foreach ($message as $nestedMessage) {
                    $moveMessageConvMsg[] = $nestedMessage;
                }
            } elseif (!empty($message)) {
                $mainMessages[] = $message;
            }
        }

        foreach ($mainMessages as $message) {
            $moveMessageClone = new GroupMessage;
            $moveMessageClone->msg = $message["msg"];
            $moveMessageClone->sender = $message['user']['unique_id'];
            $moveMessageClone->seen_by = $message['user']['unique_id'];
            $moveMessageClone->reply_id = $message['reply_id'];
            $moveMessageClone->group_id = $newGroupId;
            $moveMessageClone->type = $message['type'];
            $moveMessageClone->media_name = $message['mediaName'] ?? null;
            $moveMessageClone->time = now()->timestamp;
            $moveMessageClone->status = EnumMessageEnum::NEW;
            $moveMessageClone->is_compose = true;
            $moveMessageClone->is_privacy_breach = false;
            $moveMessageClone->compose_id = isset($moveMessageClone['compose_id']) ?? null;
            $message['compose_id'] ? $moveMessageClone->compose_id = $message['compose_id'] : '';
            if ($moveMessageClone->save()) {

                $moveMessageClone->user = User::where("unique_id", $message['user']['unique_id'])->first();
                DB::table('group_messages')
                    ->where('id', $message['id'])
                    ->where('group_id', $message['group_id'])
                    ->update(['is_deleted' => true, 'status' => EnumMessageEnum::MOVE]);
                $moveMessages[] = $moveMessageClone;
            }
        }
        $this->deleteMoveMessageConvo($moveMessageConvMsg);

        return response()->json(['status' => true, "message" => "success", "messages" => $moveMessages], 200);
    }

    private function deleteMoveMessageConvo($moveMessageConvMsg)
    {
        $ids = array_map(function ($message) {
            return (string)$message["id"];
        }, $moveMessageConvMsg);

        DB::table('group_messages')->whereIn("id",  $ids)->delete();
    }

    public function viewDocument(Request $request)
    {
        return $request;
        $pdfPath = $request->input('doc');
        return view('pdf-viewer', compact('pdfPath'));
    }

    public function restoreMessage($id)
    {
        return $this->chatRepository->restoreDeletedMessage($id);
    }

    public function openChatGroup(Request $request, $group_id)
    {
        return $this->chatRepository->openChatGroup($request, $group_id);
    }

    public function messageisDeleteStatusCheck($id)
    {
        return $this->chatRepository->messageDeleteStatusCheck($id);
    }

    public function uploadImage(Request $request)
    {
        return $this->chatRepository->uploadImage($request);
    }

    public function uploadFile(Request $request)
    {
        return $this->chatRepository->uploadFile($request);
    }

    public function uploadVoiceNote(Request $request)
    {
        return $this->chatRepository->uploadAudio($request);
    }
}
