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
        ];
    }
}
