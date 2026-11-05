<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('account_type_id')->constrained('account_types')->onDelete('restrict');
            $table->string('account_number', 30)->unique()->index();
            $table->string('account_name');
            $table->string('account_type', 50); // denormalized: checking, savings, fixed_deposit
            $table->string('currency', 10)->default('USD');
            $table->decimal('balance', 15, 2)->default(0.00);
            $table->enum('status', ['active', 'blocked', 'closed', 'inactive'])->default('active')->index();
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('maturity_date')->nullable(); // for fixed deposit
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
    }
};

