<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seat extends Model
{
    protected $primaryKey = 'seatId';
    public $incrementing = true;
    protected $keyType = 'int';
    protected $fillable = ['seatNumber', 'isBooked', 'seatType', 'seatPrice', 'status', 'roomId'];
    protected $casts = ['isBooked' => 'boolean', 'seatPrice' => 'integer', 'status' => 'integer'];
}
