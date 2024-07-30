<?php

namespace App\Services;

use App\Http\Requests\LoginRequestBody;
use App\Http\Resources\userResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Repositories\UserRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
class UserService implements UserRepository
{
    public function authenticateUser(LoginRequestBody $request)
    {
        $user = User::where('email' , $request->email)->first();

        if($user && Hash::check($request->password,$user->password))
        {
            $token = $user->createToken('bearer')->plainTextToken;
            $user->token = $token;
            return new UserResource($user->setAttribute('token', $token));
        }
        else
            return response()->json(['status'=>false,'message'=>'not found', 'data' => null]);
    }

    // private function revokeTokenIfExist()
    // {
    //     $user = auth('sanctum')->user();
    //     return $user;
    // }

    // private function validateRequestData(LoginRequestBody $request)
    // {
    //     try {
    //         $validated = $request->validate([
    //             'email' => 'required|email|unique:user|max:255',
    //             'password' => 'required',
    //         ]);

    //         // If validation passes, you can process further here
    //         // For example:
    //         // return response()->json(['message' => 'Validation passed!'], 200);

    //     } catch (ValidationException $e) {
    //         // Return a JSON response with validation errors
    //         return response()->json([
    //             'errors' => $e->errors()
    //         ], 422);
    //     }
    //}
}
