<?php

namespace App\Services;

use App\Http\Resources\GroupResource;
use App\Models\Group;
use App\Repositories\GroupRepository;
use Illuminate\Http\Request;

class GroupService implements GroupRepository
{
    public function fetchUserChatGroups(Request $request)
    {
        $userGroups = Group::where('access', $request->id)->get();
        if (count($userGroups) > 0)
            return new GroupResource($userGroups);
        else
            return response()->json(["status" => false, "groups" => "not found", "messages" => null], 404);
    }
}
