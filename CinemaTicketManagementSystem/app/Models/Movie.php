<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Movie extends Model
{
    protected $primaryKey = 'movieId';
    public $incrementing = true;
    protected $keyType = 'int';
    protected $fillable = [
        'title',
        'genre',
        'duration',
        'rating',
    ];

    public function showtimes(): HasMany
    {
        return $this->hasMany(Showtime::class, 'movieId', 'movieId');
    }
}
