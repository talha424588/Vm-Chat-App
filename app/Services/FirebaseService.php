<?php

namespace App\Services;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class FirebaseService
{

    // public function sendNotification(Request $request)
    // {
    //     $senderName = $request->input('senderName', 'Default Sender');
    //     $messageContent = $request->input('message', 'Default Message');
    //     $subsIds = $request->input('subsIds');
    //     $subsIdsArray = is_string($subsIds) ? json_decode($subsIds, true) : $subsIds;

    //     $validSubscriptionIds = is_array($subsIdsArray) ? array_filter($subsIdsArray, function ($id) {
    //         return !is_null($id);
    //     }) : [];
    //     $validSubscriptionIds = array_map('trim', $validSubscriptionIds);
    //     Log::info('Valid Subscription IDs:', $validSubscriptionIds);
    //     $fullMessage = "$senderName $messageContent";

    //     $response = Http::withHeaders([
    //         'Authorization' => 'Basic MGZjOWMzNTctMzlmOS00ZjMxLWE4MmUtNzIxOTkyZjFmYjhm',
    //         'Accept' => 'application/json',
    //         'Content-Type' => 'application/json',
    //     ])->post('https://api.onesignal.com/notifications', [
    //         'app_id' => 'd9ec86fd-fc8c-4567-8573-0428916eb93e',
    //         'target_channel' => 'push',
    //         'headings' => ['en' => 'Vm Chat'],
    //         'contents' => ['en' => $fullMessage],
    //         'include_subscription_ids' => ["8e57cc49-8fa1-46ed-aa0f-36f59541f792","8e57cc49-8fa1-46ed-aa0f-36f59541f791","8e57cc49-8fa1-46ed-aa0f-36f59541f793"],
    //     ]);
    //     Log::info('Valid Subscription IDs:', $validSubscriptionIds);
    //     Log::info('OneSignal Response:', $response->json());
    //     return $response->json();
    // }



    public function sendNotification(Request $request)
    {
        $senderName = $request->input('senderName', 'Default Sender');
        $messageContent = $request->input('message', 'Default Message');
        $subsIds = $request->input('subsIds');

        $subsIdsArray = is_string($subsIds) ? json_decode($subsIds, true) : $subsIds;

        if (json_last_error() !== JSON_ERROR_NONE) {
            return response()->json(['error' => 'Invalid subscription IDs format'], 400);
        }

        $validSubscriptionIds = is_array($subsIdsArray) ? array_filter($subsIdsArray, function ($id) {
            return !is_null($id);
        }) : [];
        $validSubscriptionIds = array_map('trim', $validSubscriptionIds);

        Log::info('Valid Subscription IDs:', $validSubscriptionIds);

        if (empty($validSubscriptionIds)) {
            return response()->json(['error' => 'No valid subscription IDs provided'], 400);
        }

        $fullMessage = "$senderName\n$messageContent";

        Log::info('Request Payload:', [
            'app_id' => 'd9ec86fd-fc8c-4567-8573-0428916eb93e',
            'headings' => ['en' => 'Vm Chat'],
            'contents' => ['en' => $fullMessage],
            'include_subscription_ids' => $validSubscriptionIds,
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Basic MGZjOWMzNTctMzlmOS00ZjMxLWE4MmUtNzIxOTkyZjFmYjhm',
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->post('https://api.onesignal.com/notifications', [
                'app_id' => 'd9ec86fd-fc8c-4567-8573-0428916eb93e',
                'target_channel' => 'push',
                'headings' => ['en' => 'Vm Chat'],
                'contents' => ['en' => $fullMessage],
                'include_subscription_ids' => array_values($validSubscriptionIds),
            ]);

            if ($response->failed()) {
                Log::error('OneSignal Error:', $response->json());
                return response()->json(['error' => 'Failed to send notification'], $response->status());
            }

            Log::info('OneSignal Response:', $response->json());
            return $response->json();
        } catch (\Exception $e) {
            Log::error('Exception occurred:', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'An error occurred while sending notification'], 500);
        }
    }


}
