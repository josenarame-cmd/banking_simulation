<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduledTransferLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'scheduled_transfer_id',
        'transaction_id',
        'execution_date',
        'status',
        'error_message',
    ];

    protected $casts = [
        'execution_date' => 'datetime',
    ];

    public function scheduledTransfer()
    {
        return $this->belongsTo(ScheduledTransfer::class);
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}

