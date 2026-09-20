<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotification extends Model
{
    protected $table = 'user_notifications';
    protected $primaryKey = 'notificationId';
    protected $fillable = ['userId', 'paymentId', 'title', 'message', 'isRead'];
    protected $casts = ['isRead' => 'boolean'];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'paymentId', 'paymentId');
    }
}
