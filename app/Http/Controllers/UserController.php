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
        if($request->name)
        $user->name = $request->name;
        if($request->imgUrl)
        $user->profile_img = $request->imgUrl;
        $user->save();
        return response()->json(["status" => 200, "profile" => "updated successfully"],200);
    }
        return response()->json(["status" =>404, "message" => "an error occured while updating"],404);
    }
}
