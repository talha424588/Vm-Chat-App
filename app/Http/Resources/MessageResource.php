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
        $reply = $this->reply ? [
            'id' => $this->reply->id,
            'sender' => $this->reply->sender,
            'group_id' => $this->reply->group_id,
            'msg' => $this->reply->msg,
            'type' => $this->reply->type,
            'media_name' => $this->reply->media_name,
            'reply_id' => $this->reply->reply_id,
            'seen_by' => $this->reply->seen_by,
            'time' => $this->reply->time,
            'is_compose' => $this->reply->is_compose,
            'is_privacy_breach' => $this->reply->is_privacy_breach,
            'is_deleted' => $this->reply->is_deleted,
        ] : null;

        return [
             'id' => $this->id,
            'sender' => $this->sender,
            'group_id' => $this->group_id,
            'msg' => $this->msg,
            'type' => $this->type,
            'media_name' => $this->media_name,
            'reply_id' => $this->reply_id,
            'seen_by' => $this->seen_by,
            'time' => $this->time,
            'is_compose' => $this->is_compose,
            'is_privacy_breach' => $this->is_privacy_breach,
            'is_deleted' => $this->is_deleted,
            'compose_id' => $this->compose_id,
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
                    'pic'=>$this->user->profile_img,
                ],
                'reply' => $reply,
        ];
    }
}
