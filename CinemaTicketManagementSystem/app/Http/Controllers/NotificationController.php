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
            ->where('isRead', false)
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

    public function adminIndex(Request $request): JsonResponse
    {
        abort_unless(in_array((int) $request->user()->userType, [2, 3], true), 403);

        return response()->json(
            UserNotification::where('userId', $request->user()->userId)
                ->where('isRead', false)
                ->latest('notificationId')
                ->limit(30)
                ->get()
        );
    }

    public function adminMarkRead(Request $request, UserNotification $notification): JsonResponse
    {
        abort_unless(in_array((int) $request->user()->userType, [2, 3], true), 403);
        abort_unless($notification->userId === $request->user()->userId, 403);

        $notification->update(['isRead' => true]);

        return response()->json($notification);
    }
}
