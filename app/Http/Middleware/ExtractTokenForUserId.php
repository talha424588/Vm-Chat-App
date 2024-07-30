<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ExtractTokenForUserId
{
    public function handle($request, Closure $next)
    {
        if (Auth::guard('sanctum')->check()) {
            $request->merge(['user_id' => Auth::guard('sanctum')->user()->id]);
        }

        return $next($request);
    }
}
