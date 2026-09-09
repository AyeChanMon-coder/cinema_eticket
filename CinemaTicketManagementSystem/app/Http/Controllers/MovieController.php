<?php

namespace App\Http\Controllers;

use App\Models\Movie;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class MovieController extends Controller
{
    public function index(): JsonResponse
    {
        $movies = Movie::with('showtimes.room.cinema')->get();
        return response()->json($movies);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'genre' => 'required|string|max:255',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'description' => 'required|string',
            'duration' => 'required|integer|min:1',
            'rating' => 'required|numeric|min:0|max:10',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('movies', 'public');
        }

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
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'description' => 'sometimes|required|string',
            'duration' => 'sometimes|required|integer|min:1',
            'rating' => 'sometimes|required|numeric|min:0|max:10',
        ]);

        if ($request->hasFile('image')) {
            if ($movie->image) {
                Storage::disk('public')->delete($movie->image);
            }
            $data['image'] = $request->file('image')->store('movies', 'public');
        }

        $movie->update($data);
        return response()->json($movie);
    }

    public function destroy(Movie $movie): JsonResponse
    {
        if ($movie->image) {
            Storage::disk('public')->delete($movie->image);
        }
        $movie->delete();
        return response()->json(null, 204);
    }
}
