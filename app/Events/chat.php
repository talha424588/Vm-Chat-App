<?php

namespace App\Events;

use App\Models\GroupMessage;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class Chat implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;
    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(User $user, $message)
    {
        $this->user = $user;
        $this->message = $message;
        Log::info('Chat message received', ['username' => $this->user->name, 'message' => $this->message]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn()
    {

        Log::info('Chat message received', ['username' => $this->user->name, 'message' => $this->message]);
        return new Channel('vmChat');
    }


    public function broadcastAs()
    {
        return 'Chat';
    }

    public function broadcastWith()
    {
        return [
            'type' => 'message',
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
            'message' => $this->message,
        ];
    }
}
