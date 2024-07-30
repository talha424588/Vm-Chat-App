<?php

namespace App\Services;

use App\Http\Requests\LoginRequestBody;
use App\Http\Resources\GroupResource;
use App\Http\Resources\userResource;
use App\Models\Group;
use App\Models\GroupMessage;
use App\Models\User;
use App\Repositories\GroupRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Repositories\UserRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
class GroupService implements GroupRepository
{
    public function fetchUserChatGroups(Request $request)
    {
        $userId = $request->user_id;
        $userGroups = Group::where('access', 'LIKE', "%{$userId}%")->get();
        if(count($userGroups) > 0)
            return new GroupResource($userGroups);
        else
            return response()->json(["status"=>false,"groups"=> "not found","messages"=>null],404);
    }
}
