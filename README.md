# ApexCore Banking System

ApexCore is a modern, enterprise-grade Core Banking simulation engine built with **Laravel** and **React (Material-UI)**. It replicates real-world institutional and commercial banking operations adhering to international financial standards, balanced double-entry accounting, and high-security compliance workflows.

---

## 🏛 Core Banking Architecture & Features

### 1. Multi-Tier Account Portfolios
- **Checking Accounts**: High-velocity everyday transactional accounts with instant P2P transfer capabilities.
- **High-Yield Savings**: Interest-accruing vault accounts with customizable compounding APY calculations.
- **Fixed-Term Certificates (CDs)**: Lock-in term deposits with maturity date enforcement and yield payout journals.

### 2. Balanced Double-Entry General Ledger
- Every transaction (deposit, withdrawal, internal transfer, interest payout) automatically creates matching debit and credit journal entries.
- Immutable ledger with exact zero discrepancy ($0.00 drift):
  $$\sum \text{Debits} - \sum \text{Credits} = 0$$

### 3. Idempotent Transfer Engine
- Transaction requests are protected by cryptographic idempotency tokens to avoid duplicate deductions from repeated clicks or network interruptions.

### 4. Dual-Control (4-Eyes) Approvals & Fraud Watchdog
- **Threshold Quarantining**: Large transactions exceeding $10,000 trigger automated isolation into the Administrative Approvals queue.
- **Velocity Anomaly Detection**: Monitors rapid successive withdrawals to protect accounts against fraudulent draining.

### 5. Automated Credit & Loan Lifecycle
- Student and commercial loan applications.
- Risk evaluation and instant disbursement into checking portfolios.
- Automated monthly amortization tracking with principal vs. interest breakdown.

### 6. Cron-Powered Scheduled Standing Orders
- Recurring automated transfers with execution histories, failure handling, and digital receipt generation.

---

## 💻 Tech Stack

- **Backend**: Laravel 11 / PHP 8.2+
- **Database**: MySQL / MariaDB (via XAMPP)
- **Frontend**: React 18, React Router v6, Material-UI (MUI v6), Emotion
- **Build Tool**: Vite v7
- **Styling**: Cinematic glassmorphism, responsive grid layout, light/dark mode support

---

## 🚀 Getting Started

### Prerequisites
- [XAMPP](https://www.apachefriends.org/) (Apache & MySQL)
- [Composer](https://getcomposer.org/)
- [Node.js](https://nodejs.org/) (v18+)

### Installation & Local Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd banking
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   *Update your `.env` database parameters (`DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).*

3. **Install Dependencies**:
   ```bash
   composer install
   npm install
   ```

4. **Run Migrations & Seeders**:
   ```bash
   php artisan migrate --seed
   ```

5. **Build Frontend Assets**:
   ```bash
   npm run build
   # Or for active development:
   npm run dev
   ```

6. **Serve the Application**:
   - Access via Apache virtual host / `http://localhost/banking/public`
   - Or start Laravel's built-in server:
     ```bash
     php artisan serve
     ```

---

## 🔑 Default Banking Credentials

| Role | Bank Job Title | Email | Password | Access Level |
|---|---|---|---|---|
| `admin` | **System Administrator** | `admin@banking.com` | `password123` | Full Core Banking administration, interest engine, fees, users |
| `officer` | **Compliance Officer** | `officer@banking.com` | `password123` | High-value approvals (> \$10k), audit logs, ledger reconciliation, reports |
| `customer` | **Banking Customer (James Carter)** | `james.carter@banking.com` | `password123` | Accounts, transfers, deposits, withdrawals, loans, scheduled payments |
| `customer` | **Banking Customer (Jane Smith)** | `jane.smith@banking.com` | `password123` | P2P transfer recipient, simulated accounts |

---

## 🛡 Security & Compliance Standards
- **TLS / HTTPS Encryption**: End-to-end tokenized sessions using Bearer authentications.
- **Audit Trails**: Forensics logging capturing IP addresses, timestamps, and actor roles for every state change.
- **Zero Real-World Liability**: Operates purely with simulated financial balances for educational and operational training.

---

## 📄 License
This software is provided for academic, training, and commercial simulation purposes under the [MIT License](LICENSE).
