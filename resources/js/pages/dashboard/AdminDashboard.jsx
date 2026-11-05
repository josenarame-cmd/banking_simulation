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

// Recharts components
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SecurityIcon from '@mui/icons-material/Security';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/client';

const COLORS = ['#0f4c81', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const res = await api.get('/dashboard/admin');
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

    const handleApprove = async (approvalId) => {
        try {
            await api.post(`/approvals/${approvalId}/approve`, { notes: 'Approved via Admin Quick Actions' });
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Approval failed');
        }
    };

    const handleReject = async (approvalId) => {
        const reason = prompt('Please enter reason for rejection:');
        if (!reason) return;
        try {
            await api.post(`/approvals/${approvalId}/reject`, { reason });
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        }
    };

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
                        Executive Administrator Command Center
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Real-time core banking simulation statistics, ledger analytics, and risk controls.
                    </Typography>
                </Box>
                <Box display="flex" gap={1.5}>
                    <Button variant="outlined" onClick={() => navigate('/reconciliation')}>
                        Verify Ledger Integrity
                    </Button>
                    <Button variant="contained" onClick={() => navigate('/reports')}>
                        Export Financial CSVs
                    </Button>
                </Box>
            </Box>

            {/* Top Stat Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total System Balances"
                        value={`$${Number(m.total_balances || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        icon={<AccountBalanceIcon />}
                        color="primary"
                        subtitle={`${m.total_accounts} accounts registered`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Interbank Volume"
                        value={`$${Number(m.total_transfers || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        icon={<SwapHorizIcon />}
                        color="secondary"
                        subtitle="Completed transfers"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Pending Approvals"
                        value={m.pending_approvals || 0}
                        icon={<HowToVoteIcon />}
                        color="warning"
                        subtitle="High-value txs > $10,000"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Fraud / Security Alerts"
                        value={m.suspicious_activity_count || 0}
                        icon={<SecurityIcon />}
                        color="error"
                        subtitle="Flags under investigation"
                    />
                </Grid>
            </Grid>

            {/* Financial Performance KPI Subgrid */}
            <Grid container spacing={2} mb={4}>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Total Deposits</Typography>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                            ${Number(m.total_deposits || 0).toLocaleString()}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Total Withdrawals</Typography>
                        <Typography variant="h6" fontWeight={700} color="error.main">
                            ${Number(m.total_withdrawals || 0).toLocaleString()}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Interest Credited</Typography>
                        <Typography variant="h6" fontWeight={700} color="info.main">
                            ${Number(m.total_interest_credited || 0).toLocaleString()}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Fees Collected</Typography>
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                            ${Number(m.total_fees_collected || 0).toLocaleString()}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Active Loans</Typography>
                        <Typography variant="h6" fontWeight={700}>
                            {m.active_loans} loans
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Outstanding Loans</Typography>
                        <Typography variant="h6" fontWeight={700} color="warning.main">
                            ${Number(m.outstanding_loan_balance || 0).toLocaleString()}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Recharts Visualizations */}
            <Grid container spacing={3} mb={4}>
                {/* 14-Day Inflow vs Outflow */}
                <Grid item xs={12} lg={8}>
                    <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Daily Cash Inflows vs Outflows (Past 14 Days)
                        </Typography>
                        <Box sx={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.charts?.daily_cashflow || []}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="inflow" name="Inflow (Deposits)" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="outflow" name="Outflow (Withdrawals)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </Grid>

                {/* Account Balances by Type */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Balances by Account Type
                        </Typography>
                        <Box sx={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.charts?.balances_by_type || []}
                                        dataKey="total_balance"
                                        nameKey="account_type"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={95}
                                        label={({ account_type, percent }) => `${account_type} (${(percent * 100).toFixed(0)}%)`}
                                    >
                                        {(data?.charts?.balances_by_type || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* Pending Approvals & Top Transactors */}
            <Grid container spacing={3}>
                {/* Pending High-Value Approvals */}
                <Grid item xs={12} lg={7}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" fontWeight={700}>
                                High-Value Approvals Required (&gt; $10,000)
                            </Typography>
                            <Button size="small" onClick={() => navigate('/approvals')}>
                                View All ({m.pending_approvals})
                            </Button>
                        </Box>

                        {data?.recent_approvals?.length === 0 ? (
                            <Box py={4} textAlign="center" color="text.secondary">
                                <CheckCircleIcon color="success" sx={{ fontSize: 44, mb: 1 }} />
                                <Typography variant="body2">No pending transaction approvals.</Typography>
                            </Box>
                        ) : (
                            <TableContainer component={Paper} elevation={0}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Reference</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Sender</TableCell>
                                            <TableCell>Recipient</TableCell>
                                            <TableCell align="right">Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data?.recent_approvals?.map((app) => (
                                            <TableRow key={app.id}>
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                    {app.transaction?.reference}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>
                                                    ${Number(app.transaction?.amount).toLocaleString()}
                                                </TableCell>
                                                <TableCell>{app.transaction?.from_account?.account_number}</TableCell>
                                                <TableCell>{app.transaction?.to_account?.account_number}</TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        sx={{ mr: 1, py: 0.2, px: 1, fontSize: '0.72rem' }}
                                                        onClick={() => handleApprove(app.id)}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        sx={{ py: 0.2, px: 1, fontSize: '0.72rem' }}
                                                        onClick={() => handleReject(app.id)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Card>
                </Grid>

                {/* Top Transacting Users Leaderboard */}
                <Grid item xs={12} lg={5}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Top Transacting Accounts
                        </Typography>
                        <TableContainer component={Paper} elevation={0}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>User</TableCell>
                                        <TableCell align="center">Tx Count</TableCell>
                                        <TableCell align="right">Total Volume</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.charts?.top_transactors?.map((u, i) => (
                                        <TableRow key={i}>
                                            <TableCell fontWeight={600}>{u.name}</TableCell>
                                            <TableCell align="center">
                                                <Chip label={u.tx_count} size="small" />
                                            </TableCell>
                                            <TableCell align="right" fontWeight={700}>
                                                ${Number(u.total_volume).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

