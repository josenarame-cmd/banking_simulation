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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem
} from '@mui/material';

import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function FeesManagementPage() {
    const { isAdmin } = useAuth();

    const [types, setTypes] = useState([]);
    const [history, setHistory] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Apply Fee Modal
    const [applyOpen, setApplyOpen] = useState(false);
    const [targetAccountId, setTargetAccountId] = useState('');
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [feeDesc, setFeeDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [typesRes, historyRes, accRes] = await Promise.all([
                api.get('/fee-types'),
                api.get('/fees/history'),
                api.get('/accounts'),
            ]);
            setTypes(typesRes.data.data || []);
            setHistory(historyRes.data.data || []);
            setAccounts(accRes.data.data || []);
            if (accRes.data.data?.length > 0) setTargetAccountId(accRes.data.data[0].id);
            if (typesRes.data.data?.length > 0) setSelectedTypeId(typesRes.data.data[0].id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApplyFee = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setMessage('');
        setSubmitting(true);

        try {
            const res = await api.post('/fees/apply', {
                account_id: targetAccountId,
                fee_type_id: selectedTypeId,
                description: feeDesc,
            });
            setMessage(res.data.message);
            await loadData();
            setTimeout(() => setApplyOpen(false), 1000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to apply fee.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRunMaintenance = async () => {
        if (!window.confirm('Run monthly account maintenance fee deduction across all eligible checking accounts?')) {
            return;
        }

        try {
            const res = await api.post('/fees/process-maintenance');
            alert(res.data.message);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to execute maintenance run.');
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Banking Fee Policies & Deductions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage fee schedules, maintenance assessments, and ledger revenue postings.
                    </Typography>
                </Box>
                <Box display="flex" gap={1.5}>
                    {isAdmin && (
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<PlayArrowIcon />}
                            onClick={handleRunMaintenance}
                        >
                            Run Monthly Maintenance Batch
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => { setErrorMsg(''); setMessage(''); setApplyOpen(true); }}
                    >
                        Apply Fee to Account
                    </Button>
                </Box>
            </Box>

            {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
            {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

            {/* Fee Types Cards */}
            <Typography variant="h6" fontWeight={700} mb={2}>
                Configured Fee Schedules
            </Typography>
            <Grid container spacing={3} mb={4}>
                {types.map((type) => (
                    <Grid item xs={12} sm={6} md={4} key={type.id}>
                        <Card sx={{ p: 3, borderRadius: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="subtitle1" fontWeight={700}>{type.name}</Typography>
                                <StatusBadge status={type.status} />
                            </Box>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                Code: {type.code}
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="primary" sx={{ my: 1.5 }}>
                                ${Number(type.amount).toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Method: <strong>{type.calculation_method}</strong> | Applies to: <strong>{type.applicable_account_type}</strong>
                            </Typography>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Applied Fee History Table */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                    Recent Fee Deductions Audit Trail
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Fee ID</TableCell>
                                <TableCell>Account Number</TableCell>
                                <TableCell>Owner</TableCell>
                                <TableCell>Fee Type</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell>Tx Reference</TableCell>
                                <TableCell>Deducted At</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No fee deductions on record.
                                    </TableCell>
                                </TableRow>
                            ) : history.map((f) => (
                                <TableRow key={f.id}>
                                    <TableCell sx={{ fontWeight: 600 }}>#{f.id}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{f.account?.account_number}</TableCell>
                                    <TableCell>{f.account?.user?.name || '—'}</TableCell>
                                    <TableCell>{f.fee_type}</TableCell>
                                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 800 }}>
                                        -${Number(f.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{f.transaction?.reference || '—'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.82rem' }}>{new Date(f.applied_at).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Apply Fee Dialog */}
            <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>Apply Fee to Account</DialogTitle>
                <form onSubmit={handleApplyFee}>
                    <DialogContent dividers>
                        <TextField
                            select
                            fullWidth
                            label="Target Account"
                            value={targetAccountId}
                            onChange={(e) => setTargetAccountId(e.target.value)}
                            margin="normal"
                            required
                        >
                            {accounts.map((a) => (
                                <MenuItem key={a.id} value={a.id}>
                                    {a.account_number} ({a.user?.name}) — ${a.balance}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            label="Fee Type"
                            value={selectedTypeId}
                            onChange={(e) => setSelectedTypeId(e.target.value)}
                            margin="normal"
                            required
                        >
                            {types.map((t) => (
                                <MenuItem key={t.id} value={t.id}>
                                    {t.name} (${t.amount})
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            fullWidth
                            label="Description (optional)"
                            value={feeDesc}
                            onChange={(e) => setFeeDesc(e.target.value)}
                            margin="normal"
                            placeholder="e.g. Administrative charge"
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setApplyOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="warning" disabled={submitting}>
                            {submitting ? <CircularProgress size={20} /> : 'Deduct Fee'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
}

