<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            PaymentMethod::orderBy('sortOrder')->orderBy('name')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => 'required|string|max:50|unique:payment_methods,code',
            'name' => 'required|string|max:255',
            'accountName' => 'nullable|string|max:255',
            'accountNumber' => 'nullable|string|max:255',
            'qrCodeUrl' => 'nullable|url|max:255',
            'isActive' => 'sometimes|boolean',
            'sortOrder' => 'sometimes|integer|min:0',
        ]);

        return response()->json(PaymentMethod::create($data), 201);
    }

    public function destroy(PaymentMethod $paymentMethod): JsonResponse
    {
        $paymentMethod->delete();

        return response()->json(null, 204);
    }
}
