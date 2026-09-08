<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CinemaController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MovieController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SeatController;
use App\Http\Controllers\ShowtimeController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\IsAdmin;
use Illuminate\Support\Facades\Route;

// Public API Routes
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/admin/login', [AuthController::class, 'adminLogin']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::get('/movies', [MovieController::class, 'index']);
    Route::get('/movies/{movie}', [MovieController::class, 'show']);

    Route::get('/showtimes', [ShowtimeController::class, 'index']);
    Route::get('/showtimes/{showtime}', [ShowtimeController::class, 'show']);

    Route::get('/cinemas', [CinemaController::class, 'index']);
    Route::get('/cinemas/{cinema}', [CinemaController::class, 'show']);

    Route::get('/rooms', [RoomController::class, 'index']);
    Route::get('/rooms/{room}', [RoomController::class, 'show']);
    Route::get('/rooms/{room}/seats', [SeatController::class, 'byRoom']);
});

Route::middleware(['auth:sanctum', IsAdmin::class])->prefix('admin')->group(function () {
    Route::get('/dashboard', function () {
        return response()->json(['data' => 'Welcome to Secret Admin Dashboard!']);
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('cinemas', CinemaController::class);
    Route::apiResource('rooms', RoomController::class);
    Route::apiResource('movies', MovieController::class);
    Route::apiResource('showtimes', ShowtimeController::class);
    Route::apiResource('seats', SeatController::class);
    Route::apiResource('bookings', BookingController::class);
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('invoices', InvoiceController::class);
    Route::apiResource('users', UserController::class);
});
