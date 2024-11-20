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

        $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [$request->id])
            ->with(['groupMessages' => function ($query) {
                $query->latest('time')
                    // ->where('is_deleted', false)
                    ->whereNot('status', EnumMessageEnum::MOVE);
            }, 'groupMessages.user'])
            ->get();


        foreach ($groups as $group) {
            $userIds = explode(',', $group->access);
            $group->users_with_access = User::whereIn('id', $userIds)->get();
        }

        if (count($groups) > 0)
            return new GroupResource($groups);
        else
            return response()->json(["status" => false, "groups" => "not found", "messages" => null], 404);
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

    // working
    // public function getGroupByName($name)
    // {
    //     $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '' )) > 0", [Auth::user()->id])
    //         ->where('name', 'LIKE', "%$name%")
    //         ->with(['groupMessages' => function ($query) {
    //             $query->latest('time')
    //                 ->where('is_deleted', false);
    //         }, 'groupMessages.user', 'users_with_access'])
    //         ->get();

    //     $userGroups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '' )) > 0", [Auth::user()->id])
    //         ->pluck('group_id');

    //     // Now, search for messages in those groups
    //     $messages = GroupMessage::where("msg", "LIKE", "%$name%")
    //         ->where('is_deleted', false)
    //         ->where(function ($query) {
    //             $query->whereIn("type", ["File", "Message"])
    //                 ->orWhereNull("type")
    //                 ->orWhere("type", "");
    //         })
    //         ->whereIn('group_id', $userGroups)
    //         ->with("user", "group")
    //         ->get();

    //     $groupMessageSearchArray = [
    //         "groups" => $groups,
    //         "messages" => $messages
    //     ];
    //     if ($groupMessageSearchArray) {
    //         return response()->json([
    //             "status" => true,
    //             "message" => "success",
    //             "data" => $groupMessageSearchArray
    //         ]);
    //     } else {
    //         return response()->json([
    //             "status" => false,
    //             "message" => "Not Found",
    //             "groups" => null
    //         ]);
    //     }
    // }

    public function getGroupByName($name, $request)
    {
        $perPageGroups = 20;
        $perPageMessages = 40;
        $pageGroups = $request->input('page_groups', 1);
        $pageMessages = $request->input('page_messages', 1);

        $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '' )) > 0", [Auth::user()->id])
            ->where('name', 'LIKE', "%$name%")
            ->with(['groupMessages' => function ($query) {
                $query->latest('time')->where('is_deleted', false);
            }, 'groupMessages.user', 'users_with_access'])
            ->paginate($perPageGroups, ['*'], 'page', $pageGroups);

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
            -> whereRaw("NOT (msg REGEXP '<a[^>]*>|<audio[^>]*>')")
            ->with("user", "group")
            ->paginate($perPageMessages, ['*'], 'page', $pageMessages);

        if ($groups->isEmpty() && $messages->isEmpty()) {
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

        // Extract the access column and split it into an array of user IDs
        $userIds = explode(",", $group->access);

        // Fetch users with the specified user IDs
        $group->users_with_access = User::whereIn('id', $userIds)->get();

        // Return the group with users attached
        return response()->json($group);
    }
}
