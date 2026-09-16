<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\JsonResponse;

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
}
