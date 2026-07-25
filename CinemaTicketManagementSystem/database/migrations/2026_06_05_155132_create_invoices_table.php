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
        Schema::create('invoices', function (Blueprint $table) {
        $table->id('invoiceId');
        $table->double('totalAmount');
        $table->date('generatedDate');
        // Payment (1) -> Generates -> Invoice (0..1)
        $table->foreignId('paymentId')->unique()->constrained('payments', 'paymentId')->onDelete('cascade');
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
