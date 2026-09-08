<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ((int) $request->user()?->userType === 3) {
            return $next($request);
        }

        return response()->json(['message' => 'Superadmin access is required'], 403);
    }
}