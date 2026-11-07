<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Showtime;
use App\Services\SeatHoldService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function index(SeatHoldService $seatHoldService): JsonResponse
    {
        $seatHoldService->expireOverdue();
        $bookings = Booking::with(['user', 'showtime.movie', 'showtime.room.cinema', 'seats', 'payment'])->get();

        return response()->json($bookings);
    }

    public function customerIndex(Request $request, SeatHoldService $seatHoldService): JsonResponse
    {
        $seatHoldService->expireOverdue();

        return response()->json(
            Booking::where('userId', $request->user()->userId)
                ->with(['showtime.movie', 'showtime.room.cinema', 'seats', 'payment.paymentMethod'])
                ->latest('bookingId')
                ->get()
        );
    }

    public function store(Request $request, SeatHoldService $seatHoldService): JsonResponse
    {
        $data = $request->validate([
            'bookingDate' => 'required|date',
            'status' => 'required|string|in:pending,confirmed,cancelled',
            'userId' => 'required|exists:users,userId',
            'showtimeId' => 'required|exists:showtimes,showtimeId',
            'seatIds' => 'required|array|min:1',
            'seatIds.*' => 'required|integer|distinct|exists:seats,seatId',
        ]);

        $booking = DB::transaction(function () use ($data, $seatHoldService) {
            $showtime = Showtime::whereKey($data['showtimeId'])->lockForUpdate()->firstOrFail();
            abort_unless($showtime->isUpcoming(), 422, 'This showtime has already started.');

            $seatHoldService->lockAndAssertAvailable(
                $showtime,
                $data['seatIds'],
                checkAvailability: in_array($data['status'], ['pending', 'confirmed'], true),
            );

            $booking = Booking::create([
                'bookingDate' => $data['bookingDate'],
                'status' => $data['status'],
                'userId' => $data['userId'],
                'showtimeId' => $data['showtimeId'],
                'holdExpiresAt' => $data['status'] === 'pending' ? now()->addMinutes(15) : null,
            ]);
            $booking->seats()->attach($data['seatIds']);

            return $booking;
        });

        return response()->json($booking->load(['user', 'showtime.movie', 'showtime.room.cinema', 'seats', 'payment']), 201);
    }

    public function show(Booking $booking, SeatHoldService $seatHoldService): JsonResponse
    {
        $seatHoldService->expireOverdue();

        return response()->json($booking->fresh()->load(['user', 'showtime.movie', 'showtime.room.cinema', 'seats', 'payment']));
    }

    public function update(Request $request, Booking $booking, SeatHoldService $seatHoldService): JsonResponse
    {
        $seatHoldService->expireOverdue();
        $data = $request->validate([
            'bookingDate' => 'sometimes|required|date',
            'status' => 'sometimes|required|string|in:pending,confirmed,cancelled',
            'seatIds' => 'sometimes|required|array|min:1',
            'seatIds.*' => 'required|integer|distinct|exists:seats,seatId',
        ]);

        $booking = DB::transaction(function () use ($data, $booking, $seatHoldService) {
            $booking = Booking::whereKey($booking->bookingId)->lockForUpdate()->firstOrFail();
            $showtime = Showtime::whereKey($booking->showtimeId)->lockForUpdate()->firstOrFail();
            $seatIds = $data['seatIds'] ?? $booking->seats()->pluck('seats.seatId')->all();
            $status = $data['status'] ?? $booking->status;

            abort_unless($showtime->isUpcoming(), 422, 'This showtime has already started.');
            if ($status === 'pending') {
                $payment = $booking->payment()->lockForUpdate()->first();
                abort_if(
                    $payment && $payment->paymentStatus !== 'pending',
                    422,
                    'A payment that is no longer pending cannot be reopened.'
                );
            }
            $seatHoldService->lockAndAssertAvailable(
                $showtime,
                $seatIds,
                $booking->bookingId,
                in_array($status, ['pending', 'confirmed'], true),
            );

            $wasPending = $booking->status === 'pending';
            $booking->fill(collect($data)->except('seatIds')->all());
            if ($status === 'pending' && (! $wasPending || ! $booking->holdExpiresAt || $booking->holdExpiresAt->lte(now()))) {
                $booking->holdExpiresAt = now()->addMinutes(15);
            } elseif ($status !== 'pending') {
                $booking->holdExpiresAt = null;
            }
            $booking->save();
            if (isset($data['seatIds'])) {
                $booking->seats()->sync($seatIds);
            }
            if ($status === 'cancelled') {
                $booking->payment()->where('paymentStatus', 'pending')->update(['paymentStatus' => 'cancelled']);
            }

            return $booking;
        });

        return response()->json($booking->load(['user', 'showtime.movie', 'showtime.room.cinema', 'seats', 'payment']));
    }

    public function destroy(Booking $booking): JsonResponse
    {
        DB::transaction(function () use ($booking) {
            $booking = Booking::whereKey($booking->bookingId)->lockForUpdate()->firstOrFail();
            $booking->update(['status' => 'cancelled', 'holdExpiresAt' => null]);
            $booking->payment()->where('paymentStatus', 'pending')->update(['paymentStatus' => 'cancelled']);
        });

        return response()->json(null, 204);
    }
}
