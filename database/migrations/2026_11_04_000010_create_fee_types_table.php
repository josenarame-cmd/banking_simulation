<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique(); // monthly_maintenance, wire_transfer, overdraft, withdrawal_fee
            $table->decimal('amount', 15, 2);
            $table->enum('calculation_method', ['fixed', 'percentage'])->default('fixed');
            $table->string('applicable_account_type', 50)->default('all'); // checking, savings, fixed_deposit, all
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_types');
    }
};

