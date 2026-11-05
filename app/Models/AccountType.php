<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'minimum_balance',
        'interest_rate',
        'withdrawal_limit',
        'lock_period_days',
        'maintenance_fee',
        'status',
    ];

    protected $casts = [
        'minimum_balance' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'withdrawal_limit' => 'decimal:2',
        'lock_period_days' => 'integer',
        'maintenance_fee' => 'decimal:2',
    ];

    public function accounts()
    {
        return $this->hasMany(BankAccount::class);
    }

    public function interestRates()
    {
        return $this->hasMany(InterestRate::class);
    }
}

