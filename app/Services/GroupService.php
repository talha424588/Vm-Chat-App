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

class GroupService implements GroupRepository
{
    public function fetchUserChatGroups(Request $request)
    {

        // $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [$request->id])
        // ->with(['groupMessages' => function ($query) use ($request) {
        //     // $query->orderByRaw("FROM_UNIXTIME(time) desc")
        //     $query->orderBy("id", "desc")->limit(40)->offset($request->input('offset', 0));
        // }, 'groupMessages.user'])
        // ->get();

        // $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [$request->id])
        //     ->with(['groupMessages' => function ($query) {
        //         $query->latest('time');
        //     }, 'groupMessages.user'])
        //     ->get();

        $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [$request->id])
            ->with(['groupMessages' => function ($query) {
                $query->latest('time');
                // ->where('is_deleted', false)
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
    public function getGroupByName($name)
    {
        $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '' )) > 0", [Auth::user()->id])
            ->where('name', 'LIKE', "%$name%")
            ->with(['groupMessages' => function ($query) {
                $query->latest('time')
                    ->where('is_deleted', false);
            }, 'groupMessages.user', 'users_with_access'])
            ->get();

        $userGroups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '' )) > 0", [Auth::user()->id])
            ->pluck('group_id');

        // Now, search for messages in those groups
        $messages = GroupMessage::where("msg", "LIKE", "%$name%")
            ->where('is_deleted', false)
            ->where(function ($query) {
                $query->whereIn("type", ["File", "Message"])
                    ->orWhereNull("type")
                    ->orWhere("type", "");
            })
            ->whereIn('group_id', $userGroups)
            ->with("user", "group")
            ->get();

        $groupMessageSearchArray = [
            "groups" => $groups,
            "messages" => $messages
        ];
        if ($groupMessageSearchArray) {
            return response()->json([
                "status" => true,
                "message" => "success",
                "data" => $groupMessageSearchArray
            ]);
        } else {
            return response()->json([
                "status" => false,
                "message" => "Not Found",
                "groups" => null
            ]);
        }
    }
}
