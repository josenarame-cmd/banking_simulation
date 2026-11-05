import React, { useState, useEffect } from 'react';
import {
    Container,
    Card,
    Typography,
    Box,
    Button,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    Stack
} from '@mui/material';

import PercentIcon from '@mui/icons-material/Percent';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function InterestManagementPage() {
    const { isAdmin } = useAuth();

    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // e.g. '2026-11'
    const [rates, setRates] = useState([]);
    const [preview, setPreview] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [ratesRes, previewRes, historyRes] = await Promise.all([
                api.get('/interest-rates'),
                api.get('/interest/preview', { params: { period } }),
                api.get('/interest-calculations'),
            ]);
            setRates(ratesRes.data.data || []);
            setPreview(previewRes.data.preview);
            setHistory(historyRes.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [period]);

    const handleProcessBatch = async () => {
        if (!window.confirm(`Credit interest of $${preview?.total_interest_to_credit} to ${preview?.total_accounts} eligible accounts for period ${period}?`)) {
            return;
        }

        setErrorMsg('');
        setMessage('');
        setProcessing(true);

        try {
            const res = await api.post('/interest/process', { period });
            setMessage(res.data.message);
            await loadData();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to process interest batch.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Interest Rate & Accrual Engine
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Configure tier rates, preview monthly compounding, and execute automated interest credit batches.
                    </Typography>
                </Box>
                <TextField
                    size="small"
                    type="month"
                    label="Calculation Period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
            </Box>

            {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
            {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

            {/* Rates Overview Cards */}
            <Grid container spacing={3} mb={4}>
                {rates.map((r) => (
                    <Grid item xs={12} sm={6} md={3} key={r.id}>
                        <Card sx={{ p: 2.5, borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                {r.account_type?.name}
                            </Typography>
                            <Typography variant="h3" fontWeight={800} color="primary" sx={{ my: 1 }}>
                                {r.rate}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Effective From: {r.effective_from}
                            </Typography>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Preview Card */}
            <Card sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Calculation Batch Preview for {period}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Total Accrued Interest to Credit: <strong>${preview?.total_interest_to_credit || 0}</strong> across {preview?.total_accounts || 0} savings & term deposit accounts.
                        </Typography>
                    </Box>
                    {isAdmin && (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<PlayArrowIcon />}
                            onClick={handleProcessBatch}
                            disabled={processing || preview?.total_interest_to_credit <= 0}
                        >
                            {processing ? <CircularProgress size={20} color="inherit" /> : 'Execute & Post Ledger Batch'}
                        </Button>
                    )}
                </Box>

                <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Account Number</TableCell>
                                <TableCell>Account Title</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell align="right">Principal Balance</TableCell>
                                <TableCell align="center">Annual Rate</TableCell>
                                <TableCell align="right">Monthly Accrual</TableCell>
                                <TableCell align="center">Batch Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell>
                                </TableRow>
                            ) : preview?.items?.map((item, idx) => (
                                <TableRow key={idx} hover>
                                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.account_number}</TableCell>
                                    <TableCell>{item.account_name}</TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>{item.account_type?.replace(/_/g, ' ')}</TableCell>
                                    <TableCell align="right">${Number(item.balance).toLocaleString()}</TableCell>
                                    <TableCell align="center">{item.interest_rate}%</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: 'success.main' }}>
                                        +${item.calculated_interest}
                                    </TableCell>
                                    <TableCell align="center">
                                        {item.already_processed ? (
                                            <Chip label="Already Credited" size="small" color="default" sx={{ fontSize: '0.65rem' }} />
                                        ) : (
                                            <Chip label="Ready to Post" size="small" color="success" sx={{ fontSize: '0.65rem', fontWeight: 700 }} />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Historical Calculations */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                    Past Processed Interest Batches
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Account</TableCell>
                                <TableCell>Period</TableCell>
                                <TableCell align="right">Principal</TableCell>
                                <TableCell align="center">Rate</TableCell>
                                <TableCell align="right">Amount Credited</TableCell>
                                <TableCell>Tx Reference</TableCell>
                                <TableCell>Processed Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No historical interest calculations on record.
                                    </TableCell>
                                </TableRow>
                            ) : history.map((h) => (
                                <TableRow key={h.id}>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{h.account?.account_number}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{h.calculation_period}</TableCell>
                                    <TableCell align="right">${h.principal_balance}</TableCell>
                                    <TableCell align="center">{h.interest_rate}%</TableCell>
                                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 800 }}>
                                        +${h.interest_amount}
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{h.transaction?.reference || '—'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.82rem' }}>{new Date(h.processed_at).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Container>
    );
}

