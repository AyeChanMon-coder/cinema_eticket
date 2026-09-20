<?php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentMethodController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            PaymentMethod::orderBy('sortOrder')->orderBy('name')->get()
        );
    }

    public function publicIndex(): JsonResponse
    {
        return response()->json(
            PaymentMethod::where('isActive', true)->orderBy('sortOrder')->orderBy('name')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'accountName' => 'nullable|string|max:255',
            'accountNumber' => 'nullable|string|max:255',
            'qrCodeImage' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $data['code'] = $this->generateCode();
        $data['isActive'] = true;
        $data['sortOrder'] = null;
        if ($request->hasFile('qrCodeImage')) {
            $data['qrCodeImagePath'] = $request->file('qrCodeImage')->store('payment-methods', 'public');
        }
        unset($data['qrCodeImage']);

        return response()->json(PaymentMethod::create($data), 201);
    }

    public function destroy(PaymentMethod $paymentMethod): JsonResponse
    {
        if ($paymentMethod->qrCodeImagePath) {
            Storage::disk('public')->delete($paymentMethod->qrCodeImagePath);
        }

        $paymentMethod->delete();

        return response()->json(null, 204);
    }

    public function update(Request $request, PaymentMethod $paymentMethod): JsonResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'accountName' => 'nullable|string|max:255',
            'accountNumber' => 'nullable|string|max:255',
            'qrCodeImage' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'remove_image' => 'sometimes|boolean',
        ]);

        if ($request->hasFile('qrCodeImage')) {
            if ($paymentMethod->qrCodeImagePath) {
                Storage::disk('public')->delete($paymentMethod->qrCodeImagePath);
            }
            $data['qrCodeImagePath'] = $request->file('qrCodeImage')->store('payment-methods', 'public');
        } elseif ($request->boolean('remove_image') && $paymentMethod->qrCodeImagePath) {
            Storage::disk('public')->delete($paymentMethod->qrCodeImagePath);
            $data['qrCodeImagePath'] = null;
        }

        unset($data['qrCodeImage'], $data['remove_image']);
        $paymentMethod->update($data);

        return response()->json($paymentMethod);
    }

    private function generateCode(): string
    {
        $lastNumber = PaymentMethod::query()
            ->pluck('code')
            ->map(function (string $code): int {
                return preg_match('/^C-(\d+)$/', $code, $matches) ? (int) $matches[1] : 0;
            })
            ->max();

        return 'C-' . str_pad((string) ($lastNumber + 1), 4, '0', STR_PAD_LEFT);
    }
}
