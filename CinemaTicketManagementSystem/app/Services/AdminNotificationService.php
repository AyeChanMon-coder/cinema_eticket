<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\UserNotification;

class AdminNotificationService
{
    public function notifyNewPendingPayment(Payment $payment): void
    {
        $booking = $payment->booking()->with(['user', 'showtime.movie'])->firstOrFail();
        $this->notifyAdmins(
            $payment,
            'New booking payment',
            "Booking #{$booking->bookingId} for {$booking->showtime->movie->title} by {$booking->user->name} is pending payment review."
        );
    }

    public function notifyExpiredHold(Booking $booking): void
    {
        $booking->loadMissing(['user', 'showtime.movie']);
        $this->notifyAdmins(
            null,
            'Seat hold expired',
            "Booking #{$booking->bookingId} for {$booking->showtime->movie->title} by {$booking->user->name} expired before payment was submitted."
        );
    }

    private function notifyAdmins(?Payment $payment, string $title, string $message): void
    {
        User::query()
            ->whereIn('userType', [2, 3])
            ->select('userId')
            ->get()
            ->each(fn (User $admin) => UserNotification::create([
                'userId' => $admin->userId,
                'paymentId' => $payment->paymentId,
                'title' => $title,
                'message' => $message,
            ]));
    }
}
