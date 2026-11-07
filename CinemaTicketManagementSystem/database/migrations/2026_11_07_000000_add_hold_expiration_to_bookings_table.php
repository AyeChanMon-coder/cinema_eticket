<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->timestamp('holdExpiresAt')->nullable()->index();
        });

        DB::table('bookings')
            ->where('status', 'pending')
            ->orderBy('bookingId')
            ->chunkById(500, function ($bookings) {
                foreach ($bookings as $booking) {
                    DB::table('bookings')
                        ->where('bookingId', $booking->bookingId)
                        ->update([
                            'holdExpiresAt' => Carbon::parse($booking->created_at ?? now())->addMinutes(15),
                        ]);
                }
            }, 'bookingId');
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex(['holdExpiresAt']);
            $table->dropColumn('holdExpiresAt');
        });
    }
};
