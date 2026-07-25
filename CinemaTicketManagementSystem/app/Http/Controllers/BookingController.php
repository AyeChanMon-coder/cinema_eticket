<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Seat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(): JsonResponse
    {
        $bookings = Booking::with(['user', 'showtime.movie', 'showtime.room.cinema', 'seats', 'payment'])->get();
        return response()->json($bookings);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bookingDate' => 'required|date',
            'status' => 'required|string|in:pending,confirmed,cancelled',
            'userId' => 'required|exists:users,userId',
            'showtimeId' => 'required|exists:showtimes,showtimeId',
            'seatIds' => 'required|array|min:1',
            'seatIds.*' => 'required|exists:seats,seatId',
        ]);

        $seatIds = $data['seatIds'];
        unset($data['seatIds']);

        $booking = Booking::create($data);
        $booking->seats()->attach($seatIds);
        Seat::whereIn('seatId', $seatIds)->update(['isBooked' => true]);

        return response()->json($booking->load(['user', 'showtime.movie', 'showtime.room.cinema', 'seats', 'payment']), 201);
    }

    public function show(Booking $booking): JsonResponse
    {
        return response()->json($booking->load(['user', 'showtime.movie', 'showtime.room.cinema', 'seats', 'payment']));
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        $data = $request->validate([
            'bookingDate' => 'sometimes|required|date',
            'status' => 'sometimes|required|string|in:pending,confirmed,cancelled',
            'seatIds' => 'sometimes|required|array|min:1',
            'seatIds.*' => 'required|exists:seats,seatId',
        ]);

        if (isset($data['seatIds'])) {
            $newSeatIds = $data['seatIds'];
            $oldSeatIds = $booking->seats()->pluck('seatId')->toArray();
            $booking->seats()->sync($newSeatIds);
            Seat::whereIn('seatId', array_diff($oldSeatIds, $newSeatIds))->update(['isBooked' => false]);
            Seat::whereIn('seatId', array_diff($newSeatIds, $oldSeatIds))->update(['isBooked' => true]);
            unset($data['seatIds']);
        }

        $booking->update($data);
        return response()->json($booking->load(['user', 'showtime.movie', 'showtime.room.cinema', 'seats', 'payment']));
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $seatIds = $booking->seats()->pluck('seatId')->toArray();
        $booking->seats()->detach();
        Seat::whereIn('seatId', $seatIds)->update(['isBooked' => false]);
        $booking->delete();

        return response()->json(null, 204);
    }
}
