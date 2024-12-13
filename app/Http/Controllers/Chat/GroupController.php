<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Repositories\GroupRepository;
use Illuminate\Http\Request;
use App\Enum\MessageEnum as EnumMessageEnum;
use App\Models\User;
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

    public function updateGroupMessageReadStatus()
    {
        set_time_limit(600000);

        $groups = Group::with('groupAllMessages')->get();
        foreach ($groups as $group) {
            $acces = explode(", ", $group->access);
            $users = User::whereIn("id", $acces)->get();
            foreach ($users as $user) {
                foreach ($group->groupAllMessages as $message) {
                    $seenBy = explode(", ", $message->seen_by);
                    if (!in_array($user->unique_id, $seenBy)) {
                        $seenBy[] = $user->unique_id;
                        $message->seen_by = implode(', ', $seenBy);
                        $message->save();
                    }
                }
            }
        }
        return response()->json(["success"]);;
    }
}
