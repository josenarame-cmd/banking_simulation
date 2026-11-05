import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert
} from '@mui/material';

import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/client';

export default function InstructorDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const res = await api.get('/dashboard/instructor');
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    const m = data?.metrics || {};

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        FinTech Training Laboratory Monitoring
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Module ITLAW701 – Advanced Web Technologies | RP Karongi College FinTech Simulation
                    </Typography>
                </Box>
                <Box display="flex" gap={1.5}>
                    <Button variant="outlined" onClick={() => navigate('/reconciliation')}>
                        Reconciliation Console
                    </Button>
                    <Button variant="contained" onClick={() => navigate('/approvals')}>
                        Review Approvals
                    </Button>
                </Box>
            </Box>

            {/* Double-Entry Ledger Health Alert */}
            <Alert
                severity={m.is_ledger_balanced ? 'success' : 'error'}
                icon={m.is_ledger_balanced ? <CheckCircleOutlineIcon fontSize="inherit" /> : <WarningAmberIcon fontSize="inherit" />}
                sx={{ mb: 4, borderRadius: 2 }}
            >
                <strong>Double-Entry Accounting Status:</strong>{' '}
                {m.is_ledger_balanced
                    ? `BALANCED — Total Debits ($${Number(m.total_ledger_debits).toLocaleString()}) equal Total Credits ($${Number(m.total_ledger_credits).toLocaleString()}). All accounting constraints satisfied.`
                    : 'DISCREPANCY DETECTED — Debits and credits are unbalanced. Immediate ledger reconciliation investigation required.'}
            </Alert>

            {/* Metrics */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Registered Learners"
                        value={m.learners_count || 0}
                        icon={<SchoolIcon />}
                        color="secondary"
                        subtitle="Students active in simulation"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Simulated Bank Accounts"
                        value={m.simulated_accounts || 0}
                        icon={<AccountBalanceIcon />}
                        color="primary"
                        subtitle="Checking, Savings & Term Deposits"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Loan Applications"
                        value={m.loan_applications_count || 0}
                        icon={<FactCheckIcon />}
                        color="info"
                        subtitle="Submitted student loans"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Failed Transactions"
                        value={m.failed_transactions_count || 0}
                        icon={<WarningAmberIcon />}
                        color="error"
                        subtitle="Validation/Insufficient funds"
                    />
                </Grid>
            </Grid>

            {/* Enrolled Learners & Recent Financial Transactions */}
            <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Recent Learners & Accounts
                        </Typography>
                        <TableContainer component={Paper} elevation={0}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Learner</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell align="center">Accounts</TableCell>
                                        <TableCell align="right">Total Held</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.recent_learners?.map((learner) => {
                                        const total = learner.accounts?.reduce((sum, a) => sum + parseFloat(a.balance), 0) || 0;
                                        return (
                                            <TableRow key={learner.id}>
                                                <TableCell fontWeight={600}>{learner.name}</TableCell>
                                                <TableCell>{learner.email}</TableCell>
                                                <TableCell align="center">
                                                    <Chip label={learner.accounts?.length || 0} size="small" />
                                                </TableCell>
                                                <TableCell align="right" fontWeight={700}>
                                                    ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Recent Student Transactions
                        </Typography>
                        <TableContainer component={Paper} elevation={0}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Reference</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Initiated By</TableCell>
                                        <TableCell align="right">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.recent_transactions?.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>{tx.reference}</TableCell>
                                            <TableCell sx={{ textTransform: 'capitalize' }}>
                                                {tx.transaction_type?.replace(/_/g, ' ')}
                                            </TableCell>
                                            <TableCell fontWeight={700}>
                                                ${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>{tx.initiator?.name || 'System'}</TableCell>
                                            <TableCell align="right">
                                                <StatusBadge status={tx.status} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}

