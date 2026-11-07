<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\Seat;
use App\Models\Showtime;
use App\Models\UserNotification;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class SeatHoldService
{
    public function expireOverdue(): void
    {
        Booking::query()
            ->where('status', 'pending')
            ->whereNotNull('holdExpiresAt')
            ->where('holdExpiresAt', '<=', now())
            ->chunkById(200, function ($bookings) {
                foreach ($bookings as $candidate) {
                    DB::transaction(function () use ($candidate) {
                        $booking = Booking::whereKey($candidate->bookingId)->lockForUpdate()->first();
                        if (! $booking || $booking->status !== 'pending' || ! $booking->holdExpiresAt || $booking->holdExpiresAt->gt(now())) {
                            return;
                        }

                        $payment = Payment::where('bookingId', $booking->bookingId)
                            ->lockForUpdate()
                            ->first();

                        $this->expirePendingBooking($booking, $payment);
                    });
                }
            }, 'bookingId');
    }

    public function expirePendingBooking(Booking $booking, ?Payment $payment = null): void
    {
        $booking->update(['status' => 'cancelled']);
        $payment ??= Payment::where('bookingId', $booking->bookingId)->lockForUpdate()->first();

        if ($payment?->paymentStatus === 'pending') {
            $payment->update(['paymentStatus' => 'expired']);
            UserNotification::create([
                'userId' => $booking->userId,
                'paymentId' => $payment->paymentId,
                'title' => 'Booking expired',
                'message' => 'Your 15-minute seat hold expired. Please start a new booking if seats are still available.',
            ]);
        }
    }

    public function lockAndAssertAvailable(
        Showtime $showtime,
        array $seatIds,
        ?int $exceptBookingId = null,
        bool $checkAvailability = true,
    ): Collection {
        $seatIds = array_map('intval', $seatIds);
        if (count($seatIds) !== count(array_unique($seatIds))) {
            abort(422, 'Duplicate seats are not allowed.');
        }

        $seats = Seat::whereIn('seatId', $seatIds)
            ->orderBy('seatId')
            ->lockForUpdate()
            ->get();

        if ($seats->count() !== count($seatIds) || $seats->contains(
            fn (Seat $seat) => (int) $seat->roomId !== (int) $showtime->roomId
        )) {
            abort(422, 'One or more selected seats do not belong to this showtime room.');
        }

        if ($checkAvailability) {
            $conflictingBookings = Booking::holdingSeats()
                ->where('showtimeId', $showtime->showtimeId)
                ->when($exceptBookingId, fn ($query) => $query->where('bookingId', '!=', $exceptBookingId))
                ->whereHas('seats', fn ($query) => $query->whereIn('seats.seatId', $seatIds));

            if ($conflictingBookings->exists()) {
                abort(422, 'One or more selected seats are no longer available for this showtime.');
            }
        }

        return $seats;
    }

    public function bookedSeatIds(Showtime $showtime): array
    {
        return Booking::holdingSeats()
            ->where('showtimeId', $showtime->showtimeId)
            ->with('seats:seatId')
            ->get()
            ->flatMap(fn (Booking $booking) => $booking->seats->pluck('seatId'))
            ->unique()
            ->values()
            ->all();
    }
}
