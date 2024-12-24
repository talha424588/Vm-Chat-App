<?php

namespace App\Services;

use App\Http\Resources\GroupResource;
use App\Models\Group;
use App\Models\GroupMessage;
use App\Models\User;
use App\Repositories\GroupRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Enum\MessageEnum as EnumMessageEnum;

class GroupService implements GroupRepository
{
    public function fetchUserChatGroups(Request $request)
    {
        $groupWithMessagesArray = [];
        if (Auth::user()->role == 2 || Auth::user()->role == 0) {
            $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [Auth::user()->id])
             ->where("status",1)
            ->with(['groupMessages' => function ($query) {
                    $query->latest('time')
                        // ->where('is_deleted', false)
                        ->whereNot('status', EnumMessageEnum::MOVE);
                }, 'groupMessages.user'])
                ->get();
        } else {
            $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [Auth::user()->id])
                ->with(['groupMessages' => function ($query) {
                    $query->latest('time')
                        ->where('is_privacy_breach', false)
                        ->whereNot('status', EnumMessageEnum::MOVE);
                }, 'groupMessages.user'])
                ->get();
        }

        $groupWithMessagesArray =  $this->alterGroupMessageArray($groups);
        $groupUnreadCount = $this->getUserUnreadMessageCount();
        foreach ($groupWithMessagesArray  as &$group) {
            foreach ($groupUnreadCount as $groupCount) {
                if ($group->group_id == $groupCount['group_id']) {
                    $group->unread_count = $groupCount['unread_count'];
                }
            }
        }
        if (count($groupWithMessagesArray) > 0)
            return new GroupResource($groupWithMessagesArray);
        else
            return response()->json(["status" => false, "groups" => "not found", "messages" => null], 404);
    }

    private function alterGroupMessageArray($groups)
    {
        foreach ($groups as $group) {
            $message =  $group->groupMessages;
            $group->group_messages = [];
            $userIds = explode(',', $group->access);
            $group->users_with_access = User::whereIn('id', $userIds)->get();
            if (isset($group->groupMessages)) {
                unset($group->groupMessages);
                $group->group_messages = [$message];;
            }
        }
        return $groups;
    }

    private function getUserUnreadMessageCount()
    {
        $groupDetails = [];
        $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [Auth::user()->id])
            ->with(['UserAllgroupMessages' => function ($query) {
                $query->latest('time')
                    ->whereNot('status', EnumMessageEnum::MOVE);
            }, 'UserAllgroupMessages.user'])
            ->get();

        foreach ($groups as $group) {
            $counter = 0;
            foreach ($group->UserAllgroupMessages as $groupMessage) {
                $seenBy = explode(",", $groupMessage->seen_by);
                if (!in_array(Auth::user()->unique_id, $seenBy)) {
                    $counter++;
                }
            }
            $groupDetails[] = [
                "name" => $group->name,
                "group_id" => $group->group_id,
                "unread_count" => $counter
            ];
        }

        return $groupDetails;
    }

    public function fetchUnreadMessageGroups()
    {
        $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '' )) > 0", [Auth::user()->id])
            ->with(['groupMessages' => function ($query) {
                $query->latest('time')
                    ->where('is_deleted', false);
            }, 'groupMessages.user'])
            ->get();

        $unreadGroups = [];
        foreach ($groups as $eachGroup) {
            $groupMessages = $eachGroup->groupMessages;

            foreach ($groupMessages as $message) {
                $array = explode(',', $message['seen_by']);
                $string = implode(',', $array);
                $user_unique_id = explode(',', $string);
                if (!in_array(Auth::user()->unique_id, $user_unique_id)) {
                    $unreadGroups[] = $eachGroup;
                }
            }
        }
        if (count($groups) > 0) {
            return response()->json(["status" => true, "message" => "Sucess", "groups" => $groups], 200);
        } else
            return response()->json(["status" => false, "message" => "Not Found", "groups" => null], 404);
    }

    public function getGroupByName($name, $request)
    {
        $perPageGroups = 20;
        $perPageMessages = 40;
        $pageGroups = $request->input('page_groups', 1);
        $pageMessages = $request->input('page_messages', 1);
        $groupWithMessagesArray = [];

        $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '' )) > 0", [Auth::user()->id])
            ->where('name', 'LIKE', "%$name%")
            ->with(['groupMessages' => function ($query) {
                $query->latest('time')->where('is_deleted', false);
            }, 'groupMessages.user', 'users_with_access'])
            ->paginate($perPageGroups, ['*'], 'page', $pageGroups);

        $groupWithMessagesArray =  $this->alterGroupMessageArray($groups);

        $userGroups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '' )) > 0", [Auth::user()->id])
            ->pluck('group_id');

        $messages = GroupMessage::where("msg", "LIKE", "%$name%")
            ->where('is_deleted', false)
            ->where(function ($query) {
                $query->whereIn("type", ["File", "Message"])
                    ->orWhereNull("type")
                    ->orWhere("type", "");
            })
            ->whereIn('group_id', $userGroups)
            ->whereRaw("NOT (msg REGEXP '<a[^>]*>|<audio[^>]*>')")
            ->with("user", "group")
            ->paginate($perPageMessages, ['*'], 'page', $pageMessages);

        if ($groupWithMessagesArray->isEmpty() && $messages->isEmpty()) {
            return response()->json([
                'status' => false,
                'message' => 'No groups or messages found.',
                'data' => [
                    'groups' => [],
                    'messages' => []
                ]
            ]);
        }

        return response()->json([
            "status" => true,
            "message" => "success",
            "data" => [
                "groups" => $groups,
                "messages" => $messages
            ]
        ]);
    }



    public function fetchGroupById($id)
    {
        $group = Group::where("group_id", $id)->first();
        $userIds = explode(",", $group->access);
        $group->users_with_access = User::whereIn('id', $userIds)->get();
        return response()->json($group);
    }

    public function fetchGroupLastMessage($groupId)
    {
        if (Auth::user()->role == 0 || Auth::user()->role == 2) {
            $lastestNotDeletedMessage = GroupMessage::with("user")->where("group_id", $groupId)->orderBy("id", "Desc")->first();
        } else {
            $lastestNotDeletedMessage = GroupMessage::with("user")->where("group_id", $groupId)->where('is_deleted', 0)->orderBy("id", "Desc")->first();
        }
        return response()->json($lastestNotDeletedMessage);
    }
}
