<?php

namespace App\Repositories;

use App\Http\Requests\LoginRequestBody;

interface ChatRepository
{
    public function searchChatMessages($request);
    public function fetchUserAllGroupsMessages($request);
    public function getMessageStatus($id);
    public function updateMessageIsReadStatus($request);
    public function searchGroupMessages($query, $groupId, $offset, $limit);
    public function getMessageById($id);
    public function updateMessage($request);
    public function messageCorrection($request);
    public function restoreDeletedMessage($id);
    public function openChatGroup($request,$groupId);
    public function messageDeleteStatusCheck($request);
}
