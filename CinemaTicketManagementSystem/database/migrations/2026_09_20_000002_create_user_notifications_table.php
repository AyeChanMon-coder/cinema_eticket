<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id('notificationId');
            $table->foreignId('userId')->constrained('users', 'userId')->onDelete('cascade');
            $table->foreignId('paymentId')->nullable()->constrained('payments', 'paymentId')->onDelete('cascade');
            $table->string('title');
            $table->text('message');
            $table->boolean('isRead')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
