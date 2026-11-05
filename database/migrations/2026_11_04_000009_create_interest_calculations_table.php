<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interest_calculations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('bank_accounts')->onDelete('cascade');
            $table->foreignId('transaction_id')->nullable()->constrained('transactions')->onDelete('set null');
            $table->string('calculation_period', 20); // '2026-11'
            $table->decimal('principal_balance', 15, 2);
            $table->decimal('interest_rate', 5, 2);
            $table->decimal('interest_amount', 15, 2);
            $table->enum('status', ['calculated', 'approved', 'credited', 'rejected'])->default('credited')->index();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['account_id', 'calculation_period'], 'uniq_acc_period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interest_calculations');
    }
};

