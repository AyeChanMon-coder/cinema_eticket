<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $primaryKey = 'invoiceId';
    public $incrementing = true;
    protected $keyType = 'int';
    protected $fillable = [
        'totalAmount',
        'generatedDate',
        'paymentId',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'paymentId', 'paymentId');
    }
}
