<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentMethod extends Model
{
    protected $primaryKey = 'paymentMethodId';

    protected $fillable = [
        'code',
        'name',
        'accountName',
        'accountNumber',
        'qrCodeUrl',
        'isActive',
        'sortOrder',
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'sortOrder' => 'integer',
    ];

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'paymentMethodId', 'paymentMethodId');
    }
}
