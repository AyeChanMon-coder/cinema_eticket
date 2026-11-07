<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    protected $primaryKey = 'bookingId';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = ['bookingDate', 'status', 'userId', 'showtimeId', 'holdExpiresAt'];

    protected $casts = ['holdExpiresAt' => 'datetime'];

    public function scopeHoldingSeats(Builder $query): Builder
    {
        return $query->where(function (Builder $query) {
            $query->where('status', 'confirmed')
                ->orWhere(function (Builder $query) {
                    $query->where('status', 'pending')
                        ->where('holdExpiresAt', '>', now())
                        ->whereDoesntHave('payment', fn (Builder $query) => $query->whereIn('paymentStatus', ['rejected', 'expired', 'cancelled']));
                });
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'userId', 'userId');
    }

    public function showtime(): BelongsTo
    {
        return $this->belongsTo(Showtime::class, 'showtimeId', 'showtimeId');
    }

    public function seats(): BelongsToMany
    {
        return $this->belongsToMany(Seat::class, 'booking_seat', 'bookingId', 'seatId', 'bookingId', 'seatId');
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class, 'bookingId', 'bookingId');
    }
}
