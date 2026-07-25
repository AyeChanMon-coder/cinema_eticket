<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Seat;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
            'isBooked' => 'sometimes|boolean',
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
            'isBooked' => 'sometimes|boolean',
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
}
