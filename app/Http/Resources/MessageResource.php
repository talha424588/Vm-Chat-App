<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public static $wrap = null;
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sender' => $this->sender,
            'group_id' => $this->group_id,
            'msg' => $this->msg,
            'reply_id' => $this->reply_id,
            'seen_by' => $this->seen_by,
            'time' => $this->time,
            'user' => [
                    'id' => $this->user->id,
                    'unique_id' => $this->user->unique_id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'role' => $this->user->role,
                    'user_status' => $this->user->user_status,
                    'email_status' => $this->user->email_status,
                    'access' => $this->user->access,
                    'chat_status' => $this->user->chat_status,
                    'seen_privacy' => $this->user->seen_privacy,
                    'code' => $this->user->code,
                    'status' => $this->user->status,
                ],
        ];
    }
}
