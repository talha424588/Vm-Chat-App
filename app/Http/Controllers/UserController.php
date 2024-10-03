<?php

namespace App\Http\Controllers;

use App\Repositories\UserRepository;
use Illuminate\Http\Request;

class UserController extends Controller
{
    //
    public function __construct(protected UserRepository $userRepository) {}

    public function updateUserFcmToken($token)
    {
        return $this->userRepository->updateFcmToken($token);
    }
}
