<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        $invoices = Invoice::with('payment.booking.user')->get();
        return response()->json($invoices);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'totalAmount' => 'required|numeric|min:0',
            'generatedDate' => 'required|date',
            'paymentId' => 'required|exists:payments,paymentId|unique:invoices,paymentId',
        ]);

        $invoice = Invoice::create($data);
        return response()->json($invoice->load('payment.booking.user'), 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json($invoice->load('payment.booking.user'));
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate([
            'totalAmount' => 'sometimes|required|numeric|min:0',
            'generatedDate' => 'sometimes|required|date',
        ]);

        $invoice->update($data);
        return response()->json($invoice->load('payment.booking.user'));
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $invoice->delete();
        return response()->json(null, 204);
    }
}
