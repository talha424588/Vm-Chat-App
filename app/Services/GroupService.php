<?php

namespace App\Services;

use App\Http\Resources\GroupResource;
use App\Models\Group;
use App\Models\GroupMessage;
use App\Models\User;
use App\Repositories\GroupRepository;
use Illuminate\Http\Request;
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

        // // $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [$request->id])->get();
        // foreach ($groups as $group) {
        //     $userIds = explode(',', $group->access);
        //     $group->users_with_access = User::whereIn('id', $userIds)->get();
        // }

        $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [$request->id])
        ->with(['groupMessages' => function ($query) {
            $query->latest('time');
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
}
