<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InterestCalculation extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'transaction_id',
        'calculation_period',
        'principal_balance',
        'interest_rate',
        'interest_amount',
        'status',
        'processed_at',
    ];

    protected $casts = [
        'principal_balance' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'interest_amount' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(BankAccount::class, 'account_id');
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}

