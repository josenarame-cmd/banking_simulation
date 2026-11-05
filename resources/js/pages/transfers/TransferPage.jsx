import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Card,
    CardContent,
    Typography,
    Box,
    TextField,
    Button,
    Grid,
    MenuItem,
    Alert,
    CircularProgress,
    Paper,
    Divider,
    Stack,
    FormControlLabel,
    Switch
} from '@mui/material';

import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import ReceiptModal from '../../components/ReceiptModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function TransferPage() {
    const { user, isAdmin, isInstructor, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState([]);
    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountNumber, setToAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loadingAccounts, setLoadingAccounts] = useState(true);

    // Staff toggle: allow admin/instructor to transfer from any account or their own
    const [staffAllAccounts, setStaffAllAccounts] = useState(false);

    // Recipient lookup states
    const [recipient, setRecipient] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState('');

    // Transfer submission states
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferError, setTransferError] = useState('');
    const [transferSuccess, setTransferSuccess] = useState('');
    const [completedTx, setCompletedTx] = useState(null);

    const isStaff = isAdmin || isInstructor;

    const loadAccounts = async () => {
        setLoadingAccounts(true);
        try {
            if (isStaff && staffAllAccounts) {
                const res = await api.get('/accounts', { params: { per_page: 50, status: 'active' } });
                const list = res.data.data || [];
                setAccounts(list);
                if (list.length > 0 && (!fromAccountId || !list.some(a => a.id === fromAccountId))) {
                    setFromAccountId(list[0].id);
                }
            } else {
                const res = await api.get('/my-accounts');
                let list = res.data.accounts || [];
                // If staff member has no personal accounts, fallback to all active accounts automatically
                if (isStaff && list.length === 0) {
                    const allRes = await api.get('/accounts', { params: { per_page: 50, status: 'active' } });
                    list = allRes.data.data || [];
                }
                setAccounts(list);
                if (list.length > 0 && (!fromAccountId || !list.some(a => a.id === fromAccountId))) {
                    setFromAccountId(list[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to load transfer source accounts:', err);
        } finally {
            setLoadingAccounts(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        loadAccounts();
    }, [user, staffAllAccounts]);

    const handleLookup = async () => {
        setLookupError('');
        setRecipient(null);
        if (!toAccountNumber.trim()) {
            setLookupError('Please enter a destination account number.');
            return;
        }

        setLookupLoading(true);
        try {
            const res = await api.post('/transfers/lookup', {
                account_number: toAccountNumber.trim(),
            });
            setRecipient(res.data.account);
        } catch (err) {
            setLookupError(err.response?.data?.message || 'Account not found or inactive.');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        setTransferError('');
        setTransferSuccess('');

        if (!recipient) {
            setTransferError('Please verify the destination account number before proceeding.');
            return;
        }

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            setTransferError('Please enter a valid transfer amount.');
            return;
        }

        const selectedFrom = accounts.find(a => a.id === fromAccountId);
        if (selectedFrom && selectedFrom.account_number === recipient.account_number) {
            setTransferError('Source and destination accounts cannot be the same.');
            return;
        }

        setTransferLoading(true);
        try {
            const res = await api.post('/transfers', {
                from_account_id: fromAccountId,
                to_account_number: recipient.account_number,
                amount: amt,
                description: description || 'Peer-to-Peer Funds Transfer',
            });

            setTransferSuccess(res.data.message);
            setCompletedTx(res.data.transaction);
            setAmount('');
            setDescription('');
            setToAccountNumber('');
            setRecipient(null);
            await loadAccounts();
        } catch (err) {
            setTransferError(err.response?.data?.message || 'Transfer failed to process.');
        } finally {
            setTransferLoading(false);
        }
    };

    const selectedAccount = accounts.find(a => a.id === fromAccountId);
    const isHighValue = parseFloat(amount) > 10000;

    return (
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Transfer Funds (Internal & Peer)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Send money securely between your accounts or to other users. Protected by double-entry ledger settlement.
                    </Typography>
                </Box>
                {isStaff && (
                    <FormControlLabel
                        control={
                            <Switch
                                checked={staffAllAccounts}
                                onChange={(e) => setStaffAllAccounts(e.target.checked)}
                                color="primary"
                            />
                        }
                        label={<Typography variant="caption" fontWeight={600}>Staff: Show All System Accounts</Typography>}
                    />
                )}
            </Box>

            {transferSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {transferSuccess}
                </Alert>
            )}
            {transferError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {transferError}
                </Alert>
            )}

            {!loadingAccounts && accounts.length === 0 && (
                <Alert
                    severity="warning"
                    icon={<AccountBalanceWalletIcon />}
                    sx={{ mb: 3 }}
                    action={
                        <Button color="inherit" size="small" onClick={() => navigate('/accounts')}>
                            Open Account
                        </Button>
                    }
                >
                    You do not have any active bank accounts to transfer money from. Please open a bank account first.
                </Alert>
            )}

            <Card sx={{ borderRadius: 3, p: { xs: 2, md: 4 } }}>
                <form onSubmit={handleTransferSubmit}>
                    <Grid container spacing={3}>
                        {/* Source Account */}
                        <Grid item xs={12}>
                            <TextField
                                select
                                fullWidth
                                label="From (Source Account)"
                                value={fromAccountId}
                                onChange={(e) => setFromAccountId(e.target.value)}
                                helperText={
                                    loadingAccounts
                                        ? 'Loading available accounts...'
                                        : selectedAccount
                                            ? `Available Balance: $${Number(selectedAccount.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} | Type: ${(typeof selectedAccount.account_type === 'object' ? (selectedAccount.account_type?.name || selectedAccount.account_type?.code) : selectedAccount.account_type || '').toUpperCase()}`
                                            : accounts.length === 0
                                                ? 'No bank accounts available.'
                                                : 'Select the originating account for this transaction.'
                                }
                                required
                                disabled={loadingAccounts || accounts.length === 0}
                            >
                                {accounts.map((acc) => (
                                    <MenuItem key={acc.id} value={acc.id}>
                                        {acc.account_name} — {acc.account_number} (${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                                        {acc.user && isStaff && acc.user.id !== user?.id ? ` [Owner: ${acc.user.name}]` : ''}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Recipient Account Lookup */}
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="To (Destination Account Number)"
                                value={toAccountNumber}
                                onChange={(e) => { setToAccountNumber(e.target.value); setRecipient(null); }}
                                placeholder="e.g. CHK-10000001, SAV-20000001"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<SearchIcon />}
                                sx={{ height: 54 }}
                                onClick={handleLookup}
                                disabled={lookupLoading}
                            >
                                {lookupLoading ? <CircularProgress size={20} /> : 'Verify Account'}
                            </Button>
                        </Grid>

                        {/* Lookup Feedback Card */}
                        {lookupError && (
                            <Grid item xs={12}>
                                <Alert severity="warning">{lookupError}</Alert>
                            </Grid>
                        )}
                        {recipient && (
                            <Grid item xs={12}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        bgcolor: (theme) => theme.palette.mode === 'light' ? '#ecfdf5' : '#064e3b20',
                                        borderColor: 'success.main',
                                        borderRadius: 2,
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1} color="success.main" mb={1}>
                                        <VerifiedUserIcon fontSize="small" />
                                        <Typography variant="subtitle2" fontWeight={700}>
                                            Verified Recipient Account
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2">
                                        <strong>Account Owner:</strong> {recipient.owner_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Account: {recipient.account_number} ({typeof recipient.account_type === 'object' ? (recipient.account_type?.name || recipient.account_type?.code) : recipient.account_type}) | Currency: {recipient.currency}
                                    </Typography>
                                </Paper>
                            </Grid>
                        )}

                        {/* Amount */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Transfer Amount ($)"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                inputProps={{ min: "0.01", step: "0.01" }}
                                required
                            />
                        </Grid>

                        {/* Description */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Payment Description / Purpose"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Consulting fees, Project milestone"
                                required
                            />
                        </Grid>

                        {/* High-Value Notice */}
                        {isHighValue && (
                            <Grid item xs={12}>
                                <Alert severity="info" icon={<InfoOutlinedIcon />}>
                                    <strong>High-Value Transaction Notice:</strong> Transfers exceeding <strong>$10,000.00</strong> require authorization under the banking simulation two-step approval workflow. Funds will be queued for administrator or instructor review.
                                </Alert>
                            </Grid>
                        )}

                        {/* Submit Button */}
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<SwapHorizIcon />}
                                disabled={transferLoading || !recipient || accounts.length === 0}
                                sx={{ py: 1.5, fontWeight: 700 }}
                            >
                                {transferLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm & Execute Transfer'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Card>

            {/* Receipt Modal */}
            <ReceiptModal
                open={Boolean(completedTx)}
                onClose={() => setCompletedTx(null)}
                transaction={completedTx}
            />
        </Container>
    );
}
