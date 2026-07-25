<?php

namespace App\Http\Controllers;

use App\Models\Showtime;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ShowtimeController extends Controller
{
    public function index(): JsonResponse
    {
        $showtimes = Showtime::with('movie', 'room.cinema')->get();
        return response()->json($showtimes);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'time' => 'required',
            'roomId' => 'required|exists:rooms,roomId',
            'movieId' => 'required|exists:movies,movieId',
        ]);

        $showtime = Showtime::create($data);
        return response()->json($showtime, 201);
    }

    public function show(Showtime $showtime): JsonResponse
    {
        return response()->json($showtime->load('movie', 'room.cinema'));
    }

    public function update(Request $request, Showtime $showtime): JsonResponse
    {
        $data = $request->validate([
            'date' => 'sometimes|required|date',
            'time' => 'sometimes|required',
            'roomId' => 'sometimes|required|exists:rooms,roomId',
            'movieId' => 'sometimes|required|exists:movies,movieId',
        ]);

        $showtime->update($data);
        return response()->json($showtime);
    }

    public function destroy(Showtime $showtime): JsonResponse
    {
        $showtime->delete();
        return response()->json(null, 204);
    }
}
