<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(): JsonResponse
    {
        $payments = Payment::with(['booking.user', 'invoice'])->get();
        return response()->json($payments);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:0',
            'paymentMethod' => 'required|string|max:255',
            'paymentStatus' => 'required|string|in:pending,approved,rejected',
            'paymentSlipUrl' => 'sometimes|nullable|url',
            'bookingId' => 'required|exists:bookings,bookingId|unique:payments,bookingId',
        ]);

        $payment = Payment::create($data);
        return response()->json($payment->load(['booking.user', 'invoice']), 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json($payment->load(['booking.user', 'invoice']));
    }

    public function update(Request $request, Payment $payment): JsonResponse
    {
        $data = $request->validate([
            'amount' => 'sometimes|required|numeric|min:0',
            'paymentMethod' => 'sometimes|required|string|max:255',
            'paymentStatus' => 'sometimes|required|string|in:pending,approved,rejected',
            'paymentSlipUrl' => 'sometimes|nullable|url',
        ]);

        $payment->update($data);
        return response()->json($payment->load(['booking.user', 'invoice']));
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $payment->delete();
        return response()->json(null, 204);
    }
}
