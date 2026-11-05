<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InterestRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_type_id',
        'rate',
        'effective_from',
        'effective_to',
        'status',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function accountType()
    {
        return $this->belongsTo(AccountType::class);
    }
}

