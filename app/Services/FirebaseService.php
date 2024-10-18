<?php

namespace App\Services;

use Exception;
use Google\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;


use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FirebaseService
{
    public function getAccessToken()
    {
        $client = new Client();
        $client->setAuthConfig(storage_path("app/json/vm-chat.json"));
        $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
        $token = $client->fetchAccessTokenWithAssertion();
        return $token['access_token'];
    }

    // public function sendNotification(Request $request)
    // {
    //     $message = $request->message;
    //     $token = trim($request->token, "\"");


    //     Log::info('AccessToken: ' . $this->getAccessToken());
    //     Log::info('Token: ' . $token);

    //     $url = 'https://fcm.googleapis.com/v1/projects/vm-chat-5c18d/messages:send';
    //     $headers = [
    //         'Authorization: Bearer ' . $this->getAccessToken(),
    //         'Content-Type: application/json',
    //     ];

    //     $payload = [
    //         'message' => [
    //             'notification' => [
    //                 'title' => 'New Message',
    //                 'body' => $message,
    //             ],
    //             'token' => $token,
    //         ],
    //     ];
    //     Log::info('payload: ' . json_encode($payload));

    //     $ch = curl_init();
    //     curl_setopt($ch, CURLOPT_URL, $url);
    //     curl_setopt($ch, CURLOPT_POST, true);
    //     curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    //     curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    //     curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

    //     $response = curl_exec($ch);
    //     Log::info('response: ');

    //     if ($response === false) {
    //         Log::info('response false: ');

    //         $error = 'Curl error: ' . curl_error($ch);
    //         Log::error($error);
    //         throw new Exception($error);
    //     } else {
    //         Log::info('FCM Response: ' . $response); // Log successful response
    //     }

    //     curl_close($ch);
    //     return json_decode($response, true);
    // }


    public function sendNotification(Request $request)
    {
        $message = $request->message;

        // Get the token and remove any extra quotes
        $token = trim($request->token, "\"");

        // Get OAuth 2.0 access token from service account credentials
        $accessToken = $this->getAccessToken();

        // Prepare the FCM payload
        $payload = [
            'message' => [
                'token' => $token,
                'notification' => [
                    'title' => 'New Message',
                    'body'  => $message
                ]
            ]
        ];

        // Log the token and payload for debugging
        \Log::info('Token: ' . $token);
        \Log::info('Payload: ' . json_encode($payload));

        // Send the notification using Http client
        $fcmResponse = Http::withToken($accessToken)
            ->post('https://fcm.googleapis.com/v1/projects/vm-chat-5c18d/messages:send', $payload);

        // Log the response for debugging
        \Log::info('FCM Response: ' . $fcmResponse->body());

        // Return the response
        return response()->json(['status' => 'Notification Sent', 'fcm_response' => $fcmResponse->body()]);
    }

    // public function sendNotification(Request $request)
    // {
    //     $factory = (new Factory)->withServiceAccount(base_path("vm-chat.json"));
    //     $messaging = $factory->createMessaging();

    //     $fcmToken = trim($request->token, '"');
    //     Log::info('token: ' .($fcmToken));


    //     $notification = Notification::create($request->senderName, $request->message);
    //     Log::info('notification: ' .json_encode($notification));

    //     $message = CloudMessage::withTarget('token', $fcmToken)
    //         ->withNotification($notification);

    //     try {
    //         $messaging->send($message);
    //         return response()->json(['status' => true, 'message' => 'Notification sent successfully']);
    //     } catch (\Exception $e) {
    //         return response()->json(['status' => false, 'message' => $e->getMessage()]);
    //     }
    // }

}
