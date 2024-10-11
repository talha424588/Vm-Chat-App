<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class MessageResourceCollection extends ResourceCollection
{
    public static $wrap = null;

    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    // public function toArray(Request $request)
    // {
    //     return $this->collection->map(function ($message) {
    //         return [
    //             'id' => $message->id,
    //             'sender' => $message->sender,
    //             'group_id' => $message->group_id,
    //             'msg' => $message->msg,
    //             'reply_id' => $message->reply_id,
    //             'seen_by' => $message->seen_by,
    //             'time' => $message->time,
    //             'type' => $message->type,
    //             'media_name' => $message->media_name,
    //             'user' => [
    //                 'id' => $message->user->id,
    //                 'unique_id' => $message->user->unique_id,
    //                 'name' => $message->user->name,
    //                 'email' => $message->user->email,
    //                 'role' => $message->user->role,
    //                 'user_status' => $message->user->user_status,
    //                 'email_status' => $message->user->email_status,
    //                 'access' => $message->user->access,
    //                 'chat_status' => $message->user->chat_status,
    //                 'seen_privacy' => $message->user->seen_privacy,
    //                 'code' => $message->user->code,
    //                 'status' => $message->user->status,
    //             ],
    //         ];
    //     });
    // }
    public function toArray(Request $request)
{
    return $this->collection->map(function ($message) {
        $reply = $message->reply ? [
            'id' => $message->reply->id,
            'sender' => $message->reply->sender,
            'group_id' => $message->reply->group_id,
            'msg' => $message->reply->msg,
            'type' => $message->reply->type,
            'media_name' => $message->reply->media_name,
            'reply_id' => $message->reply->reply_id,
            'seen_by' => $message->reply->seen_by,
            'time' => $message->reply->time,
            'is_compose' => $message->is_compose,
        ] : null;

        return [
            'id' => $message->id,
            'sender' => $message->sender,
            'group_id' => $message->group_id,
            'msg' => $message->msg,
            'reply_id' => $message->reply_id,
            'seen_by' => $message->seen_by,
            'time' => $message->time,
            'type' => $message->type,
            'media_name' => $message->media_name,
            'is_compose' => $message->is_compose,
            'user' => [
                'id' => $message->user->id,
                'unique_id' => $message->user->unique_id,
                'name' => $message->user->name,
                'email' => $message->user->email,
                'role' => $message->user->role,
                'user_status' => $message->user->user_status,
                'email_status' => $message->user->email_status,
                'access' => $message->user->access,
                'chat_status' => $message->user->chat_status,
                'seen_privacy' => $message->user->seen_privacy,
                'code' => $message->user->code,
                'status' => $message->user->status,
                'fcm_token' => $message->user->fcm_token,
            ],
            'reply' => $reply,
        ];
    });
}

    public function withResponse($request, $response)
    {
        $response->setData($this->toArray($request));
    }
}
