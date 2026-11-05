import React, { useState, useEffect } from 'react';
import {
    Container,
    Card,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tabs,
    Tab,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert
} from '@mui/material';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SecurityIcon from '@mui/icons-material/Security';

import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function ApprovalsPage() {
    const { user } = useAuth();

    const [tab, setTab] = useState(0);
    const [pendingList, setPendingList] = useState([]);
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Decision Modal
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [actionType, setActionType] = useState('approve'); // 'approve' or 'reject'
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const [pendingRes, historyRes] = await Promise.all([
                api.get('/approvals'),
                api.get('/approvals/history'),
            ]);
            setPendingList(pendingRes.data.data || []);
            setHistoryList(historyRes.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenDecision = (approval, type) => {
        setSelectedApproval(approval);
        setActionType(type);
        setNotes('');
        setErrorMsg('');
        setSuccessMsg('');
    };

    const handleExecuteDecision = async () => {
        setErrorMsg('');
        setSubmitting(true);

        const endpoint = actionType === 'approve'
            ? `/approvals/${selectedApproval.id}/approve`
            : `/approvals/${selectedApproval.id}/reject`;

        const payload = actionType === 'approve'
            ? { notes: notes || 'Approved by authorized officer.' }
            : { reason: notes || 'Rejected under administrative review.' };

        try {
            await api.post(endpoint, payload);
            setSuccessMsg(`Transaction successfully ${actionType}d!`);
            await loadData();
            setTimeout(() => {
                setSelectedApproval(null);
            }, 1000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || `Failed to ${actionType} transaction.`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box mb={4}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    High-Value Transaction Approvals
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Two-step authorization workflow for transactions exceeding $10,000. Separation-of-duties rules enforced.
                </Typography>
            </Box>

            <Card sx={{ borderRadius: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tabs value={tab} onChange={(e, val) => setTab(val)}>
                        <Tab label={`Pending Review (${pendingList.length})`} />
                        <Tab label="Decision History" />
                    </Tabs>
                </Box>

                {/* Tab 0: Pending */}
                {tab === 0 && (
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tx Reference</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Initiator</TableCell>
                                    <TableCell>Source Account</TableCell>
                                    <TableCell>Destination Account</TableCell>
                                    <TableCell>Flag Reason</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                            <CircularProgress size={32} />
                                        </TableCell>
                                    </TableRow>
                                ) : pendingList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 36, mb: 1, display: 'block', mx: 'auto' }} />
                                            No pending high-value transactions awaiting approval.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pendingList.map((app) => {
                                        const tx = app.transaction;
                                        const isOwn = tx?.initiated_by === user?.id;

                                        return (
                                            <TableRow key={app.id} hover>
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                                    {tx?.reference}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1rem' }}>
                                                    ${Number(tx?.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell>
                                                    {tx?.initiator?.name}
                                                    {isOwn && <Chip label="Self-Initiated" size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                    {tx?.from_account?.account_number}
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                    {tx?.to_account?.account_number}
                                                </TableCell>
                                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                                                    {app.notes}
                                                </TableCell>
                                                <TableCell align="center">
                                                    {isOwn ? (
                                                        <Typography variant="caption" color="error.main" fontWeight={600}>
                                                            Separation of Duties (Cannot Self-Approve)
                                                        </Typography>
                                                    ) : (
                                                        <Box display="flex" justifyContent="center" gap={1}>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="success"
                                                                startIcon={<CheckCircleOutlineIcon />}
                                                                onClick={() => handleOpenDecision(app, 'approve')}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                color="error"
                                                                startIcon={<CancelOutlinedIcon />}
                                                                onClick={() => handleOpenDecision(app, 'reject')}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </Box>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Tab 1: History */}
                {tab === 1 && (
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tx Reference</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Decision</TableCell>
                                    <TableCell>Reviewed By</TableCell>
                                    <TableCell>Decided At</TableCell>
                                    <TableCell>Notes / Reason</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            No approval records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    historyList.map((app) => (
                                        <TableRow key={app.id}>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                {app.transaction?.reference}
                                            </TableCell>
                                            <TableCell fontWeight={700}>
                                                ${Number(app.transaction?.amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={app.status} />
                                            </TableCell>
                                            <TableCell>{app.approver?.name || 'System / Auto'}</TableCell>
                                            <TableCell sx={{ fontSize: '0.82rem' }}>
                                                {app.decided_at ? new Date(app.decided_at).toLocaleString() : 'N/A'}
                                            </TableCell>
                                            <TableCell sx={{ color: 'text.secondary' }}>
                                                {app.notes || '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>

            {/* Decision Dialog */}
            <Dialog open={Boolean(selectedApproval)} onClose={() => setSelectedApproval(null)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>
                    {actionType === 'approve' ? 'Authorize High-Value Transfer' : 'Reject High-Value Transfer'}
                </DialogTitle>
                <DialogContent dividers>
                    {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
                    {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

                    <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                            Transaction Reference: <strong style={{ fontFamily: 'monospace' }}>{selectedApproval?.transaction?.reference}</strong>
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="primary" my={1}>
                            ${Number(selectedApproval?.transaction?.amount).toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                            From: <strong>{selectedApproval?.transaction?.from_account?.account_number}</strong> ({selectedApproval?.transaction?.initiator?.name})
                        </Typography>
                        <Typography variant="body2">
                            To: <strong>{selectedApproval?.transaction?.to_account?.account_number}</strong>
                        </Typography>
                    </Box>

                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={actionType === 'approve' ? 'Approval Comments (optional)' : 'Reason for Rejection (required)'}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        required={actionType === 'reject'}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setSelectedApproval(null)}>Cancel</Button>
                    <Button
                        variant="contained"
                        color={actionType === 'approve' ? 'success' : 'error'}
                        onClick={handleExecuteDecision}
                        disabled={submitting}
                    >
                        {submitting ? <CircularProgress size={20} /> : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

