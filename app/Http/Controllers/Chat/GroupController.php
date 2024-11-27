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

    public function getUserUnreadMessageCount()
{
    $groupDetails = []; // Initialize an array to store all group details
    $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [Auth::user()->id])
        ->with(['UserAllgroupMessages' => function ($query) {
            $query->latest('time')
                ->whereNot('status', EnumMessageEnum::MOVE);
        }, 'UserAllgroupMessages.user'])
        ->get();

    foreach ($groups as $group) {
        $counter = 0; // Reset counter for each group
        foreach ($group->UserAllgroupMessages as $groupMessage) {
            $seenBy = explode(",", $groupMessage->seen_by);
            if (!in_array(Auth::user()->unique_id, $seenBy)) {
                $counter++; // Increment counter for each unread message
            }
        }
            $groupDetails[] = [
                "name" => $group->name,
                "group_id" => $group->group_id,
                "unread_count" => $counter
            ];
    }

    return $groupDetails; // Return all group details
}

}
