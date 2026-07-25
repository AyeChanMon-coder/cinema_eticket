<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::with('bookings.showtime.movie', 'bookings.showtime.room.cinema')->get();
        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user->load('bookings.showtime.movie', 'bookings.showtime.room.cinema'));
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();
        return response()->json(null, 204);
    }
}
