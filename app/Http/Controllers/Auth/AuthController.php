<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequestBody;
use App\Repositories\AuthRepository;
use Illuminate\Http\Request;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.login');
    }
    public function __construct(protected AuthRepository $authRepository) {}

    public function login(Request $request)
    {
        $validateData = $this->validateRequest($request);
        if ($validateData->fails()) {
            return back()->withErrors($validateData)->withInput();
        }
        return $this->authRepository->authenticateUser($request);
    }

    // public function verifyToken(Request $request)
    // {
    //     return $this->userRepository->varifyUserForSocketConnection($request);
    // }

    public function resetPassword($token)
    {
        return $token;
    }

    public function validateRequest(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|min:6',
        ]);
        return $validator;
    }

    public function logout(Request $request)
    {
        auth()->logout();
        return redirect()->route('login');
    }

}
