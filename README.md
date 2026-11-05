# ApexCore Banking Management System
### Enterprise Core Banking Platform & Financial Simulation Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework: Laravel 12](https://img.shields.io/badge/Backend-Laravel%2012-red.svg)](https://laravel.com)
[![Frontend: React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20MUI%20v6-61dafb.svg)](https://react.dev)
[![Build: Vite 7](https://img.shields.io/badge/Bundler-Vite%207-646cff.svg)](https://vitejs.dev)
[![Database: MySQL](https://img.shields.io/badge/Database-MySQL%20%2F%20MariaDB-00758f.svg)](https://mariadb.org)

---

## 📋 Academic Context & Practical Assessment

- **Academic Institution**: RP Karongi College, Western Province, Rwanda
- **Sector**: Information & Communication Technology (ICT)
- **Qualification**: TVET Certificate VII in Information Technology (Level 7 IT — Year 3)
- **Module Code & Name**: `ITLAW701` — Advanced Web Technologies
- **Assessing Trainer**: **SAFARI Cyprien**
- **Learner / Lead Engineer**: **Jose Narame**
- **Assessment Type**: Project-Based Performance Evidence (Simulation Core Banking Management Platform)

---

## 🏛 1. Executive Summary & Architecture

ApexCore is a high-fidelity Core Banking Management Platform engineered to simulate real-world financial operations, regulatory oversight, and commercial banking functions without risking customer capital. The system is designed following strict institutional banking conventions, strict multi-currency portfolio segregation, double-entry general ledger accounting, cryptographically secured transaction pipelines, and dual-control compliance oversight.

### Architectural Highlights
- **Decoupled Modern Stack**: Laravel 12 RESTful API backend serving an asynchronous React 18 Single Page Application (SPA) styled with Material-UI (MUI v6) and Recharts.
- **Strict Double-Entry Bookkeeping**: Every financial transaction (deposits, withdrawals, transfers, fee deductions, loan disbursements, and interest payouts) creates matching debit and credit journal entries to guarantee an immutable, zero-drift general ledger.
- **Dual-Control (4-Eyes) Approvals**: High-value transactions exceeding the configurable threshold ($10,000.00) are automatically quarantined for independent approval by a Compliance Officer or System Administrator before ledger posting.
- **Cryptographic Idempotency**: State-changing operations (fund transfers, cash deposits, cash withdrawals) require unique `X-Idempotency-Key` headers to protect against network retries and duplicate deductions.
- **Tokenized Session Security**: Stateful Sanctum Bearer tokens with active heartbeat tracking, idle timeout detection (30 minutes of inactivity), and cross-tab session termination.

```
+-----------------------------------------------------------------------------------+
|                            APEXCORE CLIENT (React 18 SPA)                         |
|  - Material-UI v6 UI Components  - Recharts Visualizations  - Glassmorphic Theme   |
+-----------------------------------------------------------------------------------+
                                        |  HTTPS / JSON / Bearer Auth
                                        v
+-----------------------------------------------------------------------------------+
|                        LARAVEL 12 CORE BANKING API GATEWAY                        |
|  - RoleMiddleware ('admin', 'officer', 'customer')   - IdempotencyMiddleware      |
|  - Sanctum Auth Guard  - CSRF / Rate Limiters        - Audit & Fraud Watchdog     |
+-----------------------------------------------------------------------------------+
        |                       |                       |                      |
        v                       v                       v                      v
+---------------+       +---------------+       +---------------+      +------------+
| LedgerService |       | TransferEngine|       | LoanEngine    |      | Interest & |
| Double-Entry  |       | 4-Eyes Check  |       | Amortization  |      | Fee Engine |
| Bookkeeping   |       | Quarantine    |       | Repayments    |      | Accruals   |
+---------------+       +---------------+       +---------------+      +------------+
        \                       \                       /                      /
         +--------------------------------------------------------------------+
                                        | Eloquent ORM / PDO
                                        v
+-----------------------------------------------------------------------------------+
|                        MYSQL 8 / MARIADB ENTERPRISE DATABASE                      |
|                 23 Relational Tables  -  Foreign Key Cascades                     |
|           ACID Transactions  -  Composite Indexes  -  Audit Forensics             |
+-----------------------------------------------------------------------------------+
```

---

## 🔑 2. Official Demo Access Credentials

The platform is pre-seeded with standardized banking accounts representing the three distinct institutional tiers:

| Role Code | Official Bank Job Title | User Name | Login Email | Default Password | Primary Permissions |
|---|---|---|---|---|---|
| `admin` | **System Administrator** | **Jose Narame** | `josenarame@gmail.com` | `password123` | Full Core Banking administration, User management, Interest engine, Fee rules, System audit logs |
| `officer` | **Compliance Officer** | **Cyprien Safari** | `safaricyprien@gmail.com` | `password123` | High-value approvals (> \$10,000), Double-entry ledger audit, Reconciliation, Security & fraud alerts |
| `customer` | **Banking Customer (Primary)** | **James Carter** | `james.carter@banking.com` | `password123` | Personal accounts, P2P transfers, loan servicing, recurring transfers, cash deposits/withdrawals |
| `customer` | **Banking Customer (Peer)** | **Jane Smith** | `jane.smith@banking.com` | `password123` | Counterparty checking account (`CHK-10000002`) for P2P settlement testing |
| `customer` | **Banking Customer (Corporate)** | **Robert Mugisha** | `robert.mugisha@banking.com` | `password123` | Commercial checking account (`CHK-10000003`) linked to quarantined transfers |

> **Quick Demo Launcher**: The [Landing Page](http://localhost/banking/public/) features clickable demo profile chips that sign you into any role with one click.

---

## 💼 3. Pre-Configured Customer Account Portfolio (James Carter)

| Account Number | Account Name | Account Type | Current Balance | Currency | Terms & Accrual Rules |
|---|---|---|---|---|---|
| `CHK-10000001` | **James Carter's Checking** | Checking | **\$12,500.00** | USD | \$5,000 daily withdrawal limit, routine P2P transfers, \$5.00/mo fee |
| `SAV-20000001` | **James Carter's High Yield Savings** | Savings | **\$25,000.00** | USD | \$100 min balance, **4.50% APY** compounding periodic interest |
| `FD-30000001` | **James Carter's 6-Month Term Deposit** | Fixed Deposit | **\$10,000.00** | USD | **8.00% APY**, 180-day lock period, restricted early withdrawal |

---

## ⚙️ 4. Functional Module Breakdown

### 4.1 Authentication & User Management
- **Role-Based Access Control (RBAC)**: Strict segregation between `admin`, `officer`, and `customer` routes enforced via `RoleMiddleware`.
- **Email Verification Lifecycle**:
  - Implements Laravel's `MustVerifyEmail` interface.
  - Endpoints: `POST /api/email/send-verification` and `POST /api/email/verify`.
  - Generates a 6-digit OTP code dispatched to the in-app notification center.
  - Interactive profile verification modal with live verification status chip and timestamp.
- **Session Lifecycle & Hardening**:
  - 120-minute expiration configured via `config/sanctum.php`.
  - 5-minute automated heartbeat verifying token vitality via `/api/me`.
  - 30-minute idle inactivity auto-logout with alert notification.
  - Multi-tab session synchronization through `StorageEvent` listeners.
- **Profile & Credential Management**:
  - Avatar uploads (`POST /api/profile` supporting multipart form-data).
  - Password updates with current password hashing validation.
  - Forensic login attempt tracker logging IP addresses, user agents, and statuses (`success` vs. `failed`).

### 4.2 Multi-Tier Bank Account Management
- **Checking Accounts**: High-velocity transactional accounts for routine deposits, withdrawals, and peer transfers.
- **Savings Accounts**: High-yield interest-bearing accounts subject to configurable minimum balances and interest accruals.
- **Fixed Deposit Accounts**: Term certificates locking funds for defined durations (e.g., 180 days) with maturity enforcement.
- **Administrative Operations**: Officers and Administrators can block or unblock delinquent accounts or process account terminations.

### 4.3 Interactive Account Dashboard
- **Financial KPI Cards**: Instant cards displaying Total Balance, Total Accounts, Active Loans, Scheduled Transfers, Interest Earned, Recent Fees, Pending Approvals, and Unread Notifications.
- **Portfolio Allocation Chart**: Recharts visual breakdown displaying funds distributed across Checking, Savings, and Fixed Deposits.
- **Interactive Modals**: Instant deposit, withdrawal, and new account opening directly from the dashboard.

### 4.4 Cash Deposits & Withdrawals
- Supports simulated counter deposits and cash machine (ATM) withdrawals.
- Full input validation verifying available balances, withdrawal limits, and account status.
- Every cash operation automatically updates account balances and writes balanced general ledger entries.

### 4.5 Peer-to-Peer (P2P) Fund Transfers
- Real-time recipient account number lookup verifying account title and currency compatibility before initiation.
- Atomic database transactions (`DB::transaction`) guaranteeing funds never disappear in transit.
- **Threshold Quarantining**: Transfers exceeding **\$10,000.00** automatically switch status to `requires_approval` and quarantine funds until compliance sign-off.

### 4.6 Dual-Control (4-Eyes) Approvals Workflow
- Dedicated approval portal (`/approvals`) for Compliance Officers and System Administrators.
- Detailed transaction inspection (sender, recipient, amount, timestamp, reason).
- Actions: **Approve** (posts debits/credits to general ledger and completes transfer) or **Reject** (returns funds and releases hold).

### 4.7 Automated Loan Simulation Engine
- **Loan Applications**: Customers apply with requested principal amount, term in months, and purpose.
- **Administrative Evaluation**: Staff approves or rejects applications with custom review notes.
- **Amortization Schedule Generation**: Generates monthly installment breakdown calculating principal vs. interest components.
- **Loan Repayments**: Customers submit repayments with automated ledger balance reduction.

### 4.8 Scheduled Standing Orders & Recurring Payments
- Automated recurring transfers supporting **Daily**, **Weekly**, and **Monthly** frequencies.
- Cron-ready execution history tracking attempt logs, execution timestamps, and error messages.
- Manual trigger action (`POST /api/scheduled-transfers/trigger-now`) for administrative demonstration.

### 4.9 Automated Interest Calculation Engine
- Configurable interest rate tables linked to account types.
- **Accrual Preview**: Administrators inspect accrued interest for all eligible accounts before posting.
- **Batch Posting**: Computes simple/compound interest and credits customer balances while recording double-entry interest expense journals.

### 4.10 Automated Banking Fee Engine
- Configurable fee types (Monthly Maintenance Fees, P2P Transfer Fees, Withdrawal Fees).
- Batch processing engine applying scheduled maintenance deductions.
- Records fee deductions in customer transaction histories and fee audit tables.

### 4.11 Double-Entry General Ledger & Reconciliation
- Immutable journal recording balanced debit and credit entries for every transaction.
- **Reconciliation Engine**: Automated reconciliation dashboard validating that total debits match total credits with exact **\$0.00 drift**:
  $$\sum \text{Debits} - \sum \text{Credits} = 0.00$$

### 4.12 Forensic Audit Trail & Security Watchdog
- Comprehensive audit trail recording user ID, action name, target entity, IP address, user agent, and payload.
- **Fraud Monitoring Engine**: Detects velocity anomalies (rapid successive withdrawals) and flags high-value transfers.

### 4.13 Financial Reports & CSV Export Engine
- Daily cashflow statement, account balance summary, and loan portfolio performance.
- One-click CSV export engine for transactions, audit trails, and general ledger reports.

---

## 🗄 5. Complete Database Schema Dictionary

The system operates across **23 optimized relational database tables**:

```
 1. users                    - Core user records, role ('admin','officer','customer'), status, email_verified_at
 2. user_profiles            - Extended KYC data (address, date of birth, identification number, avatar path)
 3. account_types            - Configuration for Checking, Savings, and Fixed Deposit account types
 4. bank_accounts            - Individual accounts with unique account numbers (CHK-, SAV-, FD-), balance, status
 5. transactions             - Central financial movements with unique references (TXN-...), amounts, fees, statuses
 6. ledger_entries           - Double-entry accounting records (debit, credit, balance_after)
 7. scheduled_transfers      - Recurring standing order configurations (frequency, next run date, end date)
 8. scheduled_transfer_logs - Historical execution audit logs for recurring transfers
 9. interest_rates           - Effective date-ranged interest rates linked to account types
10. interest_calculations    - Detailed records of computed and credited interest payouts
11. fee_types                - Configurable fee rules (fixed vs percentage, applicable account types)
12. fees                     - Applied banking fees linked to transactions and bank accounts
13. loans                    - Customer loan applications, approved amounts, interest rates, total payables
14. loan_schedules           - Month-by-month repayment amortization schedule installments
15. loan_repayments          - Completed loan repayment records tracking principal vs interest split
16. approvals                - Dual-control approval requests for quarantined high-value transactions
17. notifications            - User alerts, security notifications, and simulated OTP delivery
18. audit_logs               - Forensic security audit trail tracking every system mutation
19. login_attempts           - Security tracker for successful and failed authentication attempts
20. idempotency_keys         - Cryptographic tokens preventing duplicate transaction execution
21. system_settings          - Key-value configuration store (approval thresholds, daily limits)
22. sessions                 - Database session storage table
23. personal_access_tokens   - Laravel Sanctum API Bearer tokens with expiration tracking
```

---

## 📡 6. Complete API Endpoint Catalogue

### Authentication & Profile
- `POST /api/register` — Register new customer account (with welcome checking account)
- `POST /api/login` — Sign in and issue Sanctum Bearer token
- `POST /api/logout` — Revoke token and terminate session
- `GET  /api/me` — Retrieve authenticated user profile with accounts
- `POST /api/profile` — Update KYC details and upload avatar
- `POST /api/change-password` — Change password with validation
- `POST /api/email/send-verification` — Dispatch 6-digit OTP code
- `POST /api/email/verify` — Confirm email verification code

### Dashboards
- `GET /api/dashboard/user` — Personal banking summary and metrics
- `GET /api/dashboard/admin` — System-wide metrics, liquidity, and volume
- `GET /api/dashboard/instructor` — Compliance, approvals, and audit metrics

### Bank Accounts
- `GET  /api/my-accounts` — List current user's accounts
- `POST /api/accounts` — Open new bank account
- `GET  /api/accounts/{id}` — View account details and ledger history
- `POST /api/accounts/{id}/close` — Terminate eligible account
- `GET  /api/accounts` — Staff overview of all accounts
- `POST /api/accounts/{id}/block` — Restrict delinquent account
- `POST /api/accounts/{id}/unblock` — Restore account status

### Financial Transactions & Transfers
- `GET  /api/my-transactions` — Customer transaction history
- `GET  /api/transactions` — Staff view of all transactions
- `GET  /api/transactions/{id}` — Transaction detail with ledger pairs
- `POST /api/transactions/deposit` — Simulate cash deposit *(Idempotent)*
- `POST /api/transactions/withdraw` — Simulate cash withdrawal *(Idempotent)*
- `POST /api/transactions/{id}/reverse` — Administrative transaction reversal
- `POST /api/transfers/lookup` — Pre-validate recipient account title
- `POST /api/transfers` — Execute peer-to-peer fund transfer *(Idempotent)*

### Dual-Control Approvals
- `GET  /api/approvals` — Pending high-value transactions queue
- `GET  /api/approvals/history` — Historical approval decisions
- `POST /api/approvals/{id}/approve` — Approve and post to ledger
- `POST /api/approvals/{id}/reject` — Reject and release funds hold

### Loans & Amortization
- `POST /api/loans/apply` — Submit loan request
- `GET  /api/my-loans` — Customer loan list and amortization schedules
- `GET  /api/loans/{id}` — Loan details with installment schedule
- `POST /api/loans/{id}/repay` — Make installment payment
- `GET  /api/loans` — Staff queue of loan applications
- `POST /api/loans/{id}/approve` — Approve and disburse loan funds
- `POST /api/loans/{id}/reject` — Reject loan application
- `GET  /api/loan-repayments` — Staff view of repayment history

### Scheduled Recurring Transfers
- `GET  /api/my-scheduled-transfers` — Customer active standing orders
- `POST /api/scheduled-transfers` — Create new recurring transfer
- `PUT  /api/scheduled-transfers/{id}/status` — Pause or resume transfer
- `GET  /api/scheduled-transfers/{id}/logs` — Execution history logs
- `GET  /api/scheduled-transfers` — Staff view of all scheduled transfers
- `POST /api/scheduled-transfers/trigger-now` — Trigger manual execution

### Accrual Interest & Fees
- `GET  /api/interest-rates` — Active interest rates
- `POST /api/interest-rates` — Set interest rate for account type
- `GET  /api/interest/preview` — Preview accrued interest batch
- `POST /api/interest/process` — Execute interest calculation and posting
- `GET  /api/interest-calculations` — Historical interest payouts
- `GET  /api/fee-types` — Configured fee types
- `POST /api/fee-types` — Create new banking fee type
- `POST /api/fees/apply` — Apply individual fee
- `POST /api/fees/process-maintenance` — Batch process monthly maintenance fees
- `GET  /api/fees/history` — Applied fees history

### General Ledger, Audit & Reports
- `GET /api/ledger` — Double-entry general ledger journal
- `GET /api/ledger/reconciliation` — Real-time reconciliation report
- `GET /api/notifications` — Notification inbox and unread count
- `PUT /api/notifications/{id}/read` — Mark notification read
- `POST /api/notifications/read-all` — Mark all notifications read
- `GET /api/audit-logs` — System audit trail
- `GET /api/security-alerts` — Fraud watchdog velocity warnings
- `GET /api/users` — Staff user management list
- `PUT /api/users/{id}/status` — Update user status (active/suspended)
- `GET /api/reports/cashflow` — Cashflow analysis report
- `GET /api/reports/export/{type}` — Download CSV report

---

## 🚀 7. Installation & Local Deployment Guide

### Prerequisites
1. **XAMPP** (with Apache and MySQL / MariaDB running)
2. **PHP 8.2 or higher**
3. **Composer 2.x**
4. **Node.js (v18+) & npm**

### Step-by-Step Setup

```bash
# 1. Clone the repository into your XAMPP htdocs directory
cd c:\xampp\htdocs
git clone https://github.com/josenarame-cmd/banking_simulation.git banking
cd banking

# 2. Configure Environment Parameters
cp .env.example .env
php artisan key:generate

# 3. Create the Database in MySQL / MariaDB
# Open phpMyAdmin (http://localhost/phpmyadmin) or MySQL CLI:
# CREATE DATABASE banking_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Ensure .env contains:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=banking_system
# DB_USERNAME=root
# DB_PASSWORD=

# 4. Install Dependencies
composer install
npm install

# 5. Execute Relational Migrations & Seeders
php artisan migrate:fresh --seed

# 6. Compile Frontend Assets
npm run build
# Or start Vite hot-reload dev server:
# npm run dev

# 7. Launch the Application
# Access directly through your Apache web server:
# http://localhost/banking/public/
# Or via Laravel development server:
# php artisan serve -> http://127.0.0.1:8000
```

---

## 🔒 8. Security & Financial Integrity Controls

- **Double-Entry Enforcement**: The `LedgerService` rejects any transaction where debits do not strictly equal credits.
- **ACID Database Transactions**: Financial state mutations are wrapped in database transactions (`DB::transaction`) to prevent partial state updates.
- **Cryptographic Idempotency**: State-changing endpoints require an `X-Idempotency-Key` header; duplicate requests return the cached original response without re-executing deductions.
- **Dual-Control Quarantining**: Large transactions (> \$10,000) are placed on hold until an authorized Compliance Officer or Administrator approves them.
- **Audit Trails**: Security audit trail tracking user IDs, actions, entity types, IP addresses, and timestamps.
- **Sanctum Token Security**: Token expiration (120 minutes), background heartbeat checks, and inactivity timeout (30 minutes).

---

## 📄 9. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details. Built for educational and commercial simulation purposes as part of the **RP Karongi College TVET Certificate VII in Information Technology** assessment.
