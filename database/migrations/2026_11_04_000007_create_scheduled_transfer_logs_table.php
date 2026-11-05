<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_transfer_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scheduled_transfer_id')->constrained('scheduled_transfers')->onDelete('cascade');
            $table->foreignId('transaction_id')->nullable()->constrained('transactions')->onDelete('set null');
            $table->timestamp('execution_date')->useCurrent();
            $table->enum('status', ['success', 'failed'])->index();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_transfer_logs');
    }
};

