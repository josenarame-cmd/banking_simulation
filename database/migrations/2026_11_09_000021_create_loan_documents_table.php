<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->onDelete('cascade');
            $table->string('document_type', 60)->default('other');
            // e.g. 'national_id', 'payslip', 'employment_letter', 'bank_statement', 'other'
            $table->string('file_path');
            $table->string('original_name');
            $table->unsignedBigInteger('file_size')->nullable(); // bytes
            $table->string('mime_type', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_documents');
    }
};

