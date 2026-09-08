<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userType = $request->user()?->userType;

        if (in_array((int) $userType, [2, 3], true)) {
            return $next($request);
        }

        return response()->json(['message' => 'Forbidden Access'], 403);
    }
}
