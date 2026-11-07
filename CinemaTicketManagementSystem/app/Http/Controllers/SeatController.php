<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Seat;
use App\Models\Showtime;
use App\Services\SeatHoldService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeatController extends Controller
{
    public function index(): JsonResponse
    {
        $seats = Seat::with('room')->get();

        return response()->json($seats);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'seatNumber' => 'required|string|max:100',
            'seatType' => 'required|string|max:100',
            'seatPrice' => 'required|integer|min:0',
            'roomId' => 'required|exists:rooms,roomId',
        ]);

        $seat = Seat::create($data);

        return response()->json($seat, 201);
    }

    public function show(Seat $seat): JsonResponse
    {
        return response()->json($seat->load('room'));
    }

    public function update(Request $request, Seat $seat): JsonResponse
    {
        $data = $request->validate([
            'seatNumber' => 'sometimes|required|string|max:100',
            'seatType' => 'sometimes|required|string|max:100',
            'seatPrice' => 'sometimes|required|integer|min:0',
            'roomId' => 'sometimes|required|exists:rooms,roomId',
        ]);

        $seat->update($data);

        return response()->json($seat);
    }

    public function destroy(Seat $seat): JsonResponse
    {
        $seat->delete();

        return response()->json(null, 204);
    }

    public function byRoom(Room $room): JsonResponse
    {
        return response()->json($room->load('seats')->seats);
    }

    public function byShowtime(Showtime $showtime, SeatHoldService $seatHoldService): JsonResponse
    {
        abort_unless($showtime->isUpcoming(), 422, 'This showtime has already started.');

        $seatHoldService->expireOverdue();
        $bookedSeatIds = $seatHoldService->bookedSeatIds($showtime);
        $bookedSeatIdSet = array_fill_keys($bookedSeatIds, true);
        $seats = Seat::where('roomId', $showtime->roomId)
            ->orderBy('seatId')
            ->get()
            ->each(function (Seat $seat) use ($bookedSeatIdSet) {
                $seat->setAttribute('isBooked', isset($bookedSeatIdSet[$seat->seatId]));
                $seat->makeVisible('isBooked');
            });

        return response()->json($seats);
    }
}
