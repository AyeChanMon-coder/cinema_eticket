<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Showtime;
use App\Models\UserNotification;
use App\Services\AdminNotificationService;
use App\Services\SeatHoldService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(SeatHoldService $seatHoldService): JsonResponse
    {
        $seatHoldService->expireOverdue();
        $payments = Payment::with(['booking.user', 'invoice'])->latest('paymentId')->get();

        return response()->json($payments);
    }

    public function show(Payment $payment, SeatHoldService $seatHoldService): JsonResponse
    {
        $seatHoldService->expireOverdue();

        return response()->json($payment->fresh()->load(['booking.user', 'invoice']));
    }

    public function submit(
        Request $request,
        SeatHoldService $seatHoldService,
        AdminNotificationService $adminNotifications,
    ): JsonResponse {
        abort_unless((int) $request->user()->userType === 1, 403);

        $data = $request->validate([
            'bookingId' => 'required|integer|exists:bookings,bookingId',
            'amount' => 'required|numeric|min:0',
            'paymentMethodId' => 'required|exists:payment_methods,paymentMethodId',
            'paymentSlip' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $seatHoldService->expireOverdue();
        $payment = DB::transaction(function () use ($data, $request, $seatHoldService, $adminNotifications) {
            $booking = Booking::whereKey($data['bookingId'])->lockForUpdate()->firstOrFail();
            abort_unless((int) $booking->userId === (int) $request->user()->userId, 403);
            abort_unless(
                $booking->status === 'pending'
                    && $booking->holdExpiresAt
                    && $booking->holdExpiresAt->isAfter(now())
                    && ! $booking->payment()->exists(),
                422,
                'Your 15-minute seat hold has expired. Please select your seats again.'
            );

            $showtime = Showtime::whereKey($booking->showtimeId)->lockForUpdate()->firstOrFail();
            abort_unless(
                $showtime->isUpcoming(),
                422,
                'This showtime has already started.'
            );

            $paymentMethod = PaymentMethod::findOrFail($data['paymentMethodId']);
            $seatIds = $booking->seats()->pluck('seats.seatId')->all();
            $seatHoldService->lockAndAssertAvailable($showtime, $seatIds, $booking->bookingId);

            $payment = Payment::create([
                'amount' => $data['amount'],
                'paymentMethod' => $paymentMethod->name,
                'paymentMethodId' => $data['paymentMethodId'],
                'paymentStatus' => 'pending',
                'paymentSlipUrl' => $request->file('paymentSlip')->store('payment-slips', 'public'),
                'bookingId' => $booking->bookingId,
            ]);
            $booking->update(['holdExpiresAt' => null]);

            $adminNotifications->notifyNewPendingPayment($payment);

            return $payment;
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

    public function updateStatus(Request $request, Payment $payment): JsonResponse
    {
        $data = $request->validate(['paymentStatus' => 'required|in:approved,rejected']);
        DB::transaction(function () use ($data, $payment) {
            $booking = Booking::whereKey($payment->bookingId)->lockForUpdate()->firstOrFail();
            $payment = Payment::whereKey($payment->paymentId)->lockForUpdate()->firstOrFail();

            abort_unless($payment->paymentStatus === 'pending' && $booking->status === 'pending', 422, 'Only pending payments can be reviewed.');

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

        });

        return response()->json($payment->fresh()->load(['booking.user', 'paymentMethod']));
    }
}
