<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Showtime extends Model
{
    protected $primaryKey = 'showtimeId';
    public $incrementing = true;
    protected $keyType = 'int';
    protected $fillable = ['date', 'time', 'roomId', 'movieId'];

    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class, 'movieId', 'movieId');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'roomId', 'roomId');
    }
}
