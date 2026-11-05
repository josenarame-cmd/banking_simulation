<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('account_id')->constrained('bank_accounts')->onDelete('restrict');
            $table->decimal('principal_amount', 15, 2);
            $table->decimal('interest_rate', 5, 2); // annual interest %
            $table->integer('term_months');
            $table->enum('repayment_frequency', ['monthly', 'weekly'])->default('monthly');
            $table->decimal('total_payable', 15, 2);
            $table->decimal('total_paid', 15, 2)->default(0.00);
            $table->decimal('remaining_balance', 15, 2);
            $table->text('purpose')->nullable();
            $table->string('document_path')->nullable();
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'active',
                'completed',
                'defaulted'
            ])->default('pending')->index();
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};

