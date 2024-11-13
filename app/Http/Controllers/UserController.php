<?php

namespace App\Http\Controllers;

use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use App\Models\User;

class UserController extends Controller
{
    //
    public function __construct(protected UserRepository $userRepository) {}

    public function updateUserFcmToken($token)
    {
        return $this->userRepository->updateFcmToken($token);
    }
    public function updateUserProfile(Request $request){

    $user=User::find($request->userId);
    if($user)
    {
        $user->profile_img = $request->imgUrl;
        if($user->save())
        {
            return response()->json(["status" => 200, "profile" => "updated successfully"],200);
        }
    }
    else
    {
        return response()->json(["status" =>404, "message" => "updated successfully"],404);

    }
    }
}
