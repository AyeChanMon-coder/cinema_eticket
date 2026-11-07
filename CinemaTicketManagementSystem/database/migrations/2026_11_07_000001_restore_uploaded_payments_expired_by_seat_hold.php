<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('payments')
            ->where('paymentStatus', 'expired')
            ->whereNotNull('paymentSlipUrl')
            ->orderBy('paymentId')
            ->chunkById(500, function ($payments) {
                foreach ($payments as $payment) {
                    $booking = DB::table('bookings')
                        ->where('bookingId', $payment->bookingId)
                        ->where('status', 'cancelled')
                        ->whereNotNull('holdExpiresAt')
                        ->first();

                    if (! $booking) {
                        continue;
                    }

                    DB::table('payments')
                        ->where('paymentId', $payment->paymentId)
                        ->where('paymentStatus', 'expired')
                        ->update(['paymentStatus' => 'pending']);

                    DB::table('bookings')
                        ->where('bookingId', $payment->bookingId)
                        ->where('status', 'cancelled')
                        ->update([
                            'status' => 'pending',
                            'holdExpiresAt' => null,
                        ]);

                    DB::table('user_notifications')
                        ->where('paymentId', $payment->paymentId)
                        ->where('title', 'Booking expired')
                        ->update([
                            'title' => 'Payment awaiting review',
                            'message' => 'Your payment screenshot was submitted and is waiting for admin review.',
                        ]);

                    DB::table('user_notifications')
                        ->where('paymentId', $payment->paymentId)
                        ->where('title', 'Booking payment expired')
                        ->update([
                            'title' => 'New booking payment',
                            'message' => 'A customer payment is waiting for admin review.',
                        ]);
                }
            }, 'paymentId');
    }

    public function down(): void
    {
        // Keep restored payments reviewable if this data-only migration is rolled back.
    }
};
