<?php

namespace App\Http\Controllers\Chat;

use App\Enum\MessageEnum as EnumMessageEnum;
use App\Http\Controllers\Controller;
use App\Jobs\SendNotificationJob;
use App\Models\GroupMessage;
use App\Models\User;
use App\Repositories\ChatRepository;
use App\Services\FirebaseService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    public function __construct(protected ChatRepository $chatRepository, protected FirebaseService $firebaseService) {}

    public function index(Request $request)
    {
            $group_id = $request->group_id ?? null;
            $message_id = $request->message_id ?? null;
            return view('chat', compact("group_id","message_id"));
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
        if ($message->save()) {
            $message->user = User::where("unique_id", $uniqueId)->first();
            if ($message->reply_id) {
                $message->reply ? GroupMessage::where("id", $message->reply_id)->first() : "null";
                $message->reply->user ? User::where("unique_id", $message->sender)->first() : "null";
            }
            $this->firebaseService->sendNotification($message);
            return response()->json($message, 201);
        }
    }

    public function delete($id)
    {
        try {
            $message = GroupMessage::findOrFail($id);
            $message->is_deleted = true;
            if ($message->save()) {
                return response()->json([
                    'status' => true,
                    'message' => 'Message deleted successfully'
                ], 200);
            } else {
                return response()->json([
                    'status' => false,
                    'message' => 'Message deletion failed'
                ], 400);
            }
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Message not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'An error occurred while deleting the message'
            ], 500);
        }
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
        $messages = $request->input('messages');
        $newGroupId = $request->input('newGroupId');
        $messages = $request->input('messageList');
        $moveMessages = [];

        foreach ($messages as $message) {

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
            $message['compose_id']?$moveMessageClone->compose_id=$message['compose_id']:'';   
            if ($moveMessageClone->save()) {
                $moveMessageClone->user = User::where("unique_id", $message['user']['unique_id'])->first();
                DB::table('group_messages')
                    ->where('id', $message['id'])
                    ->where('group_id', $message['group_id'])
                    ->update(['is_deleted' => true, 'status' => EnumMessageEnum::MOVE]);
                $moveMessages[] = $moveMessageClone;
            }
        }
        return response()->json(['status' => true, "message" => "success", "messages" => $moveMessages], 200);
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
}
