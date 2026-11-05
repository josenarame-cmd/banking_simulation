<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IdempotencyKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'idempotency_key',
        'operation_type',
        'response_reference',
        'response_body',
        'status',
    ];

    protected $casts = [
        'response_body' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

