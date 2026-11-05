<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 40)->unique()->index();
            $table->foreignId('from_account_id')->nullable()->constrained('bank_accounts')->onDelete('restrict');
            $table->foreignId('to_account_id')->nullable()->constrained('bank_accounts')->onDelete('restrict');
            $table->enum('transaction_type', [
                'deposit',
                'withdrawal',
                'internal_transfer',
                'peer_transfer',
                'fee',
                'interest',
                'loan_disbursement',
                'loan_repayment',
                'reversal'
            ])->index();
            $table->decimal('amount', 15, 2);
            $table->decimal('fee_amount', 15, 2)->default(0.00);
            $table->text('description')->nullable();
            $table->enum('status', [
                'pending',
                'completed',
                'failed',
                'requires_approval',
                'rejected',
                'reversed'
            ])->default('completed')->index();
            $table->boolean('requires_approval')->default(false);
            $table->foreignId('initiated_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};

