<?php

namespace App\Http\Controllers;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MovieController extends Controller
{
    public function index(): JsonResponse
    {
        $movies = Movie::with('showtimes')->get();
        return response()->json($movies);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'genre' => 'required|string|max:255',
            'duration' => 'required|integer|min:1',
            'rating' => 'required|numeric|min:0|max:10',
        ]);

        $movie = Movie::create($data);
        return response()->json($movie, 201);
    }

    public function show(Movie $movie): JsonResponse
    {
        return response()->json($movie->load('showtimes'));
    }

    public function update(Request $request, Movie $movie): JsonResponse
    {
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'genre' => 'sometimes|required|string|max:255',
            'duration' => 'sometimes|required|integer|min:1',
            'rating' => 'sometimes|required|numeric|min:0|max:10',
        ]);

        $movie->update($data);
        return response()->json($movie);
    }

    public function destroy(Movie $movie): JsonResponse
    {
        $movie->delete();
        return response()->json(null, 204);
    }
}
