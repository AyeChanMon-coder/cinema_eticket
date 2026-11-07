<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Cinema;
use App\Models\Movie;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'movies' => Movie::count(),
            'cinemas' => Cinema::count(),
            'bookings' => Booking::count(),
            'adminUsers' => User::where('userType', 2)->count(),
        ]);
    }
}
