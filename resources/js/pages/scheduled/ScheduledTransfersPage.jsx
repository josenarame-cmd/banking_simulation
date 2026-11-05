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
    Chip,
    CircularProgress,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
    IconButton
} from '@mui/material';

import ScheduleIcon from '@mui/icons-material/Schedule';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FlashOnIcon from '@mui/icons-material/FlashOn';

import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function ScheduledTransfersPage() {
    const { user, isAdmin, isInstructor } = useAuth();

    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState([]);

    // Create Modal
    const [createOpen, setCreateOpen] = useState(false);
    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Logs Modal
    const [logsOpen, setLogsOpen] = useState(false);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [logs, setLogs] = useState([]);

    const loadAll = async () => {
        setLoading(true);
        const endpoint = (isAdmin || isInstructor) ? '/scheduled-transfers' : '/my-scheduled-transfers';
        try {
            const [schedRes, accRes] = await Promise.all([
                api.get(endpoint),
                api.get('/my-accounts')
            ]);
            setSchedules(schedRes.data.data || []);
            const list = accRes.data.accounts || [];
            setAccounts(list);
            if (list.length > 0) {
                setFromAccountId(list[0].id);
                if (list.length > 1) setToAccountId(list[1].id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setCreateError('');
        setCreateSuccess('');
        setSubmitting(true);

        try {
            await api.post('/scheduled-transfers', {
                from_account_id: fromAccountId,
                to_account_id: toAccountId,
                amount: parseFloat(amount),
                frequency,
                start_date: startDate,
                end_date: endDate || null,
            });
            setCreateSuccess('Recurring transfer schedule created successfully!');
            await loadAll();
            setTimeout(() => {
                setCreateOpen(false);
                setAmount('');
            }, 1000);
        } catch (err) {
            setCreateError(err.response?.data?.message || 'Failed to create schedule.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (id, newStatus) => {
        try {
            await api.put(`/scheduled-transfers/${id}/status`, { status: newStatus });
            loadAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleTriggerDueNow = async () => {
        try {
            const res = await api.post('/scheduled-transfers/trigger-now');
            alert(`Execution complete! Processed: ${res.data.result.executed}, Failed: ${res.data.result.failed}.`);
            loadAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Execution error');
        }
    };

    const handleViewLogs = async (id) => {
        setSelectedScheduleId(id);
        setLogsOpen(true);
        try {
            const res = await api.get(`/scheduled-transfers/${id}/logs`);
            setLogs(res.data.logs || []);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Scheduled & Recurring Transfers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Configure automated standing orders (daily, weekly, or monthly) with idempotency controls.
                    </Typography>
                </Box>
                <Box display="flex" gap={1.5}>
                    {(isAdmin || isInstructor) && (
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<FlashOnIcon />}
                            onClick={handleTriggerDueNow}
                        >
                            Trigger Due Now (Simulation)
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => { setCreateError(''); setCreateSuccess(''); setCreateOpen(true); }}
                    >
                        Schedule Transfer
                    </Button>
                </Box>
            </Box>

            {/* Schedules Table */}
            <Card sx={{ borderRadius: 3, position: 'relative' }}>
                {loading && (
                    <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} />
                )}
                <TableContainer component={Paper} elevation={0}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Schedule ID</TableCell>
                                {(isAdmin || isInstructor) && <TableCell>User</TableCell>}
                                <TableCell>From Account</TableCell>
                                <TableCell>To Account</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell>Frequency</TableCell>
                                <TableCell>Next Run Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : schedules.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No scheduled recurring transfers active.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                schedules.map((sch) => (
                                    <TableRow key={sch.id} hover>
                                        <TableCell sx={{ fontWeight: 700 }}>#{sch.id}</TableCell>
                                        {(isAdmin || isInstructor) && <TableCell>{sch.user?.name}</TableCell>}
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {sch.from_account?.account_number}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {sch.to_account?.account_number}
                                        </TableCell>
                                        <TableCell align="right" fontWeight={700}>
                                            ${Number(sch.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={sch.frequency?.toUpperCase()}
                                                size="small"
                                                color={sch.frequency === 'daily' ? 'info' : sch.frequency === 'weekly' ? 'secondary' : 'primary'}
                                                sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.85rem' }}>
                                            {new Date(sch.next_run_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={sch.status} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => handleViewLogs(sch.id)} title="View Logs">
                                                <ListAltIcon fontSize="small" />
                                            </IconButton>
                                            {sch.status === 'active' ? (
                                                <IconButton size="small" color="warning" onClick={() => handleToggleStatus(sch.id, 'suspended')} title="Pause">
                                                    <PauseIcon fontSize="small" />
                                                </IconButton>
                                            ) : (
                                                <IconButton size="small" color="success" onClick={() => handleToggleStatus(sch.id, 'active')} title="Resume">
                                                    <PlayArrowIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Create Schedule Modal */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>Create Automated Recurring Transfer</DialogTitle>
                <form onSubmit={handleCreateSubmit}>
                    <DialogContent dividers>
                        {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
                        {createSuccess && <Alert severity="success" sx={{ mb: 2 }}>{createSuccess}</Alert>}

                        <TextField
                            select
                            fullWidth
                            label="Source Account"
                            value={fromAccountId}
                            onChange={(e) => setFromAccountId(e.target.value)}
                            margin="normal"
                            required
                        >
                            {accounts.map((a) => (
                                <MenuItem key={a.id} value={a.id}>
                                    {a.account_name} — {a.account_number} (${a.balance})
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            label="Destination Account"
                            value={toAccountId}
                            onChange={(e) => setToAccountId(e.target.value)}
                            margin="normal"
                            required
                        >
                            {accounts.map((a) => (
                                <MenuItem key={a.id} value={a.id}>
                                    {a.account_name} — {a.account_number}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Transfer Amount ($)"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    margin="normal"
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Frequency"
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                    margin="normal"
                                    required
                                >
                                    <MenuItem value="daily">Daily</MenuItem>
                                    <MenuItem value="weekly">Weekly</MenuItem>
                                    <MenuItem value="monthly">Monthly</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="First Run Date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    margin="normal"
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="End Date (optional)"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    margin="normal"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={submitting}>
                            {submitting ? <CircularProgress size={20} /> : 'Save Recurring Transfer'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Execution Logs Modal */}
            <Dialog open={logsOpen} onClose={() => setLogsOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle fontWeight={700}>
                    Execution History for Schedule #{selectedScheduleId}
                </DialogTitle>
                <DialogContent dividers>
                    {logs.length === 0 ? (
                        <Typography color="text.secondary" textAlign="center" py={3}>
                            No execution attempts recorded for this schedule yet.
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} elevation={0}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Execution Timestamp</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Transaction Reference</TableCell>
                                        <TableCell>Details / Error</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{new Date(log.execution_date).toLocaleString()}</TableCell>
                                            <TableCell><StatusBadge status={log.status} /></TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>
                                                {log.transaction?.reference || '—'}
                                            </TableCell>
                                            <TableCell sx={{ color: log.status === 'failed' ? 'error.main' : 'text.secondary' }}>
                                                {log.error_message || 'Successfully executed and settled.'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setLogsOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

