<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeeType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'amount',
        'calculation_method',
        'applicable_account_type',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];
}

