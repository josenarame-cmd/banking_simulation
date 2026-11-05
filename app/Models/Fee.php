<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fee extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_id',
        'transaction_id',
        'fee_type',
        'amount',
        'description',
        'applied_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'applied_at' => 'datetime',
    ];

    public function account()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}

