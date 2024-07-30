<?php

namespace App\Repositories;

use App\Http\Requests\LoginRequestBody;
use Illuminate\Http\Request;

interface GroupRepository
{
    public function fetchUserChatGroups(Request $request);
}
