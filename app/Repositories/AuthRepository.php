<?php

namespace App\Repositories;

use App\Http\Requests\LoginRequestBody;

interface AuthRepository
{
    public function authenticateUser(LoginRequestBody $request);
}
