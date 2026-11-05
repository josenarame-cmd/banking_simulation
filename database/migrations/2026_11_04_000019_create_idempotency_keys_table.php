<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('idempotency_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('idempotency_key', 100);
            $table->string('operation_type', 50);
            $table->string('response_reference', 100)->nullable();
            $table->json('response_body')->nullable();
            $table->enum('status', ['processing', 'completed', 'failed'])->default('processing');
            $table->timestamps();

            $table->unique(['user_id', 'idempotency_key', 'operation_type'], 'uniq_user_idem_op');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('idempotency_keys');
    }
};

