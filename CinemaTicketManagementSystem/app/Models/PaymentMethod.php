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
        'qrCodeImagePath',
        'isActive',
        'sortOrder',
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'sortOrder' => 'integer',
    ];

    protected $hidden = ['qrCodeImagePath'];

    protected $appends = ['qrCodeImageUrl'];

    public function getQrCodeImageUrlAttribute(): ?string
    {
        return $this->qrCodeImagePath
            ? '/storage/' . ltrim($this->qrCodeImagePath, '/')
            : null;
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'paymentMethodId', 'paymentMethodId');
    }
}
