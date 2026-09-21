<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->userId . ',userId',
            'phone' => 'nullable|string|max:30',
            'profileImage' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:10240',
        ]);

        if ($request->hasFile('profileImage')) {
            if ($user->profileImagePath) {
                Storage::disk('public')->delete($user->profileImagePath);
            }
            $data['profileImagePath'] = $request->file('profileImage')->store('profile-images', 'public');
        }
        unset($data['profileImage']);

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'currentPassword' => 'required|string',
            'newPassword' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($data['currentPassword'], $request->user()->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $request->user()->update(['password' => Hash::make($data['newPassword'])]);

        return response()->json(['message' => 'Password changed successfully.']);
    }
}
