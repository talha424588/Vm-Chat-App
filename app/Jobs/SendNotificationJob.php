<?php

namespace App\Jobs;

use App\Http\Controllers\Chat\ChatController;
use App\Services\FirebaseService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\Request;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private $token;
    private $senderName;
    private $message;
    private $firebaseService;

    public function __construct($token,$senderName, $message, FirebaseService $firebaseService)
    {
        $this->token = $token;
        $this->senderName = $senderName;
        $this->message = $message;
        $this->firebaseService = $firebaseService;
    }

    public function handle()
    {
        $request = new Request();
        $request->merge([
            'senderName' => $this->senderName,
            'message' => $this->message,
            'token' => $this->token
        ]);

        $this->firebaseService->sendNotification($request);
    }
}
