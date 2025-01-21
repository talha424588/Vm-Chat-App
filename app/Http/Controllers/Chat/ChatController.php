<?php

namespace App\Http\Controllers\Chat;

use App\Enum\MessageEnum as EnumMessageEnum;
use App\Http\Controllers\Controller;
use App\Http\Controllers\MailController;
use App\Jobs\SendNotificationJob;
use App\Models\GroupMessage;
use App\Models\User;
use App\Repositories\ChatRepository;
use App\Services\FirebaseService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    protected MailController $mailController; // Declare the property

    public function __construct(protected ChatRepository $chatRepository, protected FirebaseService $firebaseService, MailController $mailController)

    {
        $this->mailController = $mailController;
    }

    public function index(Request $request)
    {

        if ($request->has('is_delete')) {
            $group_id = $request->group_id ?? null;
            $message_id = $request->message_id ?? null;
            $is_delete = $request->input('is_delete');
            if ($is_delete === '1') {
                $this->chatRepository->deleteMessage($message_id);
            }
            $group_id =  null;
            $message_id =  null;
            return view('chat', compact("group_id", "message_id", "is_delete"));
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
            }
            $this->firebaseService->sendNotification($message);
            return response()->json($message, 201);
        }
    }

    public function delete(Request $request)
    {
        if (isset($request->is_perm_delete) && $request->is_perm_delete == 1 && Auth::user()->role == 2) {
            $this->mailController->RequestMessageDelete(Auth::user(), $request);
            $message = $this->fetchMessage($request->message['id']);
            // $message->is_deleted = true;
            // if ($message->save()) {
            return response()->json([
                'status' => true,
                'message' => 'delete message request send successfully',
                'data' => $message,
            ], 200);
            // }
        } else {
            try {
                $message = $this->fetchMessage($request->message['id']);
                if (isset($request->is_perm_delete) && $request->is_perm_delete == 0 && Auth::user()->role == 0) {
                    if ($message->delete()) {
                        // if (Auth::user()->role == 0 || Auth::user()->role == 2) {
                        //     $lastestNotDeletedMessage = GroupMessage::with("user")->where("group_id", $message->group_id)->orderBy("id", "Desc")->first();
                        // } else {
                        //     $lastestNotDeletedMessage = GroupMessage::with("user")->where("group_id", $message->group_id)->where('is_deleted', 0)->orderBy("id", "Desc")->first();
                        // }
                        $data = [
                            "message" => $message,
                            "deleteFlag" => true
                        ];
                        return response()->json([
                            'status' => true,
                            'message' => 'Message deleted successfully',
                            'data' => $data
                        ], 200);
                    } else {
                        return response()->json([
                            'status' => false,
                            'message' => 'Message deletion failed'
                        ], 400);
                    }
                } else {
                    $message->is_deleted = true;
                    if ($message->save()) {
                        return response()->json([
                            'status' => true,
                            'message' => 'Message deleted successfully',
                            'data' => $message
                        ], 200);
                    } else {
                        return response()->json([
                            'status' => false,
                            'message' => 'Message deletion failed'
                        ], 400);
                    }
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
    }

    private function fetchMessage($id)
    {

        $message = GroupMessage::with("user")->findOrFail($id);
        return $message;
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
            } else {
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
}
