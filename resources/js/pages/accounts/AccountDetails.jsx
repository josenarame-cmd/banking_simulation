import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/client';

export default function AccountDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);
    const [ledgerEntries, setLedgerEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadDetails = async () => {
        try {
            const res = await api.get(`/accounts/${id}`);
            setAccount(res.data.account);
            setLedgerEntries(res.data.recent_ledger_entries || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load account details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetails();
    }, [id]);

    const handleCloseAccount = async () => {
        if (!window.confirm('Are you sure you want to officially close this bank account?')) return;
        try {
            await api.post(`/accounts/${id}/close`);
            alert('Account closed successfully.');
            navigate('/accounts');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to close account.');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button sx={{ mt: 2 }} startIcon={<ArrowBackIcon />} onClick={() => navigate('/accounts')}>
                    Back to Accounts
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/accounts')} sx={{ mb: 3 }}>
                Back to Accounts
            </Button>

            <Grid container spacing={3} mb={4}>
                {/* Account Summary Card */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="overline" color="text.secondary" letterSpacing={1}>
                                {(typeof account?.account_type === 'object' ? (account.account_type?.code || account.account_type?.name) : account?.account_type || '').toUpperCase()} ACCOUNT
                            </Typography>
                            <StatusBadge status={account?.status} />
                        </Box>
                        <Typography variant="h5" fontWeight={800}>
                            {account?.account_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontFamily="monospace" mb={2}>
                            {account?.account_number}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">Current Settled Balance</Typography>
                        <Typography variant="h3" fontWeight={800} color="primary" sx={{ my: 1 }}>
                            ${Number(account?.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={1.5}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Account Owner</Typography>
                                <Typography variant="body2" fontWeight={600}>{account?.user?.name}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Currency</Typography>
                                <Typography variant="body2" fontWeight={600}>{account?.currency}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Date Opened</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {new Date(account?.opened_at).toLocaleDateString()}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Maturity Date</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    {account?.maturity_date ? new Date(account.maturity_date).toLocaleDateString() : 'N/A (Liquid)'}
                                </Typography>
                            </Grid>
                        </Grid>

                        {account?.status === 'active' && Number(account?.balance) === 0 && (
                            <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                sx={{ mt: 3 }}
                                onClick={handleCloseAccount}
                            >
                                Close Eligible Account
                            </Button>
                        )}
                    </Card>
                </Grid>

                {/* Ledger Audit Trail for this Account */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Account Statement & Ledger Postings
                        </Typography>
                        <TableContainer component={Paper} elevation={0}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Tx Reference</TableCell>
                                        <TableCell>Entry Type</TableCell>
                                        <TableCell align="right">Debit (-)</TableCell>
                                        <TableCell align="right">Credit (+)</TableCell>
                                        <TableCell align="right">Balance After</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ledgerEntries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                No ledger postings recorded for this account.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        ledgerEntries.map((le) => (
                                            <TableRow key={le.id}>
                                                <TableCell sx={{ fontSize: '0.8rem' }}>
                                                    {new Date(le.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                    {le.transaction?.reference || 'SYSTEM'}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={le.entry_type} />
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'error.main', fontWeight: le.debit > 0 ? 700 : 400 }}>
                                                    {le.debit > 0 ? `-$${Number(le.debit).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: le.credit > 0 ? 700 : 400 }}>
                                                    {le.credit > 0 ? `+$${Number(le.credit).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                                    ${Number(le.balance_after).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}

