<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cinema extends Model
{
    protected $primaryKey = 'cinemaId';
    public $incrementing = true;
    protected $keyType = 'int';
    protected $fillable = [
        'name',
        'location',
    ];

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class, 'cinemaId', 'cinemaId');
    }
}
