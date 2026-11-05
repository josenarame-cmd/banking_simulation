<?php

use App\Http\Controllers\Api\AccountTypeController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BankAccountController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FeeController;
use App\Http\Controllers\Api\InterestController;
use App\Http\Controllers\Api\LedgerController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\LoanRepaymentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ScheduledTransferController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TransferController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'FinTech Core Banking Simulation API is active',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Public Authentication
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public Account Types (for registration preview)
Route::get('/account-types', [AccountTypeController::class, 'index']);

// Protected Authenticated Routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth & Profile
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/email/send-verification', [AuthController::class, 'sendVerificationEmail']);
    Route::post('/email/verify', [AuthController::class, 'verifyEmail']);

    // Dashboards
    Route::get('/dashboard/user', [DashboardController::class, 'user']);
    Route::get('/dashboard/admin', [DashboardController::class, 'admin'])->middleware('role:admin');
    Route::get('/dashboard/instructor', [DashboardController::class, 'instructor'])->middleware('role:officer,admin');

    // Bank Accounts
    Route::get('/my-accounts', [BankAccountController::class, 'myAccounts']);
    Route::post('/accounts', [BankAccountController::class, 'store']);
    Route::get('/accounts/{id}', [BankAccountController::class, 'show']);
    Route::post('/accounts/{id}/close', [BankAccountController::class, 'close']);
    Route::get('/accounts', [BankAccountController::class, 'index'])->middleware('role:admin,officer');
    Route::post('/accounts/{id}/block', [BankAccountController::class, 'block'])->middleware('role:admin,officer');
    Route::post('/accounts/{id}/unblock', [BankAccountController::class, 'unblock'])->middleware('role:admin,officer');

    // Account Types Management
    Route::post('/account-types', [AccountTypeController::class, 'store'])->middleware('role:admin');
    Route::put('/account-types/{id}', [AccountTypeController::class, 'update'])->middleware('role:admin');

    // Transactions
    Route::get('/my-transactions', [TransactionController::class, 'myTransactions']);
    Route::get('/transactions', [TransactionController::class, 'index'])->middleware('role:admin,officer');
    Route::get('/transactions/{id}', [TransactionController::class, 'show']);
    Route::post('/transactions/deposit', [TransactionController::class, 'deposit'])->middleware('idempotent:deposit');
    Route::post('/transactions/withdraw', [TransactionController::class, 'withdraw'])->middleware('idempotent:withdraw');
    Route::post('/transactions/{id}/reverse', [TransactionController::class, 'reverse'])->middleware('role:admin');

    // Transfers
    Route::post('/transfers/lookup', [TransferController::class, 'lookupRecipient']);
    Route::post('/transfers', [TransferController::class, 'transfer'])->middleware('idempotent:transfer');

    // Approvals (Admin & Instructor)
    Route::get('/approvals', [ApprovalController::class, 'index'])->middleware('role:admin,officer');
    Route::get('/approvals/history', [ApprovalController::class, 'history'])->middleware('role:admin,officer');
    Route::post('/approvals/{id}/approve', [ApprovalController::class, 'approve'])->middleware('role:admin,officer');
    Route::post('/approvals/{id}/reject', [ApprovalController::class, 'reject'])->middleware('role:admin,officer');

    // Loans
    Route::post('/loans/apply', [LoanController::class, 'apply']);
    Route::get('/my-loans', [LoanController::class, 'myLoans']);
    Route::get('/loans/{id}', [LoanController::class, 'show']);
    Route::post('/loans/{id}/repay', [LoanRepaymentController::class, 'repay']);
    Route::get('/loans', [LoanController::class, 'index'])->middleware('role:admin,officer');
    Route::post('/loans/{id}/approve', [LoanController::class, 'approve'])->middleware('role:admin,officer');
    Route::post('/loans/{id}/reject', [LoanController::class, 'reject'])->middleware('role:admin,officer');
    Route::get('/loan-repayments', [LoanRepaymentController::class, 'index'])->middleware('role:admin,officer');

    // Scheduled Transfers
    Route::get('/my-scheduled-transfers', [ScheduledTransferController::class, 'index']);
    Route::post('/scheduled-transfers', [ScheduledTransferController::class, 'store']);
    Route::put('/scheduled-transfers/{id}/status', [ScheduledTransferController::class, 'toggleStatus']);
    Route::get('/scheduled-transfers/{id}/logs', [ScheduledTransferController::class, 'logs']);
    Route::get('/scheduled-transfers', [ScheduledTransferController::class, 'all'])->middleware('role:admin,officer');
    Route::post('/scheduled-transfers/trigger-now', [ScheduledTransferController::class, 'triggerNow'])->middleware('role:admin,officer');

    // Interest Calculations
    Route::get('/interest-rates', [InterestController::class, 'rates']);
    Route::post('/interest-rates', [InterestController::class, 'setRate'])->middleware('role:admin');
    Route::get('/interest/preview', [InterestController::class, 'preview'])->middleware('role:admin,officer');
    Route::post('/interest/process', [InterestController::class, 'process'])->middleware('role:admin');
    Route::get('/interest-calculations', [InterestController::class, 'history'])->middleware('role:admin,officer');

    // Banking Fees
    Route::get('/fee-types', [FeeController::class, 'types']);
    Route::post('/fee-types', [FeeController::class, 'createType'])->middleware('role:admin');
    Route::post('/fees/apply', [FeeController::class, 'apply'])->middleware('role:admin,officer');
    Route::post('/fees/process-maintenance', [FeeController::class, 'processMaintenance'])->middleware('role:admin');
    Route::get('/fees/history', [FeeController::class, 'history'])->middleware('role:admin,officer');

    // Double-Entry Ledger & Reconciliation
    Route::get('/ledger', [LedgerController::class, 'index'])->middleware('role:admin,officer');
    Route::get('/ledger/reconciliation', [LedgerController::class, 'reconciliation'])->middleware('role:admin,officer');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    // Audit Trail & Security Alerts
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('role:admin,officer');
    Route::get('/security-alerts', [AuditLogController::class, 'securityAlerts'])->middleware('role:admin,officer');

    // Users Management
    Route::get('/users', [UserController::class, 'index'])->middleware('role:admin,officer');
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}/status', [UserController::class, 'updateStatus'])->middleware('role:admin,officer');

    // Financial Reports & CSV Export
    Route::get('/reports/cashflow', [ReportController::class, 'cashflow'])->middleware('role:admin,officer');
    Route::get('/reports/export/{type}', [ReportController::class, 'exportCsv'])->middleware('role:admin,officer');
});
