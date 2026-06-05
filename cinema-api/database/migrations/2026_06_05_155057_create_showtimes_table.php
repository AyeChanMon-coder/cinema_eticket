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
        Schema::create('showtimes', function (Blueprint $table) {
        $table->id('showtimeId');
        $table->date('date');
        $table->time('time');
        // Room (1) -> Hosts -> Showtime (Many)
        $table->foreignId('roomId')->constrained('rooms', 'roomId')->onDelete('cascade');
        // Movie (1) -> Has -> Showtime (Many)
        $table->foreignId('movieId')->constrained('movies', 'movieId')->onDelete('cascade');
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('showtimes');
    }
};
