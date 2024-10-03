<?php

namespace App\Services;

use Exception;
use Google\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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

    public function sendMessageNotification(Request $request)
    {
        $message = $request->message;
        $token = $request->token;

        Log::info('AccessToken: ' . $this->getAccessToken());

        $url = 'https://fcm.googleapis.com/v1/projects/vm-chat-5c18d/messages:send';
        $headers = [
            'Authorization: Bearer ' . $this->getAccessToken(),
            'Content-Type: application/json',
        ];

        $payload = [
            'message' => [
                'notification' => [
                    'title' => 'New Message',
                    'body' => $message,
                ],
                'token' => $token,
            ],
        ];
        Log::info('payload: ' . json_encode($payload));

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

        $response = curl_exec($ch);
        Log::info('response: ');

        if ($response === false) {
            Log::info('response false: ');

            $error = 'Curl error: ' . curl_error($ch);
            Log::error($error);
            throw new Exception($error);
        } else {
            Log::info('FCM Response: ' . $response); // Log successful response
        }

        curl_close($ch);
        return json_decode($response, true);
    }
}
