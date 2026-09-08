<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    private function managedUserType(Request $request): int
    {
        return (int) $request->user()->userType === 3 ? 2 : 1;
    }

    private function ensureCanManage(Request $request, User $user): void
    {
        abort_unless((int) $user->userType === $this->managedUserType($request), 403, 'You cannot manage this user.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'userType' => 'required|integer|in:1,2',
        ]);

        abort_unless((int) $data['userType'] === $this->managedUserType($request), 403, 'You cannot create this user type.');

        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);

        return response()->json($user, 201);
    }

    public function index(): JsonResponse
    {
        $users = User::where('userType', $this->managedUserType(request()))
            ->with('bookings.showtime.movie', 'bookings.showtime.room.cinema')
            ->get();
        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        $this->ensureCanManage(request(), $user);
        return response()->json($user->load('bookings.showtime.movie', 'bookings.showtime.room.cinema'));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->ensureCanManage($request, $user);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->userId . ',userId',
            'password' => 'sometimes|nullable|string|min:8',
            'userType' => 'sometimes|required|integer|in:1,2',
        ]);

        if (isset($data['userType'])) {
            abort_unless((int) $data['userType'] === $this->managedUserType($request), 403, 'You cannot assign this user type.');
        }

        if (array_key_exists('password', $data)) {
            $data['password'] = $data['password']
                ? Hash::make($data['password'])
                : $user->password;
        }

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function destroy(User $user): JsonResponse
    {
        $this->ensureCanManage(request(), $user);
        $user->delete();
        return response()->json(null, 204);
    }
}
