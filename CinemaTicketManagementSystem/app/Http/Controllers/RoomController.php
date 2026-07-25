<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RoomController extends Controller
{
    public function index(): JsonResponse
    {
        $rooms = Room::with('cinema', 'showtimes', 'seats')->get();
        return response()->json($rooms);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'cinemaId' => 'required|exists:cinemas,cinemaId',
        ]);

        $room = Room::create($data);
        return response()->json($room, 201);
    }

    public function show(Room $room): JsonResponse
    {
        return response()->json($room->load('cinema', 'showtimes', 'seats'));
    }

    public function update(Request $request, Room $room): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'cinemaId' => 'sometimes|required|exists:cinemas,cinemaId',
        ]);

        $room->update($data);
        return response()->json($room);
    }

    public function destroy(Room $room): JsonResponse
    {
        $room->delete();
        return response()->json(null, 204);
    }
}
