import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    Chip,
    CircularProgress,
    LinearProgress,
    Stack,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tabs,
    Tab
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function AccountsList() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isStaff = user?.role === 'admin' || user?.role === 'officer';
    // If on /admin/accounts, default to All Accounts (0). On /accounts, if staff, default to All (0), customer defaults to 1.
    const [viewTab, setViewTab] = useState(() => (location.pathname.startsWith('/admin') || isStaff) ? 0 : 1);

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal for New Account
    const [openModal, setOpenModal] = useState(false);
    const [accountTypes, setAccountTypes] = useState([]);
    const [newTypeId, setNewTypeId] = useState('');
    const [newAccName, setNewAccName] = useState('');
    const [deposit, setDeposit] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Sync tab when navigating between /admin/accounts and /accounts
    useEffect(() => {
        if (location.pathname.startsWith('/admin')) {
            setViewTab(0);
        }
    }, [location.pathname]);

    // Debounce search input by 300ms
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const showingAll = isStaff && viewTab === 0;

    const loadAccounts = async () => {
        setLoading(true);
        try {
            if (showingAll) {
                const res = await api.get('/accounts', {
                    params: {
                        search: debouncedSearch,
                        account_type: typeFilter,
                        status: statusFilter,
                        page,
                    }
                });
                setAccounts(res.data.data || []);
                setTotalPages(res.data.last_page || 1);
            } else {
                const res = await api.get('/my-accounts');
                let list = res.data.accounts || [];
                if (typeFilter) {
                    list = list.filter(a => {
                        const t = typeof a.account_type === 'object' ? a.account_type?.code : a.account_type;
                        return String(t).toLowerCase() === typeFilter.toLowerCase();
                    });
                }
                if (statusFilter) {
                    list = list.filter(a => a.status === statusFilter);
                }
                if (debouncedSearch) {
                    const s = debouncedSearch.toLowerCase();
                    list = list.filter(a =>
                        (a.account_number || '').toLowerCase().includes(s) ||
                        (a.account_name || '').toLowerCase().includes(s)
                    );
                }
                setAccounts(list);
                setTotalPages(1);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadTypes = async () => {
        try {
            const res = await api.get('/account-types');
            setAccountTypes(res.data.data || []);
            if (res.data.data?.length > 0) setNewTypeId(res.data.data[0].id);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        loadAccounts();
    }, [debouncedSearch, typeFilter, statusFilter, page, user, viewTab]);

    useEffect(() => {
        loadTypes();
    }, []);

    const handleCreateAccount = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        setSubmitting(true);
        try {
            await api.post('/accounts', {
                account_type_id: newTypeId,
                account_name: newAccName,
                initial_deposit: parseFloat(deposit) || 0,
            });
            setSuccessMsg('Account opened successfully!');
            await loadAccounts();
            setTimeout(() => {
                setOpenModal(false);
                setDeposit('');
                setNewAccName('');
            }, 1000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to open account.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBlock = async (id) => {
        const reason = prompt('Please enter reason to block this account:');
        if (!reason) return;
        try {
            await api.post(`/accounts/${id}/block`, { reason });
            loadAccounts();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed.');
        }
    };

    const handleUnblock = async (id) => {
        if (!window.confirm('Restore this account to active status?')) return;
        try {
            await api.post(`/accounts/${id}/unblock`);
            loadAccounts();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed.');
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

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        {showingAll ? 'All Bank Accounts Directory' : 'My Bank Accounts'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {showingAll
                            ? 'Administrative overview and status control for all simulated accounts in the banking system.'
                            : 'Manage your checking accounts, high-yield savings, and fixed-term deposit accounts.'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { setErrorMsg(''); setSuccessMsg(''); setOpenModal(true); }}
                >
                    Open New Account
                </Button>
            </Box>

            {/* Role Tabs for Staff (Admin & Instructor) */}
            {isStaff && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={viewTab} onChange={(e, val) => { setViewTab(val); setPage(1); }}>
                        <Tab label="All System Accounts (Directory)" />
                        <Tab label="My Personal Accounts" />
                    </Tabs>
                </Box>
            )}

            {/* Filters Bar */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        size="small"
                        label="Search Account No. or Name"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        sx={{ minWidth: 260 }}
                        placeholder="Type to filter..."
                    />
                    <TextField
                        select
                        size="small"
                        label="Account Type"
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        sx={{ minWidth: 160 }}
                    >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="checking">Checking</MenuItem>
                        <MenuItem value="savings">Savings</MenuItem>
                        <MenuItem value="fixed_deposit">Fixed Deposit</MenuItem>
                    </TextField>
                    <TextField
                        select
                        size="small"
                        label="Account Status"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="blocked">Blocked</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                    </TextField>
                </Stack>
            </Card>

            {/* Table */}
            <Card sx={{ borderRadius: 3, position: 'relative' }}>
                {loading && (
                    <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} />
                )}
                <TableContainer component={Paper} elevation={0}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Account Number</TableCell>
                                <TableCell>Account Title</TableCell>
                                {showingAll && <TableCell>Owner</TableCell>}
                                <TableCell>Type</TableCell>
                                <TableCell align="right">Available Balance</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Maturity / Terms</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={showingAll ? 8 : 7} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={showingAll ? 8 : 7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No bank accounts found matching criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((acc) => {
                                    const code = getTypeCode(acc.account_type);
                                    return (
                                        <TableRow key={acc.id} hover sx={{ opacity: loading ? 0.7 : 1 }}>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                                {acc.account_number}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>
                                                {acc.account_name}
                                            </TableCell>
                                            {showingAll && (
                                                <TableCell>
                                                    {acc.user?.name || 'N/A'}
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={formatType(acc.account_type)}
                                                    color={code === 'checking' ? 'primary' : code === 'savings' ? 'secondary' : 'default'}
                                                    sx={{ fontWeight: 600, fontSize: '0.68rem' }}
                                                />
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.95rem' }}>
                                                ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={acc.status} />
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                                {acc.maturity_date ? `Matures: ${new Date(acc.maturity_date).toLocaleDateString()}` : 'Standard'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton size="small" onClick={() => navigate(`/accounts/${acc.id}`)} title="View Account Details">
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                                {showingAll && (
                                                    acc.status === 'blocked' ? (
                                                        <IconButton size="small" color="success" onClick={() => handleUnblock(acc.id)} title="Unblock Account">
                                                            <CheckCircleIcon fontSize="small" />
                                                        </IconButton>
                                                    ) : (
                                                        <IconButton size="small" color="error" onClick={() => handleBlock(acc.id)} title="Block Account">
                                                            <BlockIcon fontSize="small" />
                                                        </IconButton>
                                                    )
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
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

            {/* Create Account Modal */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>Open a New Simulated Bank Account</DialogTitle>
                <DialogContent dividers>
                    {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
                    {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
                    <TextField
                        select
                        fullWidth
                        label="Account Type"
                        value={newTypeId}
                        onChange={(e) => setNewTypeId(e.target.value)}
                        margin="normal"
                    >
                        {accountTypes.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                                {t.name} (Min: ${t.minimum_balance} | Rate: {t.interest_rate}% | Term: {t.lock_period_days} days)
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        label="Account Nickname / Name"
                        value={newAccName}
                        onChange={(e) => setNewAccName(e.target.value)}
                        margin="normal"
                        placeholder="e.g. My Savings Wallet"
                    />
                    <TextField
                        fullWidth
                        label="Initial Opening Balance ($)"
                        type="number"
                        value={deposit}
                        onChange={(e) => setDeposit(e.target.value)}
                        margin="normal"
                        placeholder="0.00"
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenModal(false)}>Cancel</Button>
                    <Button onClick={handleCreateAccount} variant="contained" disabled={submitting}>
                        {submitting ? <CircularProgress size={20} /> : 'Confirm & Open'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
