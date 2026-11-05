import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomThemeProvider } from './context/ThemeContext';

import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/auth/Profile';

import UserDashboard from './pages/dashboard/UserDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import InstructorDashboard from './pages/dashboard/InstructorDashboard';

import AccountsList from './pages/accounts/AccountsList';
import AccountDetails from './pages/accounts/AccountDetails';
import TransferPage from './pages/transfers/TransferPage';
import TransactionsList from './pages/transactions/TransactionsList';
import ApprovalsPage from './pages/approvals/ApprovalsPage';
import LoansPage from './pages/loans/LoansPage';
import ScheduledTransfersPage from './pages/scheduled/ScheduledTransfersPage';
import LedgerPage from './pages/ledger/LedgerPage';
import ReconciliationPage from './pages/ledger/ReconciliationPage';
import InterestManagementPage from './pages/interest/InterestManagementPage';
import FeesManagementPage from './pages/fees/FeesManagementPage';
import AuditLogsPage from './pages/security/AuditLogsPage';
import FraudAlertsPage from './pages/security/FraudAlertsPage';
import ReportsPage from './pages/reports/ReportsPage';
import UsersPage from './pages/admin/UsersPage';
import LandingPage from './pages/LandingPage';

// Protected Route Wrapper
const ProtectedRoute = ({ allowedRoles }) => {
    const { user, token, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'instructor') return <Navigate to="/instructor/dashboard" replace />;
        return <Navigate to="/dashboard" replace />;
    }

    return <Layout />;
};

// Root Dashboard Redirector based on user role
const RootRedirect = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role === 'admin') {
        return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'instructor') {
        return <Navigate to="/instructor/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
};

export default function AppRouter() {
    return (
        <CustomThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public Cinematic Landing Page & Auth */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/landing" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected Routes for All Authenticated Users */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/portal" element={<RootRedirect />} />
                            <Route path="/home" element={<RootRedirect />} />
                            <Route path="/dashboard" element={<UserDashboard />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/accounts" element={<AccountsList />} />
                            <Route path="/accounts/:id" element={<AccountDetails />} />
                            <Route path="/transfers" element={<TransferPage />} />
                            <Route path="/transactions" element={<TransactionsList />} />
                            <Route path="/loans" element={<LoansPage />} />
                            <Route path="/scheduled" element={<ScheduledTransfersPage />} />
                            <Route path="/scheduled-transfers" element={<ScheduledTransfersPage />} />
                            <Route path="/reports" element={<ReportsPage />} />
                        </Route>

                        {/* Instructor & Admin Protected Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'instructor']} />}>
                            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
                            <Route path="/approvals" element={<ApprovalsPage />} />
                            <Route path="/ledger" element={<LedgerPage />} />
                            <Route path="/reconciliation" element={<ReconciliationPage />} />
                            <Route path="/interest" element={<InterestManagementPage />} />
                            <Route path="/fees" element={<FeesManagementPage />} />
                            <Route path="/audit-logs" element={<AuditLogsPage />} />
                            <Route path="/fraud-alerts" element={<FraudAlertsPage />} />
                            <Route path="/security-alerts" element={<FraudAlertsPage />} />
                        </Route>

                        {/* Admin Exclusive Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                            <Route path="/admin/dashboard" element={<AdminDashboard />} />
                            <Route path="/users" element={<UsersPage />} />
                            {/* Administration Section Aliases */}
                            <Route path="/admin/accounts" element={<AccountsList />} />
                            <Route path="/admin/users" element={<UsersPage />} />
                            <Route path="/admin/interest" element={<InterestManagementPage />} />
                            <Route path="/admin/fees" element={<FeesManagementPage />} />
                            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                            <Route path="/admin/fraud-alerts" element={<FraudAlertsPage />} />
                        </Route>

                        {/* Catch-all redirect */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </CustomThemeProvider>
    );
}
