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
        // $userGroups = DB::table('user')
        //     ->join('groups', 'user.id', '=', 'groups.access')
        //     ->join('group_messages','groups.group_id' ,'=', 'group_messages.group_id')
        //     ->select('user.*','groups.*','group_messages.*')
        //     ->where('groups.access', '=', $request->id)
        //     ->get();

        // $specificId = 38;
        // $user = Group::whereRaw('FIND_IN_SET(38,access)')->get();
        // return DB::table('groups')->whereRaw("find_in_set('7',access)")->get();

        // return $user;
        // exit;

        $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [$request->id])
        ->with(['groupMessages' => function ($query) use ($request) {
            // $query->orderByRaw("FROM_UNIXTIME(time) desc")
            $query->orderBy("id", "desc")
                ->limit(40)
                ->offset($request->input('offset', 0));
        }, 'groupMessages.user'])
        ->get();


        // $groups = Group::whereRaw("FIND_IN_SET(?, REPLACE(access, ' ', '')) > 0", [$request->id])->get();
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
