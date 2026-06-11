<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);
        if(!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid Email or Password'], 401);
        }
        /** @var User $user */
        $user = Auth::user();
        if($user->userType !== 3) {
            return response()->json(['message' => 'Unauthorized user'], 403);
        }
        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'userType' => $user->userType,
        ]);





    }
    public function logout(Request $request)
    {
        // destroy the current access token
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            'message' => 'Logged out successfully'
        ], 200);
    }
}
