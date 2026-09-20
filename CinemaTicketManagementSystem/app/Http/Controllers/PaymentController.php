<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Booking;
use App\Models\PaymentMethod;
use App\Models\Seat;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    public function index(): JsonResponse
    {
        $payments = Payment::with(['booking.user', 'invoice'])->get();
        return response()->json($payments);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json($payment->load(['booking.user', 'invoice']));
    }

    public function submit(Request $request): JsonResponse
    {
        $data = $request->validate([
            'showtimeId' => 'required|exists:showtimes,showtimeId',
            'seatIds' => 'required|array|min:1',
            'seatIds.*' => 'required|exists:seats,seatId',
            'amount' => 'required|numeric|min:0',
            'paymentMethodId' => 'required|exists:payment_methods,paymentMethodId',
            'paymentSlip' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $payment = DB::transaction(function () use ($data, $request) {
            $paymentMethod = PaymentMethod::findOrFail($data['paymentMethodId']);
            $seats = Seat::whereIn('seatId', $data['seatIds'])->lockForUpdate()->get();
            if ($seats->count() !== count($data['seatIds']) || $seats->contains(fn (Seat $seat) => $seat->isBooked)) {
                abort(422, 'One or more selected seats are no longer available.');
            }

            $booking = Booking::create([
                'bookingDate' => now()->toDateString(),
                'status' => 'pending',
                'userId' => $request->user()->userId,
                'showtimeId' => $data['showtimeId'],
            ]);
            $booking->seats()->attach($data['seatIds']);
            $seats->each->update(['isBooked' => true]);

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

    public function customerShow(Request $request, Payment $payment): JsonResponse
    {
        abort_unless($payment->booking?->userId === $request->user()->userId, 403);
        return response()->json($payment->load(['paymentMethod', 'booking.showtime.movie', 'booking.seats']));
    }

    public function updateStatus(Request $request, Payment $payment): JsonResponse
    {
        $data = $request->validate(['paymentStatus' => 'required|in:approved,rejected']);
        $payment->update(['paymentStatus' => $data['paymentStatus']]);
        $payment->booking()->update(['status' => $data['paymentStatus'] === 'approved' ? 'confirmed' : 'cancelled']);

        UserNotification::create([
            'userId' => $payment->booking->userId,
            'paymentId' => $payment->paymentId,
            'title' => $data['paymentStatus'] === 'approved' ? 'Payment approved' : 'Payment rejected',
            'message' => $data['paymentStatus'] === 'approved'
                ? 'Your payment has been approved. Tap to view your payment information.'
                : 'Your payment was rejected. Tap to review your payment information and submit again.',
        ]);

        if ($data['paymentStatus'] === 'rejected') {
            $payment->booking->seats()->update(['isBooked' => false]);
            $payment->booking->seats()->detach();
        }

        return response()->json($payment->fresh()->load(['booking.user', 'paymentMethod']));
    }
}
