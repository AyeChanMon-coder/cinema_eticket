<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    protected $primaryKey = 'bookingId';
    public $incrementing = true;
    protected $keyType = 'int';
    protected $fillable = ['bookingDate', 'status', 'userId', 'showtimeId'];

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
