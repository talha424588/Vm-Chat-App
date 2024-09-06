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
        if (Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            return redirect()->intended(route('chat'));
        } else {
            return redirect()->back()->withErrors(['email' => 'Invalid email or password']);
        }
    }
}
