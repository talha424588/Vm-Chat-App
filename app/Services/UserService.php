<?php

namespace App\Services;

use App\Http\Requests\LoginRequestBody;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
class UserService implements UserRepository
{


    public function updateFcmToken($token)
    {
        $user = User::findorFail(Auth::user()->id);
        if($user)
        {
            $user->fcm_token = $token;
            if($user->save())
                return response()->json(["status"=>true,"message"=>"success"],200);
            else
                return response()->json(["status"=>false,"message"=>"something went wrong"],500);
        }
    }
    // public function authenticateUser(LoginRequestBody $request)
    // {
    //     $user = User::where('email' , $request->email)->first();

    //     if($user && Hash::check($request->password,$user->password))
    //     {
    //         $token = $user->createToken('bearer')->plainTextToken;
    //         $user->token = $token;
    //         return new UserResource($user->setAttribute('token', $token));
    //     }
    //     else
    //         return response()->json(['status'=>false,'message'=>'not found', 'data' => null]);
    // }

    // public function varifyUserForSocketConnection($request)
    // {
    //     $token = $this->getTokenFromHeaders($request);
    //     $user = auth('sanctum')->authenticate($token);
    //     return response()->json(["status" => true, "user" => $user]);
    // }

    // private function getTokenFromHeaders(Request $request)
    // {
    //     $token = $request->header('Authorization');
    //     $token = str_replace('Bearer ', '', $token);
    //     return $token;
    // }

    // private function revokeTokenIfExist()
    // {
    //     $user = auth('sanctum')->user();
    //     return $user;
    // }
}
