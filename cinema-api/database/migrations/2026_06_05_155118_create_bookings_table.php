<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
        $table->id('bookingId');
        $table->date('bookingDate');
        $table->string('status'); // pending, confirmed, cancelled
        // Customer/User (1) -> Makes -> Booking (Many)
        $table->foreignId('userId')->constrained('users', 'userId')->onDelete('cascade');
        // Showtime (1) -> For -> Booking (Many)
        $table->foreignId('showtimeId')->constrained('showtimes', 'showtimeId')->onDelete('cascade');
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
