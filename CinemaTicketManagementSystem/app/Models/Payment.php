<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Payment extends Model
{
    protected $primaryKey = 'paymentId';
    public $incrementing = true;
    protected $keyType = 'int';
    protected $fillable = [
        'amount',
        'paymentMethod',
        'paymentMethodId',
        'paymentStatus',
        'paymentSlipUrl',
        'bookingId',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'bookingId', 'bookingId');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'paymentMethodId', 'paymentMethodId');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class, 'paymentId', 'paymentId');
    }
}
