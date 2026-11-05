import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Stack,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    Divider
} from '@mui/material';

// Icons
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SendIcon from '@mui/icons-material/Send';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import ReceiptModal from '../../components/ReceiptModal';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';

export default function UserDashboard() {
    const { user, isAdmin, isInstructor, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [depositOpen, setDepositOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [receiptTx, setReceiptTx] = useState(null);

    // Form inputs
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [accountTypes, setAccountTypes] = useState([]);
    const [newAccountTypeId, setNewAccountTypeId] = useState('');
    const [newAccountName, setNewAccountName] = useState('');
    const [modalError, setModalError] = useState('');
    const [modalSuccess, setModalSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const isStaff = isAdmin || isInstructor;

    const loadDashboard = async () => {
        try {
            const res = await api.get('/dashboard/user');
            setData(res.data);
            if (res.data.accounts?.length > 0) {
                setSelectedAccountId((prev) => {
                    const exists = res.data.accounts.some((a) => a.id === prev);
                    return exists ? prev : res.data.accounts[0].id;
                });
            }
        } catch (err) {
            console.error('Failed to load user dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAccountTypes = async () => {
        try {
            const res = await api.get('/account-types');
            setAccountTypes(res.data.data || []);
            if (res.data.data?.length > 0) {
                setNewAccountTypeId(res.data.data[0].id);
            }
        } catch (err) {
            console.error('Failed to load account types:', err);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        loadDashboard();
        loadAccountTypes();
    }, [user]);

    const resetModalForm = () => {
        setAmount('');
        setDescription('');
        setModalError('');
        setModalSuccess('');
    };

    const handleDeposit = async () => {
        setModalError('');
        setModalSuccess('');

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            setModalError('Please enter a valid deposit amount greater than zero.');
            return;
        }
        if (!selectedAccountId) {
            setModalError('Please select a destination account.');
            return;
        }

        setActionLoading(true);
        try {
            await api.post('/transactions/deposit', {
                account_id: selectedAccountId,
                amount: amt,
                description: description || 'Simulated Cash Deposit',
            });
            setModalSuccess('Deposit processed successfully!');
            setAmount('');
            setDescription('');
            await loadDashboard();
            setTimeout(() => setDepositOpen(false), 1200);
        } catch (err) {
            setModalError(err.response?.data?.message || 'Deposit failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleWithdraw = async () => {
        setModalError('');
        setModalSuccess('');

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            setModalError('Please enter a valid withdrawal amount greater than zero.');
            return;
        }
        if (!selectedAccountId) {
            setModalError('Please select a source account.');
            return;
        }

        setActionLoading(true);
        try {
            await api.post('/transactions/withdraw', {
                account_id: selectedAccountId,
                amount: amt,
                description: description || 'Simulated Cash Withdrawal',
            });
            setModalSuccess('Withdrawal completed successfully!');
            setAmount('');
            setDescription('');
            await loadDashboard();
            setTimeout(() => setWithdrawOpen(false), 1200);
        } catch (err) {
            setModalError(err.response?.data?.message || 'Withdrawal failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        setModalError('');
        setModalSuccess('');

        if (!newAccountTypeId) {
            setModalError('Please select an account type.');
            return;
        }

        setActionLoading(true);
        try {
            await api.post('/accounts', {
                account_type_id: newAccountTypeId,
                account_name: newAccountName,
                initial_deposit: parseFloat(amount) || 0,
            });
            setModalSuccess('New account opened successfully!');
            setAmount('');
            setNewAccountName('');
            await loadDashboard();
            setTimeout(() => setAccountOpen(false), 1200);
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to open account.');
        } finally {
            setActionLoading(false);
        }
    };

    const formatType = (val) => {
        if (!val) return 'N/A';
        const str = typeof val === 'object' ? (val.code || val.name || '') : String(val);
        return str.replace(/_/g, ' ').toUpperCase() || 'N/A';
    };

    const getTypeCode = (val) => {
        if (!val) return '';
        return (typeof val === 'object' ? (val.code || val.name || '') : String(val)).toLowerCase();
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Staff Navigation Hint */}
            {isStaff && (
                <Alert
                    severity="info"
                    icon={isAdmin ? <AdminPanelSettingsIcon /> : <SchoolIcon />}
                    sx={{ mb: 3 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            component={RouterLink}
                            to={isAdmin ? '/admin/dashboard' : '/instructor/dashboard'}
                        >
                            Open {isAdmin ? 'Admin Overview' : 'Instructor Lab'}
                        </Button>
                    }
                >
                    You are viewing personal banking operations. To manage users, review audit trails, or supervise student accounts, visit the administrative dashboard.
                </Alert>
            )}

            {/* Header Greeting & Quick Actions */}
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} mb={4} gap={2}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Welcome back, {user?.name}! 👋
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Here is an overview of your simulated bank accounts and latest movements.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SendIcon />}
                        onClick={() => navigate('/transfers')}
                    >
                        Send Transfer
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowDownwardIcon />}
                        onClick={() => { resetModalForm(); setDepositOpen(true); }}
                    >
                        Deposit
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowUpwardIcon />}
                        onClick={() => { resetModalForm(); setWithdrawOpen(true); }}
                    >
                        Withdraw
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => { resetModalForm(); setAccountOpen(true); }}
                    >
                        Open Account
                    </Button>
                </Stack>
            </Box>

            {/* Primary KPI Summary Cards */}
            <Grid container spacing={2.5} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Available Funds"
                        value={`$${Number(data?.summary?.total_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        icon={<AccountBalanceWalletIcon />}
                        color="primary"
                        subtitle={`Across ${data?.summary?.accounts_count || 0} accounts`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Simulated Bank Accounts"
                        value={data?.summary?.accounts_count || 0}
                        icon={<AccountBalanceIcon />}
                        color="secondary"
                        subtitle="Checking, Savings, Fixed Term"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Loan Debt"
                        value={`$${Number(data?.summary?.total_loan_debt || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        icon={<MonetizationOnIcon />}
                        color="info"
                        subtitle={`${data?.summary?.active_loans_count || 0} active loans`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Scheduled Transfers"
                        value={data?.summary?.scheduled_transfers_count || 0}
                        icon={<ScheduleIcon />}
                        color="warning"
                        subtitle="Active recurring transfers"
                    />
                </Grid>
            </Grid>

            {/* Secondary Financial Metrics: Interest, Fees, Pending Approvals, Notifications */}
            <Grid container spacing={2.5} mb={4}>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Interest Earned"
                        value={`+$${Number(data?.summary?.interest_earned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        icon={<TrendingUpIcon />}
                        color="success"
                        subtitle="Credited savings & CD yield"
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Recent Fees"
                        value={`$${Number(data?.summary?.recent_fees || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        icon={<PriceCheckIcon />}
                        color="secondary"
                        subtitle="Maintenance & transfer fees"
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Pending Approvals"
                        value={data?.summary?.pending_approvals || 0}
                        icon={<HourglassEmptyIcon />}
                        color="warning"
                        subtitle="Awaiting officer review"
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Unread Notifications"
                        value={data?.summary?.unread_notifications || 0}
                        icon={<NotificationsActiveIcon />}
                        color="info"
                        subtitle="Security & transfer alerts"
                    />
                </Grid>
            </Grid>

            {/* Financial Visualizer: Balances by Account Type (Recharts) */}
            {data?.accounts?.length > 0 && (
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} md={5}>
                        <Card sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom>
                                Portfolio Allocation
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                                Visual distribution of your liquid vs term banking assets
                            </Typography>
                            <Box sx={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={(data?.balances_by_type || []).map(b => ({
                                                name: formatType(b.account_type),
                                                value: Number(b.total_balance) || 0
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {['#0284c7', '#10b981', '#f59e0b', '#8b5cf6'].map((color, index) => (
                                                <Cell key={`cell-${index}`} fill={color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(val) => `$${Number(val).toLocaleString()}`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Card sx={{ p: 3, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom>
                                Liquid Position & Reserve Breakdown
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Total Assets Settled: <strong>${Number(data?.summary?.total_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                            </Typography>
                            <Stack spacing={2}>
                                {(data?.balances_by_type || []).map((b, idx) => (
                                    <Box key={idx} display="flex" justifyContent="space-between" alignItems="center" p={1.5} sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Chip label={formatType(b.account_type)} size="small" color={idx === 0 ? 'primary' : idx === 1 ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
                                            <Typography variant="body2" fontWeight={600}>
                                                {b.count} {b.count === 1 ? 'account' : 'accounts'}
                                            </Typography>
                                        </Box>
                                        <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                                            ${Number(b.total_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* My Accounts Grid */}
            <Typography variant="h5" fontWeight={700} mb={2}>
                My Accounts
            </Typography>
            <Grid container spacing={3} mb={4}>
                {data?.accounts?.length === 0 ? (
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                            <AccountBalanceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                No Bank Accounts Opened Yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Open your first Checking, Savings, or Fixed Deposit account to start simulating deposits and transfers.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={() => { resetModalForm(); setAccountOpen(true); }}
                            >
                                Open an Account
                            </Button>
                        </Paper>
                    </Grid>
                ) : (
                    data?.accounts?.map((acc) => {
                        const code = getTypeCode(acc.account_type);
                        return (
                            <Grid item xs={12} md={4} key={acc.id}>
                                <Card sx={{ p: 3, borderRadius: 3, position: 'relative' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Chip
                                            label={formatType(acc.account_type)}
                                            size="small"
                                            color={code === 'checking' ? 'primary' : code === 'savings' ? 'secondary' : 'default'}
                                            sx={{ fontWeight: 700, fontSize: '0.68rem' }}
                                        />
                                        <StatusBadge status={acc.status} />
                                    </Box>
                                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                                        {acc.account_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                                        {acc.account_number}
                                    </Typography>
                                    <Typography variant="h4" fontWeight={800} color="primary" sx={{ my: 2 }}>
                                        ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </Typography>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="text.secondary">
                                            Interest: {code === 'savings' ? '4.5%' : code === 'fixed_deposit' ? '8.0%' : '0%'}
                                        </Typography>
                                        <Button size="small" onClick={() => navigate(`/accounts/${acc.id}`)}>
                                            View Statement →
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>
                        );
                    })
                )}
            </Grid>

            {/* Recent Transactions & Loan Schedules */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ borderRadius: 3, p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
                            <Typography variant="h6" fontWeight={700}>
                                Recent Transactions
                            </Typography>
                            <Button size="small" onClick={() => navigate('/transactions')}>
                                View All
                            </Button>
                        </Box>
                        <TableContainer component={Paper} elevation={0}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Reference</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell align="right">Receipt</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.recent_transactions?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                No transactions recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.recent_transactions?.map((tx) => (
                                            <TableRow key={tx.id} hover>
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                    {tx.reference}
                                                </TableCell>
                                                <TableCell sx={{ textTransform: 'capitalize' }}>
                                                    {(tx.transaction_type || '').replace(/_/g, ' ')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                    ${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={tx.status} />
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={() => setReceiptTx(tx)} title="View Receipt">
                                                        <ReceiptIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 3, p: 2 }}>
                        <Typography variant="h6" fontWeight={700} p={2}>
                            Upcoming Loan Repayments
                        </Typography>
                        {data?.upcoming_installments?.length === 0 ? (
                            <Box p={3} textAlign="center" color="text.secondary">
                                <Typography variant="body2">No pending installments due.</Typography>
                                <Button size="small" sx={{ mt: 1 }} onClick={() => navigate('/loans')}>
                                    Apply for Loan
                                </Button>
                            </Box>
                        ) : (
                            <Stack spacing={2} p={1}>
                                {data?.upcoming_installments?.map((inst) => (
                                    <Paper key={inst.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                Installment #{inst.installment_number}
                                            </Typography>
                                            <Typography variant="subtitle2" color="error.main" fontWeight={700}>
                                                ${Number(inst.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Due date: {inst.due_date}
                                        </Typography>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Card>
                </Grid>
            </Grid>

            {/* Deposit Modal */}
            <Dialog open={depositOpen} onClose={() => setDepositOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Simulated Cash Deposit</DialogTitle>
                <DialogContent dividers>
                    {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
                    {modalSuccess && <Alert severity="success" sx={{ mb: 2 }}>{modalSuccess}</Alert>}

                    {data?.accounts?.length === 0 ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            You do not have any open bank accounts to deposit funds into.
                        </Alert>
                    ) : (
                        <TextField
                            select
                            fullWidth
                            label="Destination Account"
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            margin="normal"
                        >
                            {data?.accounts?.map((acc) => (
                                <MenuItem key={acc.id} value={acc.id}>
                                    {acc.account_number} ({formatType(acc.account_type)}) — ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    <TextField
                        fullWidth
                        label="Deposit Amount ($)"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        margin="normal"
                        inputProps={{ min: "0.01", step: "0.01" }}
                        required
                        disabled={data?.accounts?.length === 0}
                    />
                    <TextField
                        fullWidth
                        label="Description / Source"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        margin="normal"
                        placeholder="e.g. Salary deposit, ATM cash"
                        disabled={data?.accounts?.length === 0}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDepositOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleDeposit}
                        variant="contained"
                        disabled={actionLoading || data?.accounts?.length === 0}
                    >
                        {actionLoading ? <CircularProgress size={20} /> : 'Confirm Deposit'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Withdraw Modal */}
            <Dialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Simulated Cash Withdrawal</DialogTitle>
                <DialogContent dividers>
                    {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
                    {modalSuccess && <Alert severity="success" sx={{ mb: 2 }}>{modalSuccess}</Alert>}

                    {data?.accounts?.length === 0 ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            You do not have any open bank accounts to withdraw funds from.
                        </Alert>
                    ) : (
                        <TextField
                            select
                            fullWidth
                            label="Source Account"
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            margin="normal"
                        >
                            {data?.accounts?.map((acc) => (
                                <MenuItem key={acc.id} value={acc.id}>
                                    {acc.account_number} ({formatType(acc.account_type)}) — ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    <TextField
                        fullWidth
                        label="Withdrawal Amount ($)"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        margin="normal"
                        inputProps={{ min: "0.01", step: "0.01" }}
                        required
                        disabled={data?.accounts?.length === 0}
                    />
                    <TextField
                        fullWidth
                        label="Reason"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        margin="normal"
                        placeholder="e.g. Counter withdrawal"
                        disabled={data?.accounts?.length === 0}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setWithdrawOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleWithdraw}
                        variant="contained"
                        color="warning"
                        disabled={actionLoading || data?.accounts?.length === 0}
                    >
                        {actionLoading ? <CircularProgress size={20} /> : 'Confirm Withdrawal'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Open Account Modal */}
            <Dialog open={accountOpen} onClose={() => setAccountOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>Open a New Bank Account</DialogTitle>
                <DialogContent dividers>
                    {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
                    {modalSuccess && <Alert severity="success" sx={{ mb: 2 }}>{modalSuccess}</Alert>}
                    <TextField
                        select
                        fullWidth
                        label="Select Account Type"
                        value={newAccountTypeId}
                        onChange={(e) => setNewAccountTypeId(e.target.value)}
                        margin="normal"
                    >
                        {accountTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                                {type.name} — Min Balance: ${type.minimum_balance} | Interest: {type.interest_rate}%
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        label="Custom Account Nickname (optional)"
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        margin="normal"
                        placeholder="e.g. Rainy Day Savings"
                    />
                    <TextField
                        fullWidth
                        label="Initial Opening Deposit ($)"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        margin="normal"
                        placeholder="0.00"
                        inputProps={{ min: "0", step: "0.01" }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setAccountOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateAccount} variant="contained" color="secondary" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} /> : 'Open Account'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Receipt Modal */}
            <ReceiptModal
                open={Boolean(receiptTx)}
                onClose={() => setReceiptTx(null)}
                transaction={receiptTx}
            />
        </Container>
    );
}
