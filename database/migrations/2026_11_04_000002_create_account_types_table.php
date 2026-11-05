<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique(); // checking, savings, fixed_deposit
            $table->text('description')->nullable();
            $table->decimal('minimum_balance', 15, 2)->default(0.00);
            $table->decimal('interest_rate', 5, 2)->default(0.00); // annual %
            $table->decimal('withdrawal_limit', 15, 2)->nullable(); // per day or transaction
            $table->integer('lock_period_days')->default(0); // for fixed deposits
            $table->decimal('maintenance_fee', 15, 2)->default(0.00);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_types');
    }
};

