<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('from_account_id')->constrained('bank_accounts')->onDelete('restrict');
            $table->foreignId('to_account_id')->constrained('bank_accounts')->onDelete('restrict');
            $table->decimal('amount', 15, 2);
            $table->enum('frequency', ['daily', 'weekly', 'monthly'])->index();
            $table->string('schedule_expression')->nullable(); // cron-like or description
            $table->date('start_date');
            $table->timestamp('next_run_at')->index();
            $table->date('end_date')->nullable();
            $table->enum('status', ['active', 'suspended', 'completed', 'cancelled'])->default('active')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_transfers');
    }
};

