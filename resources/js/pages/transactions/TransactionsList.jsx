import React, { useState, useEffect } from 'react';
import {
    Container,
    Card,
    Typography,
    Box,
    Button,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    CircularProgress,
    Stack,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    LinearProgress
} from '@mui/material';

import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import StatusBadge from '../../components/StatusBadge';
import ReceiptModal from '../../components/ReceiptModal';
import { useAuth } from '../../context/AuthContext';
import api, { downloadCsv } from '../../api/client';

export default function TransactionsList() {
    const { user, isAdmin, isInstructor, loading: authLoading } = useAuth();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [exporting, setExporting] = useState(false);

    const [receiptTx, setReceiptTx] = useState(null);

    // Debounce search input by 300ms
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Quick Deposit & Withdraw Modals
    const [accounts, setAccounts] = useState([]);
    const [depositOpen, setDepositOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [modalAmount, setModalAmount] = useState('');
    const [modalDesc, setModalDesc] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [modalError, setModalError] = useState('');

    const loadTransactions = async () => {
        setLoading(true);
        // Read role fresh from user object to avoid stale closure
        const isAdminOrInstructor = user?.role === 'admin' || user?.role === 'instructor';
        const endpoint = isAdminOrInstructor ? '/transactions' : '/my-transactions';
        try {
            const res = await api.get(endpoint, {
                params: {
                    search: debouncedSearch,
                    type: typeFilter,
                    status: statusFilter,
                    from_date: fromDate,
                    to_date: toDate,
                    page,
                }
            });
            setTransactions(res.data.data || []);
            setTotalPages(res.data.last_page || 1);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadAccounts = async () => {
        try {
            const res = await api.get('/my-accounts');
            const list = res.data.accounts || [];
            setAccounts(list);
            if (list.length > 0) setSelectedAccountId(list[0].id);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        loadTransactions();
    }, [debouncedSearch, typeFilter, statusFilter, fromDate, toDate, page, user]);

    useEffect(() => {
        loadAccounts();
    }, []);

    const handleExport = async () => {
        setExporting(true);
        try {
            await downloadCsv('/reports/export/transactions', `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
        } catch (err) {
            alert('Failed to export CSV');
        } finally {
            setExporting(false);
        }
    };

    const handleDeposit = async () => {
        setModalError('');
        setActionLoading(true);
        try {
            await api.post('/transactions/deposit', {
                account_id: selectedAccountId,
                amount: parseFloat(modalAmount),
                description: modalDesc || 'Simulated Cash Deposit',
            });
            setDepositOpen(false);
            setModalAmount('');
            setModalDesc('');
            loadTransactions();
        } catch (err) {
            setModalError(err.response?.data?.message || 'Deposit failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleWithdraw = async () => {
        setModalError('');
        setActionLoading(true);
        try {
            await api.post('/transactions/withdraw', {
                account_id: selectedAccountId,
                amount: parseFloat(modalAmount),
                description: modalDesc || 'Simulated Cash Withdrawal',
            });
            setWithdrawOpen(false);
            setModalAmount('');
            setModalDesc('');
            loadTransactions();
        } catch (err) {
            setModalError(err.response?.data?.message || 'Withdrawal failed.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        {isAdmin || isInstructor ? 'Central Transactions Ledger' : 'Transaction History'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Comprehensive record of financial debits, credits, transfers, and fee settlements.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowDownwardIcon />}
                        onClick={() => { setModalError(''); setDepositOpen(true); }}
                    >
                        Deposit
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowUpwardIcon />}
                        onClick={() => { setModalError(''); setWithdrawOpen(true); }}
                    >
                        Withdraw
                    </Button>
                    {(isAdmin || isInstructor) && (
                        <Button
                            variant="contained"
                            startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <FileDownloadIcon />}
                            onClick={handleExport}
                            disabled={exporting}
                        >
                            Export CSV
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* Filters Bar */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        size="small"
                        label="Search Reference / Description"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        sx={{ minWidth: 260 }}
                    />
                    <TextField
                        select
                        size="small"
                        label="Transaction Type"
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        sx={{ minWidth: 180 }}
                    >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="deposit">Deposit</MenuItem>
                        <MenuItem value="withdrawal">Withdrawal</MenuItem>
                        <MenuItem value="peer_transfer">Peer Transfer</MenuItem>
                        <MenuItem value="internal_transfer">Internal Transfer</MenuItem>
                        <MenuItem value="loan_disbursement">Loan Disbursement</MenuItem>
                        <MenuItem value="loan_repayment">Loan Repayment</MenuItem>
                        <MenuItem value="interest">Interest Credit</MenuItem>
                        <MenuItem value="fee">Fee Deduction</MenuItem>
                    </TextField>
                    <TextField
                        select
                        size="small"
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="requires_approval">Requires Approval</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                    </TextField>
                    <TextField
                        size="small"
                        label="From Date"
                        type="date"
                        value={fromDate}
                        onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        size="small"
                        label="To Date"
                        type="date"
                        value={toDate}
                        onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>
            </Card>

            {/* Transactions Table */}
            <Card sx={{ borderRadius: 3, position: 'relative' }}>
                {loading && (
                    <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} />
                )}
                <TableContainer component={Paper} elevation={0}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Reference</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>From</TableCell>
                                <TableCell>To</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="center">Receipt</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No transaction records found matching filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id} hover>
                                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                            {tx.reference}
                                        </TableCell>
                                        <TableCell sx={{ textTransform: 'capitalize' }}>
                                            {tx.transaction_type?.replace(/_/g, ' ')}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                            {tx.from_account?.account_number || 'VAULT / EXTERNAL'}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                            {tx.to_account?.account_number || 'VAULT / EXTERNAL'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.95rem' }}>
                                            ${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={tx.status} />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.82rem' }}>
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 200 }} noWrap>
                                            {tx.description}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => setReceiptTx(tx)}>
                                                <ReceiptIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {totalPages > 1 && (
                    <Box display="flex" justifyContent="center" p={2}>
                        <Pagination count={totalPages} page={page} onChange={(e, val) => setPage(val)} color="primary" />
                    </Box>
                )}
            </Card>

            {/* Quick Deposit Modal */}
            <Dialog open={depositOpen} onClose={() => setDepositOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Simulated Cash Deposit</DialogTitle>
                <DialogContent dividers>
                    {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
                    <TextField
                        select
                        fullWidth
                        label="Destination Account"
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        margin="normal"
                    >
                        {accounts.map((acc) => (
                            <MenuItem key={acc.id} value={acc.id}>
                                {acc.account_number} ({typeof acc.account_type === 'object' ? (acc.account_type?.name || acc.account_type?.code) : acc.account_type}) - ${acc.balance}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        label="Deposit Amount ($)"
                        type="number"
                        value={modalAmount}
                        onChange={(e) => setModalAmount(e.target.value)}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        value={modalDesc}
                        onChange={(e) => setModalDesc(e.target.value)}
                        margin="normal"
                        placeholder="e.g. Cash Deposit"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDepositOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeposit} variant="contained" disabled={actionLoading}>
                        Confirm Deposit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Quick Withdraw Modal */}
            <Dialog open={withdrawOpen} onClose={() => setWithdrawOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Simulated Cash Withdrawal</DialogTitle>
                <DialogContent dividers>
                    {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
                    <TextField
                        select
                        fullWidth
                        label="Source Account"
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        margin="normal"
                    >
                        {accounts.map((acc) => (
                            <MenuItem key={acc.id} value={acc.id}>
                                {acc.account_number} ({typeof acc.account_type === 'object' ? (acc.account_type?.name || acc.account_type?.code) : acc.account_type}) - ${acc.balance}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        label="Withdrawal Amount ($)"
                        type="number"
                        value={modalAmount}
                        onChange={(e) => setModalAmount(e.target.value)}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        value={modalDesc}
                        onChange={(e) => setModalDesc(e.target.value)}
                        margin="normal"
                        placeholder="e.g. Counter withdrawal"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setWithdrawOpen(false)}>Cancel</Button>
                    <Button onClick={handleWithdraw} variant="contained" color="warning" disabled={actionLoading}>
                        Confirm Withdrawal
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

