<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'approver_id',
        'approval_level',
        'status',
        'notes',
        'decided_at',
    ];

    protected $casts = [
        'approval_level' => 'integer',
        'decided_at' => 'datetime',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}

