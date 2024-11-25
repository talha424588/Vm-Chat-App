<?php

namespace App\Services;

use App\Http\Requests\LoginRequestBody;
use App\Http\Resources\GroupResource;
use App\Http\Resources\MessageResourceCollection;
use App\Http\Resources\userResource;
use App\Models\Group;
use App\Models\GroupMessage;
use App\Models\User;
use App\Repositories\AuthRepository;
use App\Repositories\ChatRepository;
use App\Repositories\GroupRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Repositories\UserRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AuthService implements AuthRepository
{
    public function authenticateUser(Request $request)
    {
        $user = User::where("email", $request->email)->first();;
        if ($user) {
            if (password_verify($request->password,$user->password) && $user->is_deleted == 0) {
                Auth::login($user);
                return redirect()->intended(route('chat'));
            } else {
                return redirect()->back()->withErrors(['email' => 'Invalid email or password']);
            }
        } else {
            return redirect()->back()->withErrors(['email' => 'Invalid email or password']);
        }
        // if (Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
        //     return redirect()->intended(route('chat'));
        // } else {
        //     return redirect()->back()->withErrors(['email' => 'Invalid email or password']);
        // }
    }
}
