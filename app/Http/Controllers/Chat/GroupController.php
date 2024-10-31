<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Repositories\GroupRepository;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    public  function __construct(protected GroupRepository $groupRepository)
    {

    }   //
    public function getUserChatGroup(Request $request)
    {
        return $this->groupRepository->fetchUserChatGroups($request);
    }

    public function getUnreadMessageGroups()
    {
        return $this->groupRepository->fetchUnreadMessageGroups();
    }

    public function getChatGroupsByName($name,Request $request)
    {
        return $this->groupRepository->getGroupByName($name, $request);
    }
}
