import React, { useState, useEffect } from 'react';
import {
    Container,
    Card,
    Typography,
    Box,
    Grid,
    Button,
    Paper,
    CircularProgress,
    TextField,
    Divider,
    Stack
} from '@mui/material';

import AssessmentIcon from '@mui/icons-material/Assessment';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import api, { downloadCsv } from '../../api/client';

export default function ReportsPage() {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [cashflow, setCashflow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportingType, setExportingType] = useState(null);

    const handleExport = async (type, filename) => {
        setExportingType(type);
        try {
            await downloadCsv(`/reports/export/${type}`, filename);
        } catch (err) {
            alert('Failed to export CSV: ' + (err.response?.data?.message || err.message));
        } finally {
            setExportingType(null);
        }
    };

    const loadCashflow = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reports/cashflow', {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                }
            });
            setCashflow(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCashflow();
    }, []);

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box mb={4}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    Financial Statements & Data Exports
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Review cashflow analysis statements and export banking records directly into CSV.
                </Typography>
            </Box>

            {/* Quick Export Cards */}
            <Typography variant="h6" fontWeight={700} mb={2}>
                One-Click CSV Data Exports
            </Typography>
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                            Transactions Master Record
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Includes reference codes, party accounts, amounts, fees, execution statuses, and timestamps.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            startIcon={exportingType === 'transactions' ? <CircularProgress size={18} color="inherit" /> : <FileDownloadIcon />}
                            onClick={() => handleExport('transactions', `transactions-${new Date().toISOString().slice(0, 10)}.csv`)}
                            disabled={exportingType !== null}
                        >
                            Export Transactions CSV
                        </Button>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                            Bank Accounts Portfolio
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Complete snapshot of account holders, current balances, currency, and maturity dates.
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            fullWidth
                            startIcon={exportingType === 'accounts' ? <CircularProgress size={18} color="inherit" /> : <FileDownloadIcon />}
                            onClick={() => handleExport('accounts', `bank-accounts-${new Date().toISOString().slice(0, 10)}.csv`)}
                            disabled={exportingType !== null}
                        >
                            Export Accounts CSV
                        </Button>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                            Double-Entry General Ledger
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Complete immutable double-entry ledger entries containing all debits, credits, and running balances.
                        </Typography>
                        <Button
                            variant="outlined"
                            fullWidth
                            startIcon={exportingType === 'ledger' ? <CircularProgress size={18} color="inherit" /> : <FileDownloadIcon />}
                            onClick={() => handleExport('ledger', `general-ledger-${new Date().toISOString().slice(0, 10)}.csv`)}
                            disabled={exportingType !== null}
                        >
                            Export General Ledger CSV
                        </Button>
                    </Card>
                </Grid>
            </Grid>

            {/* Cashflow Statement */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Institutional Cashflow Statement
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Period: {cashflow?.period?.from} to {cashflow?.period?.to}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <TextField
                            size="small"
                            label="From"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            size="small"
                            label="To"
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <Button variant="outlined" onClick={loadCashflow}>
                            Filter
                        </Button>
                    </Stack>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                                <Box display="flex" alignItems="center" gap={1} color="success.main" mb={1}>
                                    <TrendingUpIcon />
                                    <Typography variant="subtitle1" fontWeight={700}>Total Cash Inflow</Typography>
                                </Box>
                                <Typography variant="h4" fontWeight={800} color="success.main" my={1}>
                                    ${Number(cashflow?.inflow?.total_inflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Typography>
                                <Divider sx={{ my: 1.5 }} />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Deposits:</Typography>
                                    <Typography variant="body2" fontWeight={600}>${Number(cashflow?.inflow?.deposits || 0).toLocaleString()}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Fees Collected:</Typography>
                                    <Typography variant="body2" fontWeight={600}>${Number(cashflow?.inflow?.fees_collected || 0).toLocaleString()}</Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                                <Box display="flex" alignItems="center" gap={1} color="error.main" mb={1}>
                                    <TrendingDownIcon />
                                    <Typography variant="subtitle1" fontWeight={700}>Total Cash Outflow</Typography>
                                </Box>
                                <Typography variant="h4" fontWeight={800} color="error.main" my={1}>
                                    ${Number(cashflow?.outflow?.total_outflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Typography>
                                <Divider sx={{ my: 1.5 }} />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Withdrawals:</Typography>
                                    <Typography variant="body2" fontWeight={600}>${Number(cashflow?.outflow?.withdrawals || 0).toLocaleString()}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Interest Paid:</Typography>
                                    <Typography variant="body2" fontWeight={600}>${Number(cashflow?.outflow?.interest_paid || 0).toLocaleString()}</Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                                <Box display="flex" alignItems="center" gap={1} color="primary.main" mb={1}>
                                    <AccountBalanceWalletIcon />
                                    <Typography variant="subtitle1" fontWeight={700}>Net Operational Cashflow</Typography>
                                </Box>
                                <Typography variant="h4" fontWeight={800} color="primary.main" my={1}>
                                    ${Number(cashflow?.net_cashflow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Typography>
                                <Divider sx={{ my: 1.5 }} />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Interbank Transfers:</Typography>
                                    <Typography variant="body2" fontWeight={600}>${Number(cashflow?.interbank_volume || 0).toLocaleString()}</Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Card>
        </Container>
    );
}

