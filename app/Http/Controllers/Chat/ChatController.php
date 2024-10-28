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
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Google\Client;

class ChatController extends Controller
{
    public function __construct(protected ChatRepository $chatRepository, protected FirebaseService $firebaseService) {}

    public function index()
    {
        return view('chat');
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
            $request->merge([
                'senderName' => $request->senderName,
                'message' => $request->message,
                'token' => json_encode($request->user['fcm_token'])
            ]);

            // $this->sendNotification($request);
            // dispatch(new SendNotificationJob(json_encode($request->user['fcm_token']), $user['name'],$message->msg, $this->firebaseService));
            return response()->json($message, 201);
        }
    }

    public function sendNotification(Request $request)
    {
        $message = $request->message;

        $token = trim($request->token, "\"");

        $accessToken = $this->getAccessToken();

        $payload = [
            'message' => [
                'token' => $token,
                'notification' => [
                    'title' => $request->senderName,
                    'body'  => $message
                ]
            ]
        ];

        Log::info('Token: ' . $token);
        Log::info('Payload: ' . json_encode($payload));

        $fcmResponse = Http::withToken($accessToken)
            ->post('https://fcm.googleapis.com/v1/projects/vm-chat-5c18d/messages:send', $payload);

        Log::info('FCM Response: ' . $fcmResponse->body());

        return response()->json(['status' => 'Notification Sent', 'fcm_response' => $fcmResponse->body()]);
    }

    public function getAccessToken()
    {
        $client = new Client();
        $client->setAuthConfig(storage_path("app/json/vm-chat.json"));
        $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
        $token = $client->fetchAccessTokenWithAssertion();
        return $token['access_token'];
    }


    // public function broadcastChat(Request $request)
    // {
    //     $user = $request->user();
    //     $message = $this->store($request);
    //     $messageResposne = json_decode($message->getContent(),true);
    //     event(new Chat($user,$request->body,$request->time, (int)($messageResposne['id'])));
    //     return response()->json(['msg'=>"event fired !!"]);
    // }

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

    public function searchMessage($query, $groupId)
    {
        return $this->chatRepository->searchGroupMessages($query, $groupId);
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

        $messageIds = [];

        foreach ($messages as $message) {
            $messageIds[] = $message['id'];
            DB::table('group_messages')
                ->where('id', $message['id'])
                ->update(['group_id' => $newGroupId]);
        }

        $updatedMessages = GroupMessage::whereIn('id', $messageIds)
            ->with("user")
            ->get();

        return response()->json($updatedMessages);
    }

    public function viewDocument(Request $request)
    {
        return $request;
        $pdfPath = $request->input('doc');
        return view('pdf-viewer', compact('pdfPath'));
    }
}
