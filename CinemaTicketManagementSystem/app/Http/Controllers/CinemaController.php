<?php

namespace App\Http\Controllers;

use App\Models\Cinema;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CinemaController extends Controller
{
    public function index(): JsonResponse
    {
        $cinemas = Cinema::with('rooms')->get();
        return response()->json($cinemas);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
        ]);

        $cinema = Cinema::create($data);
        return response()->json($cinema, 201);
    }

    public function show(Cinema $cinema): JsonResponse
    {
        return response()->json($cinema->load('rooms'));
    }

    public function update(Request $request, Cinema $cinema): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'location' => 'sometimes|required|string|max:255',
        ]);

        $cinema->update($data);
        return response()->json($cinema);
    }

    public function destroy(Cinema $cinema): JsonResponse
    {
        $cinema->delete();
        return response()->json(null, 204);
    }
}
