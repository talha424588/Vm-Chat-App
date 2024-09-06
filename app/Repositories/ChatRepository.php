<?php

namespace App\Repositories;

use App\Http\Requests\LoginRequestBody;

interface ChatRepository
{
    public function searchChatMessages($request);
    public function fetchUserAllGroupsMessages($request);
    public function getMessageStatus($id);
}
