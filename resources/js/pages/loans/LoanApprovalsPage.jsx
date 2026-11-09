import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Tabs,
    Tab,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    LinearProgress,
    Stack,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
} from '@mui/material';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LockIcon from '@mui/icons-material/Lock';
import GavelIcon from '@mui/icons-material/Gavel';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function LoanApprovalsPage() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const isAdmin   = user?.role === 'admin';
    const isOfficer = user?.role === 'officer';

    // Status filter chip
    const [statusFilter, setStatusFilter] = useState('all');

    const [loans, setLoans]     = useState([]);
    const [loading, setLoading] = useState(true);

    // ── Review Modal (details + docs + decision) ──────────────────
    const [reviewLoan, setReviewLoan]           = useState(null);
    const [reviewLoading, setReviewLoading]     = useState(false);
    const [approveNotes, setApproveNotes]       = useState('');
    const [rejectReason, setRejectReason]       = useState('');
    const [actionTab, setActionTab]             = useState(0); // 0=approve 1=reject
    const [actionError, setActionError]         = useState('');
    const [actionSuccess, setActionSuccess]     = useState('');
    const [actionSubmitting, setActionSubmitting] = useState(false);

    // ── Schedule Viewer ───────────────────────────────────────────
    const [viewLoan, setViewLoan]               = useState(null);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    // ── Document In-App Reader Modal ──────────────────────────────
    const [previewDoc, setPreviewDoc]           = useState(null);

    const getDocumentUrl = (docId) => {
        if (!docId) return '';
        const token = localStorage.getItem('banking_token') || '';
        const isSubfolder = window.location.pathname.startsWith('/banking/public');
        const base = isSubfolder ? '/banking/public/api' : '/api';
        return `${base}/loan-documents/${docId}/view?token=${encodeURIComponent(token)}`;
    };

    // ── Load All System Loans ─────────────────────────────────────
    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/loans', {
                params: statusFilter !== 'all' ? { status: statusFilter } : {}
            });
            let list = res.data.data || [];
            if (statusFilter !== 'all') {
                list = list.filter(l => l.status === statusFilter);
            }
            setLoans(list);
        } catch (err) {
            console.error('Failed to load loans:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        loadData();
    }, [user, statusFilter]);

    // ── Open Review Modal ────────────────────────────────────────
    const handleOpenReview = async (loanId) => {
        setReviewLoading(true);
        setActionError('');
        setActionSuccess('');
        setApproveNotes('');
        setRejectReason('');
        setActionTab(0);
        try {
            const res = await api.get(`/loans/${loanId}`);
            setReviewLoan(res.data.loan);
        } catch (err) {
            alert('Failed to load loan details: ' + (err.response?.data?.message || err.message));
        } finally {
            setReviewLoading(false);
        }
    };

    // ── Approve ──────────────────────────────────────────────────
    const handleApproveLoan = async () => {
        if (!window.confirm('Approve this loan and disburse principal funds into the client account?')) return;
        setActionSubmitting(true);
        setActionError('');
        try {
            await api.post(`/loans/${reviewLoan.id}/approve`, { notes: approveNotes });
            setActionSuccess('Loan approved and funds disbursed successfully!');
            await loadData();
            const res = await api.get(`/loans/${reviewLoan.id}`);
            setReviewLoan(res.data.loan);
        } catch (err) {
            setActionError(err.response?.data?.message || 'Approval failed.');
        } finally {
            setActionSubmitting(false);
        }
    };

    // ── Reject ───────────────────────────────────────────────────
    const handleRejectLoan = async () => {
        if (!rejectReason.trim()) {
            setActionError('Please enter a rejection reason.');
            return;
        }
        if (!window.confirm('Reject this loan application?')) return;
        setActionSubmitting(true);
        setActionError('');
        try {
            await api.post(`/loans/${reviewLoan.id}/reject`, { reason: rejectReason });
            setActionSuccess('Loan has been rejected.');
            await loadData();
            const res = await api.get(`/loans/${reviewLoan.id}`);
            setReviewLoan(res.data.loan);
        } catch (err) {
            setActionError(err.response?.data?.message || 'Rejection failed.');
        } finally {
            setActionSubmitting(false);
        }
    };

    // ── View Schedule ────────────────────────────────────────────
    const handleViewSchedule = async (loanId) => {
        setScheduleLoading(true);
        try {
            const res = await api.get(`/loans/${loanId}`);
            setViewLoan(res.data.loan);
        } catch (err) {
            alert('Failed to load schedule: ' + (err.response?.data?.message || err.message));
        } finally {
            setScheduleLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <AssignmentTurnedInIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800}>
                            Loan Review & Approvals Oversight
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {isAdmin
                            ? 'Evaluate institutional loan applications, examine client verification documents, and execute approvals with immediate fund disbursement.'
                            : 'Compliance Oversight: Review client credit requests and examine verification documents in read-only mode.'}
                    </Typography>
                </Box>
            </Box>

            {/* Officer read-only notice */}
            {isOfficer && (
                <Alert severity="info" icon={<LockIcon />} sx={{ mb: 2.5 }}>
                    <strong>Compliance Officer Oversight Mode</strong> — You have full visibility to examine loan applications
                    and client-submitted verification documents. Final approval and fund disbursement is reserved for System Administrators.
                </Alert>
            )}

            {/* Status Filter Chips */}
            <Box mb={3} display="flex" gap={1} flexWrap="wrap">
                {[
                    { label: 'All Applications', value: 'all' },
                    { label: 'Pending Approval', value: 'pending' },
                    { label: 'Active Facilities', value: 'active' },
                    { label: 'Paid / Completed', value: 'paid' },
                    { label: 'Rejected',         value: 'rejected' },
                ].map((s) => (
                    <Chip
                        key={s.value}
                        label={s.label}
                        clickable
                        color={statusFilter === s.value ? 'primary' : 'default'}
                        variant={statusFilter === s.value ? 'filled' : 'outlined'}
                        onClick={() => setStatusFilter(s.value)}
                        sx={{ fontWeight: 600 }}
                    />
                ))}
            </Box>

            {/* Loans Table */}
            <Card sx={{ borderRadius: 3, position: 'relative' }}>
                {loading && (
                    <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} />
                )}
                <TableContainer component={Paper} elevation={0}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Loan ID</TableCell>
                                <TableCell>Applicant</TableCell>
                                <TableCell>Target Account</TableCell>
                                <TableCell align="right">Principal</TableCell>
                                <TableCell align="right">Total Obligation</TableCell>
                                <TableCell align="right">Remaining</TableCell>
                                <TableCell>Term / Rate</TableCell>
                                <TableCell>Documents</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Review Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && loans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : loans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No loan applications found matching criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                loans.map((loan) => (
                                    <TableRow key={loan.id} hover sx={{ opacity: loading ? 0.7 : 1 }}>
                                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                            #{loan.id}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {loan.user?.name || 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {loan.user?.email || ''}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                            {loan.account?.account_number || 'N/A'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                                            ${Number(loan.principal_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell align="right">
                                            ${Number(loan.total_payable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, color: Number(loan.remaining_balance) > 0 ? 'error.main' : 'success.main' }}>
                                            ${Number(loan.remaining_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            {loan.term_months} mos @ {loan.interest_rate}%
                                        </TableCell>
                                        <TableCell>
                                            {(loan.loan_documents?.length || 0) > 0 ? (
                                                <Chip
                                                    icon={<AttachFileIcon />}
                                                    label={`${loan.loan_documents.length} doc${loan.loan_documents.length > 1 ? 's' : ''}`}
                                                    size="small"
                                                    color="info"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">No docs</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={loan.status} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Tooltip title="View amortization schedule">
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        startIcon={<ScheduleIcon />}
                                                        onClick={() => handleViewSchedule(loan.id)}
                                                    >
                                                        Schedule
                                                    </Button>
                                                </Tooltip>

                                                <Button
                                                    size="small"
                                                    variant={loan.status === 'pending' ? 'contained' : 'outlined'}
                                                    color={isAdmin && loan.status === 'pending' ? 'primary' : 'inherit'}
                                                    startIcon={isAdmin ? <GavelIcon /> : <VisibilityIcon />}
                                                    onClick={() => handleOpenReview(loan.id)}
                                                >
                                                    {loan.status === 'pending'
                                                        ? (isAdmin ? 'Review & Decide' : 'Review (Read-Only)')
                                                        : 'View Details'}
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ═══════════════════════════════════════════════════════════
                SUBMISSION REVIEW MODAL (Admin: approve/reject | Officer: read-only)
            ═══════════════════════════════════════════════════════════ */}
            <Dialog open={Boolean(reviewLoan)} onClose={() => setReviewLoan(null)} maxWidth="md" fullWidth>
                <DialogTitle fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isAdmin ? <GavelIcon color="warning" /> : <VisibilityIcon color="info" />}
                    Loan Submission #{reviewLoan?.id} — {isAdmin ? 'Review & Decision' : 'Compliance Inspection'}
                    {isOfficer && (
                        <Chip icon={<LockIcon />} label="Read-Only" size="small" color="info" sx={{ ml: 'auto' }} />
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
                    {actionSuccess && <Alert severity="success" sx={{ mb: 2 }}>{actionSuccess}</Alert>}

                    {/* ── Summary ── */}
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                        APPLICATION DETAILS
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Applicant</Typography>
                            <Typography fontWeight={700}>{reviewLoan?.user?.name || 'N/A'}</Typography>
                            <Typography variant="caption">{reviewLoan?.user?.email || ''}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Principal Amount</Typography>
                            <Typography fontWeight={700} color="primary">
                                ${Number(reviewLoan?.principal_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Term / Rate</Typography>
                            <Typography fontWeight={700}>{reviewLoan?.term_months} months @ {reviewLoan?.interest_rate}%</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Facility Status</Typography>
                            <Box mt={0.5}><StatusBadge status={reviewLoan?.status} /></Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">Loan Purpose / Business Case</Typography>
                            <Typography sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1.5, mt: 0.5 }}>
                                {reviewLoan?.purpose || 'No purpose stated.'}
                            </Typography>
                        </Grid>
                        {reviewLoan?.rejection_reason && (
                            <Grid item xs={12}>
                                <Alert severity="error">
                                    <strong>Rejection Reason:</strong> {reviewLoan.rejection_reason}
                                </Alert>
                            </Grid>
                        )}
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* ── Client Documents ── */}
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                        CLIENT-SUBMITTED VERIFICATION DOCUMENTS ({reviewLoan?.loan_documents?.length || 0})
                    </Typography>
                    {(!reviewLoan?.loan_documents || reviewLoan.loan_documents.length === 0) ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            No supporting verification documents were submitted with this application.
                        </Alert>
                    ) : (
                        <List dense sx={{ mb: 2 }}>
                            {reviewLoan.loan_documents.map((doc) => (
                                <ListItem
                                    key={doc.id}
                                    sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 1, p: 1.5 }}
                                    secondaryAction={
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                startIcon={<DescriptionIcon />}
                                                onClick={() => setPreviewDoc(doc)}
                                            >
                                                Read Document
                                            </Button>
                                            <Tooltip title="Open in new browser tab">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    href={getDocumentUrl(doc.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <OpenInNewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    }
                                >
                                    <ListItemIcon>
                                        <InsertDriveFileIcon color="primary" sx={{ fontSize: 32 }} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography fontWeight={700} variant="body1">
                                                {doc.document_type_label || doc.document_type}
                                            </Typography>
                                        }
                                        secondary={`${doc.original_name} ${doc.file_size ? '• ' + formatBytes(doc.file_size) : ''}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}

                    {/* ── Admin Decision Box ── */}
                    {isAdmin && reviewLoan?.status === 'pending' && (
                        <Paper variant="outlined" sx={{ p: 2.5, my: 2, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={800}>
                                        ADMINISTRATIVE DECISION
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Examine applicant documentation above, then record your approval or rejection decision.
                                    </Typography>
                                </Box>
                                <Tabs value={actionTab} onChange={(_, v) => setActionTab(v)} sx={{ minHeight: 36 }}>
                                    <Tab label="✅ Approve & Disburse" sx={{ minHeight: 36, fontWeight: 700 }} />
                                    <Tab label="❌ Reject Application" sx={{ minHeight: 36, fontWeight: 700, color: 'error.main' }} />
                                </Tabs>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            {actionTab === 0 && (
                                <Box>
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        <strong>Disbursement Target:</strong> Approving will disburse <strong>${Number(reviewLoan?.principal_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> directly into client account <strong>{reviewLoan?.account?.account_number}</strong>.
                                    </Alert>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="Reviewer Verification Notes (optional)"
                                        value={approveNotes}
                                        onChange={(e) => setApproveNotes(e.target.value)}
                                        placeholder="e.g. Identity and income verified through submitted documents. Approved without conditions."
                                        sx={{ mb: 2 }}
                                    />
                                    <Button
                                        variant="contained"
                                        color="success"
                                        size="large"
                                        startIcon={actionSubmitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleOutlineIcon />}
                                        onClick={handleApproveLoan}
                                        disabled={actionSubmitting}
                                    >
                                        Approve & Disburse ${Number(reviewLoan?.principal_amount || 0).toLocaleString()}
                                    </Button>
                                </Box>
                            )}

                            {actionTab === 1 && (
                                <Box>
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        Rejecting this loan request will notify the applicant and mark the facility as declined.
                                    </Alert>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Reason for Rejection *"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="e.g. Identity or proof of income document is unreadable or insufficient to meet risk requirements."
                                        sx={{ mb: 2 }}
                                        required
                                    />
                                    <Button
                                        variant="contained"
                                        color="error"
                                        size="large"
                                        startIcon={actionSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
                                        onClick={handleRejectLoan}
                                        disabled={actionSubmitting}
                                    >
                                        Confirm Rejection
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    )}

                    {/* Officer notice */}
                    {isOfficer && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Alert severity="info" icon={<LockIcon />}>
                                <strong>Compliance Officer — Oversight Complete.</strong> You have reviewed the application and
                                supporting documents. Only an Administrator has authority to approve or reject this submission.
                            </Alert>
                        </>
                    )}

                    {/* Decided Banner */}
                    {isAdmin && reviewLoan?.status !== 'pending' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Alert severity={reviewLoan?.status === 'active' ? 'success' : 'warning'}>
                                This application has already been <strong>{reviewLoan?.status}</strong>.
                                {reviewLoan?.approved_at && ` Decision logged on ${new Date(reviewLoan.approved_at).toLocaleDateString()}.`}
                            </Alert>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setReviewLoan(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════
                SCHEDULE MODAL
            ═══════════════════════════════════════════════════════════ */}
            <Dialog open={Boolean(viewLoan)} onClose={() => setViewLoan(null)} maxWidth="md" fullWidth>
                <DialogTitle fontWeight={700}>
                    Loan #{viewLoan?.id} — Amortization Schedule
                </DialogTitle>
                <DialogContent dividers>
                    <Box display="flex" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                        <Typography variant="body2">
                            Principal: <strong>${Number(viewLoan?.principal_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                            {' | '}Total Obligation: <strong>${Number(viewLoan?.total_payable || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                        </Typography>
                        <Typography variant="body2">
                            Remaining: <strong style={{ color: '#ef4444' }}>${Number(viewLoan?.remaining_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                        </Typography>
                    </Box>

                    <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>Due Date</TableCell>
                                    <TableCell align="right">Principal</TableCell>
                                    <TableCell align="right">Interest</TableCell>
                                    <TableCell align="right">Total Due</TableCell>
                                    <TableCell align="right">Paid</TableCell>
                                    <TableCell align="center">Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {viewLoan?.schedules?.map((sch) => (
                                    <TableRow key={sch.id}>
                                        <TableCell sx={{ fontWeight: 600 }}>{sch.installment_number}</TableCell>
                                        <TableCell>{sch.due_date}</TableCell>
                                        <TableCell align="right">${Number(sch.principal_amount).toFixed(2)}</TableCell>
                                        <TableCell align="right">${Number(sch.interest_amount).toFixed(2)}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700 }}>${Number(sch.total_amount).toFixed(2)}</TableCell>
                                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>
                                            ${Number(sch.paid_amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <StatusBadge status={sch.status} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setViewLoan(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════
                IN-APP DOCUMENT VIEWER DIALOG
            ═══════════════════════════════════════════════════════════ */}
            <Dialog
                open={Boolean(previewDoc)}
                onClose={() => setPreviewDoc(null)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <DescriptionIcon color="primary" />
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {previewDoc?.original_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Document Category: <strong>{previewDoc?.document_type_label || previewDoc?.document_type}</strong>
                                {previewDoc?.file_size ? ` • ${formatBytes(previewDoc.file_size)}` : ''}
                            </Typography>
                        </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            href={getDocumentUrl(previewDoc?.id) + '&download=1'}
                        >
                            Download
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<OpenInNewIcon />}
                            href={getDocumentUrl(previewDoc?.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open in New Tab
                        </Button>
                        <IconButton size="small" onClick={() => setPreviewDoc(null)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, height: '75vh', bgcolor: (theme) => theme.palette.mode === 'light' ? '#f1f5f9' : '#0f172a' }}>
                    {previewDoc && (
                        <iframe
                            src={getDocumentUrl(previewDoc.id)}
                            title={previewDoc.original_name}
                            width="100%"
                            height="100%"
                            style={{ border: 'none', display: 'block' }}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 1.5, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                        Examine all pages carefully to verify identity, financial standing, and authenticity.
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        {isAdmin && reviewLoan?.status === 'pending' && (
                            <>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => {
                                        setPreviewDoc(null);
                                        setActionTab(1);
                                    }}
                                >
                                    Reject Application
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    startIcon={<CheckCircleOutlineIcon />}
                                    onClick={() => {
                                        setPreviewDoc(null);
                                        setActionTab(0);
                                    }}
                                >
                                    Approve Loan
                                </Button>
                            </>
                        )}
                        <Button variant="outlined" onClick={() => setPreviewDoc(null)}>Done Reading</Button>
                    </Stack>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
