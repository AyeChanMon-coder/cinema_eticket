<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Showtime;
use App\Models\UserNotification;
use App\Services\SeatHoldService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(SeatHoldService $seatHoldService): JsonResponse
    {
        $seatHoldService->expireOverdue();
        $payments = Payment::with(['booking.user', 'invoice'])->get();

        return response()->json($payments);
    }

    public function show(Payment $payment, SeatHoldService $seatHoldService): JsonResponse
    {
        $seatHoldService->expireOverdue();

        return response()->json($payment->fresh()->load(['booking.user', 'invoice']));
    }

    public function submit(Request $request, SeatHoldService $seatHoldService): JsonResponse
    {
        $data = $request->validate([
            'showtimeId' => 'required|exists:showtimes,showtimeId',
            'seatIds' => 'required|array|min:1',
            'seatIds.*' => 'required|integer|distinct|exists:seats,seatId',
            'amount' => 'required|numeric|min:0',
            'paymentMethodId' => 'required|exists:payment_methods,paymentMethodId',
            'paymentSlip' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $seatHoldService->expireOverdue();
        $payment = DB::transaction(function () use ($data, $request, $seatHoldService) {
            $showtime = Showtime::whereKey($data['showtimeId'])->lockForUpdate()->firstOrFail();
            abort_unless(
                $showtime->isUpcoming(),
                422,
                'This showtime has already started.'
            );

            $paymentMethod = PaymentMethod::findOrFail($data['paymentMethodId']);
            $seatHoldService->lockAndAssertAvailable($showtime, $data['seatIds']);

            $booking = Booking::create([
                'bookingDate' => now()->toDateString(),
                'status' => 'pending',
                'userId' => $request->user()->userId,
                'showtimeId' => $data['showtimeId'],
                'holdExpiresAt' => now()->addMinutes(15),
            ]);
            $booking->seats()->attach($data['seatIds']);

            return Payment::create([
                'amount' => $data['amount'],
                'paymentMethod' => $paymentMethod->name,
                'paymentMethodId' => $data['paymentMethodId'],
                'paymentStatus' => 'pending',
                'paymentSlipUrl' => $request->file('paymentSlip')->store('payment-slips', 'public'),
                'bookingId' => $booking->bookingId,
            ]);
        });

        return response()->json($payment->load('paymentMethod'), 201);
    }

    public function customerShow(Request $request, Payment $payment, SeatHoldService $seatHoldService): JsonResponse
    {
        abort_unless($payment->booking?->userId === $request->user()->userId, 403);

        $seatHoldService->expireOverdue();
        $payment = $payment->fresh();

        return response()->json($payment->load(['paymentMethod', 'booking.showtime.movie', 'booking.seats']));
    }

    public function updateStatus(Request $request, Payment $payment, SeatHoldService $seatHoldService): JsonResponse
    {
        $data = $request->validate(['paymentStatus' => 'required|in:approved,rejected']);
        $expired = DB::transaction(function () use ($data, $payment, $seatHoldService) {
            $booking = Booking::whereKey($payment->bookingId)->lockForUpdate()->firstOrFail();
            $payment = Payment::whereKey($payment->paymentId)->lockForUpdate()->firstOrFail();

            abort_unless($payment->paymentStatus === 'pending' && $booking->status === 'pending', 422, 'Only pending payments can be reviewed.');

            if (! $booking->holdExpiresAt || $booking->holdExpiresAt->lte(now())) {
                $seatHoldService->expirePendingBooking($booking, $payment);

                return true;
            }

            $payment->update(['paymentStatus' => $data['paymentStatus']]);
            $booking->update([
                'status' => $data['paymentStatus'] === 'approved' ? 'confirmed' : 'cancelled',
                'holdExpiresAt' => null,
            ]);

            UserNotification::create([
                'userId' => $booking->userId,
                'paymentId' => $payment->paymentId,
                'title' => $data['paymentStatus'] === 'approved' ? 'Payment approved' : 'Payment rejected',
                'message' => $data['paymentStatus'] === 'approved'
                    ? 'Your payment has been approved. Tap to view your payment information.'
                    : 'Your payment was rejected. Tap to review your payment information and submit again.',
            ]);

            return false;
        });

        if ($expired) {
            return response()->json(['message' => 'This seat hold has expired; the payment can no longer be approved.'], 422);
        }

        return response()->json($payment->fresh()->load(['booking.user', 'paymentMethod']));
    }
}
