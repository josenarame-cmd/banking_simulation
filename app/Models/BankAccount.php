<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'account_type_id',
        'account_number',
        'account_name',
        'account_type',
        'currency',
        'balance',
        'status',
        'opened_at',
        'maturity_date',
        'closed_at',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'opened_at' => 'datetime',
        'maturity_date' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function accountType()
    {
        return $this->belongsTo(AccountType::class);
    }

    public function ledgerEntries()
    {
        return $this->hasMany(LedgerEntry::class, 'account_id');
    }

    public function outgoingTransactions()
    {
        return $this->hasMany(Transaction::class, 'from_account_id');
    }

    public function incomingTransactions()
    {
        return $this->hasMany(Transaction::class, 'to_account_id');
    }

    public function fees()
    {
        return $this->hasMany(Fee::class, 'account_id');
    }

    public function interestCalculations()
    {
        return $this->hasMany(InterestCalculation::class, 'account_id');
    }

    public function loans()
    {
        return $this->hasMany(Loan::class, 'account_id');
    }

    public function isChecking(): bool
    {
        return $this->account_type === 'checking';
    }

    public function isSavings(): bool
    {
        return $this->account_type === 'savings';
    }

    public function isFixedDeposit(): bool
    {
        return $this->account_type === 'fixed_deposit';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isBlocked(): bool
    {
        return $this->status === 'blocked';
    }

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    public function toArray(): array
    {
        $array = parent::toArray();
        if (isset($array['account_type']) && is_array($array['account_type'])) {
            $array['account_type_detail'] = $array['account_type'];
            $array['account_type'] = $this->getRawOriginal('account_type')
                ?? ($array['account_type']['code'] ?? 'checking');
        }
        return $array;
    }
}

