<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequestBody;
use Illuminate\Http\Request;
use App\Repositories\UserRepository;

class AuthController extends Controller
{
    public function __construct(protected UserRepository $userRepository)
    {
    }

    public function login(LoginRequestBody $request)
    {
        return $this->userRepository->authenticateUser($request);
    }

    public function verifyToken(Request $request)
    {
        return $this->userRepository->varifyUserForSocketConnection($request);
    }

    public function resetPassword($token)
    {
        return $token;
    }

}
