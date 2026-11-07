<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payment_methods')) {
            return;
        }

        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id('paymentMethodId');
            $table->string('code')->unique();
            $table->string('name');
            $table->string('accountName')->nullable();
            $table->string('accountNumber')->nullable();
            $table->string('qrCodeUrl')->nullable();
            $table->boolean('isActive')->default(true);
            $table->unsignedInteger('sortOrder')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
