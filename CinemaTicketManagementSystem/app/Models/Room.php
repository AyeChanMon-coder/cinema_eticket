<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    protected $primaryKey = 'roomId';
    public $incrementing = true;
    protected $keyType = 'int';
    protected $fillable = [
        'name',
        'cinemaId',
    ];

    public function cinema(): BelongsTo
    {
        return $this->belongsTo(Cinema::class, 'cinemaId', 'cinemaId');
    }

    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class, 'roomId', 'roomId');
    }

    public function showtimes(): HasMany
    {
        return $this->hasMany(Showtime::class, 'roomId', 'roomId');
    }
}
