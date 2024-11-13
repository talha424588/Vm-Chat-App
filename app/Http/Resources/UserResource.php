<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'unique_id' => $this->unique_id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'user_status' => $this->user_status,
            'email_status' => $this->email_status,
            'access' => $this->access,
            'chat_status' => $this->chat_status,
            'seen_privacy' => $this->seen_privacy,
            'code' => $this->code,
            'status' => $this->status,
            'token' => $this->when(isset($this->token), $this->token),
            'pic'=>$this->profile_img,
        ];
    }

    public function withResponse($request, $response)
    {
        $response->setData($this->toArray($request));
    }
}
