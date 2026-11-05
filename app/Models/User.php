<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'status',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOfficer(): bool
    {
        return $this->role === 'officer';
    }

    public function isInstructor(): bool
    {
        return $this->role === 'officer'; // alias for backward compat
    }

    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    public function isUser(): bool
    {
        return $this->role === 'customer'; // alias for backward compat
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    public function accounts()
    {
        return $this->hasMany(BankAccount::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function scheduledTransfers()
    {
        return $this->hasMany(ScheduledTransfer::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function loginAttempts()
    {
        return $this->hasMany(LoginAttempt::class);
    }
}
