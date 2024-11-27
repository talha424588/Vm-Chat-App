<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Repositories\GroupRepository;
use Illuminate\Http\Request;
use App\Enum\MessageEnum as EnumMessageEnum;
use Illuminate\Support\Facades\Auth;

class GroupController extends Controller
{
    public  function __construct(protected GroupRepository $groupRepository) {}   //
    public function getUserChatGroup(Request $request)
    {
        return $this->groupRepository->fetchUserChatGroups($request);
    }

    public function getUnreadMessageGroups()
    {
        return $this->groupRepository->fetchUnreadMessageGroups();
    }

    public function getChatGroupsByName($name, Request $request)
    {
        return $this->groupRepository->getGroupByName($name, $request);
    }


    public function getGroupById($id)
    {
        return $this->groupRepository->fetchGroupById($id);
    }

    public function getGroupLastMessage($groupId)
    {
        return $this->groupRepository->fetchGroupLastMessage($groupId);
    }
}
