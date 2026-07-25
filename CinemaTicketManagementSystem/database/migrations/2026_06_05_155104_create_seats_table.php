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
        Schema::create('seats', function (Blueprint $table) {
        $table->id('seatId');
        $table->string('seatNumber');
        $table->boolean('isBooked')->default(false);
        $table->string('seatType');
        $table->integer('seatPrice');
        // Room (1) -> Contains -> Seat (Many)
        $table->foreignId('roomId')->constrained('rooms', 'roomId')->onDelete('cascade');
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seats');
    }
};
