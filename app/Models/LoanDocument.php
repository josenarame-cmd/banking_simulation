<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'loan_id',
        'document_type',
        'file_path',
        'original_name',
        'file_size',
        'mime_type',
    ];

    protected $appends = ['download_url', 'document_type_label'];

    /**
     * Human-readable label for the document type.
     */
    public function getDocumentTypeLabelAttribute(): string
    {
        return match ($this->document_type) {
            'national_id'          => 'National ID',
            'payslip'              => 'Pay Slip',
            'employment_letter'    => 'Employment Letter',
            'bank_statement'       => 'Bank Statement',
            'business_registration'=> 'Business Registration',
            default                => 'Supporting Document',
        };
    }

    /**
     * Public URL for the document (via storage link).
     */
    public function getDownloadUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }
}

