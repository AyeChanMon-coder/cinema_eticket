<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Showtime extends Model
{
    protected $primaryKey = 'showtimeId';

    public $incrementing = true;

    protected $keyType = 'int';

    protected $fillable = ['date', 'time', 'roomId', 'movieId'];

    public function scopeUpcoming(Builder $query): Builder
    {
        $now = Carbon::now(config('app.timezone'));

        return $query->where(function (Builder $query) use ($now) {
            $query->where('date', '>', $now->toDateString())
                ->orWhere(function (Builder $query) use ($now) {
                    $query->where('date', $now->toDateString())
                        ->where('time', '>', $now->format('H:i:s'));
                });
        });
    }

    public function isUpcoming(): bool
    {
        $timezone = config('app.timezone');
        $start = Carbon::parse($this->date.' '.$this->time, $timezone);

        return $start->isAfter(Carbon::now($timezone));
    }

    public function movie(): BelongsTo
    {
        return $this->belongsTo(Movie::class, 'movieId', 'movieId');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'roomId', 'roomId');
    }
}
