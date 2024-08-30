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

        $userGroups = User::with(['groups', 'groupMessages'])
        ->where('id', $request->id)
        ->get();

        if (count($userGroups) > 0)
            return new GroupResource($userGroups);
        else
            return response()->json(["status" => false, "groups" => "not found", "messages" => null], 404);
    }
}
