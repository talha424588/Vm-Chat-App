<?php

namespace App\Http\Controllers\Chat;

use App\Events\Chat;
use App\Http\Controllers\Controller;
use App\Models\GroupMessage;
use App\Models\User;
use App\Repositories\ChatRepository;
use App\Services\FirebaseService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Laravel\Ui\Presets\React;
use Exception;
use Google\Client;
use Illuminate\Support\Facades\Log;

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


    // public function index(Request $request)
    // {
    //     return $this->chatRepository->fetchUserAllGroupsMessages($request);
    // }

    public function store(Request $request)
    {
        $user = $request->input('user');
        $uniqueId = $user['unique_id'];
        $token = $user['fcm_token'];

        $message = new GroupMessage;
        $message->msg = $request->message;
        $message->sender = $uniqueId;
        $message->seen_by = $uniqueId;
        $message->reply_id = $request->reply_id;
        $message->group_id = $request->group_id;
        $message->type = $request->type;
        $message->media_name = $request->mediaName;
        $message->time = $request->time;
        if ($message->save()) {
            $message->user = User::where("unique_id", $uniqueId)->first();
            if($message->reply_id)
            {
                $message->reply ? GroupMessage::where("id", $message->reply_id)->first():"null";
                $message->reply->user ? User::where("unique_id", $message->sender)->first():"null";
            }
            // $data = [
            //     'message' => $message->msg,
            //     'token' => $token
            // ];

            // $request = new Request($data);
            // $this->firebaseService->sendMessageNotification($request);

            // $client = new Client();
            // $client->setAuthConfig(storage_path("app/json/vm-chat.json"));
            // $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            // $accessToken = $client->fetchAccessTokenWithAssertion();


            // Log::info('AccessToken: ' . $accessToken['access_token']);

            // $url = 'https://fcm.googleapis.com/v1/projects/vm-chat-5c18d/messages:send';
            // $headers = [
            //     'Authorization: Bearer ' . $accessToken['access_token'],
            //     'Content-Type: application/json',
            // ];

            // $payload = [
            //     'message' => [
            //         'notification' => [
            //             'title' => 'New Message',
            //             'body' => $request->message,
            //         ],
            //         'android' => [
            //             'notification' => [
            //                 'sound' => 'default', // or specify a custom sound file
            //             ],
            //         ],
            //         'apns' => [
            //             'payload' => [
            //                 'aps' => [
            //                     'sound' => 'default', // or specify a custom sound file
            //                 ],
            //             ],
            //         ],
            //         'webpush' => [
            //             'notification' => [
            //                 'vibrate' => [100, 50, 100], // optional
            //                 'sound' => url('/notification.mp3'), // specify the sound file URL
            //             ],
            //         ],
            //         'token' => $token,
            //     ],
            // ];
            // Log::info('payload: ' . json_encode($payload));

            // $ch = curl_init();
            // curl_setopt($ch, CURLOPT_URL, $url);
            // curl_setopt($ch, CURLOPT_POST, true);
            // curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            // curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            // curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

            // $response = curl_exec($ch);
            // Log::info('response: ');

            // if ($response === false) {
            //     Log::info('response false: ');

            //     $error = 'Curl error: ' . curl_error($ch);
            //     Log::error($error);
            //     throw new Exception($error);
            // } else {
            //     Log::info('FCM Response: ' . $response);
            // }

            // curl_close($ch);
            return response()->json($message, 201);
        }
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
}
