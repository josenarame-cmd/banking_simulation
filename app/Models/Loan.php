<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'account_id',
        'principal_amount',
        'interest_rate',
        'term_months',
        'repayment_frequency',
        'total_payable',
        'total_paid',
        'remaining_balance',
        'purpose',
        'document_path',
        'status',
        'requested_at',
        'approved_at',
        'approved_by',
        'rejection_reason',
    ];

    protected $casts = [
        'principal_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'total_payable' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'remaining_balance' => 'decimal:2',
        'term_months' => 'integer',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function account()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function schedules()
    {
        return $this->hasMany(LoanSchedule::class)->orderBy('installment_number');
    }

    public function repayments()
    {
        return $this->hasMany(LoanRepayment::class)->orderBy('payment_date', 'desc');
    }

    public function loanDocuments()
    {
        return $this->hasMany(LoanDocument::class)->orderBy('id');
    }
}

