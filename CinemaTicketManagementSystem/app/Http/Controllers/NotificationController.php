<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = UserNotification::where('userId', $request->user()->userId)
            ->latest('notificationId')
            ->limit(30)
            ->get();

        return response()->json($notifications);
    }

    public function markRead(Request $request, UserNotification $notification): JsonResponse
    {
        abort_unless($notification->userId === $request->user()->userId, 403);
        $notification->update(['isRead' => true]);

        return response()->json($notification);
    }
}
