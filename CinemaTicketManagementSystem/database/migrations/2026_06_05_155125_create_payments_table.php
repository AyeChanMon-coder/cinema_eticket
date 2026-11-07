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
        Schema::create('payments', function (Blueprint $table) {
        $table->id('paymentId');
        $table->double('amount');
        $table->string('paymentMethod');
        $table->string('paymentStatus');
        $table->string('paymentSlipUrl')->nullable(); // Screenshot တင်ဖို့အတွက် ဖြည့်စွက်ပေးထားခြင်း
        // Booking (1) -> Has -> Payment (1)
        $table->foreignId('bookingId')->unique()->constrained('bookings', 'bookingId')->onDelete('cascade');
        $table->foreignId('paymentMethodId')->nullable()->constrained('payment_methods', 'paymentMethodId')->onDelete('set null');
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
