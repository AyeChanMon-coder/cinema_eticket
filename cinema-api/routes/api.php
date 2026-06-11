<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Middleware\IsAdmin;
use Illuminate\Support\Facades\Route;

// Public Route (Rate Limit for Brute-force)
Route::middleware('throttle:5,1')->post('/login', [AuthController::class, 'login']);

// Protected Admin Routes (Requires Authentication and Admin Role)
Route::middleware(['auth:sanctum', IsAdmin::class])->group(function () {

    Route::get('/admin/dashboard', function () {
        return response()->json(['data' => 'Welcome to Secret Admin Dashboard!']);
    });

    Route::post('/logout', [AuthController::class, 'logout']);
});
