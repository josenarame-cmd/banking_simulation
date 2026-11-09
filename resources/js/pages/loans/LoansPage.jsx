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
    MenuItem,
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

import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import GavelIcon from '@mui/icons-material/Gavel';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';

import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const DOCUMENT_TYPES = [
    { value: 'national_id',           label: 'National ID' },
    { value: 'payslip',               label: 'Pay Slip' },
    { value: 'employment_letter',     label: 'Employment Letter' },
    { value: 'bank_statement',        label: 'Bank Statement' },
    { value: 'business_registration', label: 'Business Registration' },
    { value: 'other',                 label: 'Other / Supporting Doc' },
];

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function LoansPage() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const isAdmin   = user?.role === 'admin';
    const isOfficer = user?.role === 'officer';
    const isStaff   = isAdmin || isOfficer;

    // Staff tab: 0 = All System Loans, 1 = My Personal Loans
    const [staffTab, setStaffTab] = useState(0);

    // Status filter chip
    const [statusFilter, setStatusFilter] = useState('all');

    const [loans, setLoans]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState([]);

    // ── Application Modal ─────────────────────────────────────────
    const [applyOpen, setApplyOpen]           = useState(false);
    const [receivingAccountId, setReceivingAccountId] = useState('');
    const [principalAmount, setPrincipalAmount] = useState('2000');
    const [termMonths, setTermMonths]         = useState('6');
    const [purpose, setPurpose]               = useState('');
    const [applyError, setApplyError]         = useState('');
    const [applySuccess, setApplySuccess]     = useState('');
    const [submitting, setSubmitting]         = useState(false);

    // Multiple document uploads
    const [uploadedFiles, setUploadedFiles] = useState([]); // [{file, type}]

    // ── Repay Modal ───────────────────────────────────────────────
    const [repayLoan, setRepayLoan]     = useState(null);
    const [repayAmount, setRepayAmount] = useState('');
    const [repayError, setRepayError]   = useState('');
    const [repaySuccess, setRepaySuccess] = useState('');

    // ── Loan Review Modal (details + docs + approve/reject) ───────
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

    const showingAll = isStaff && staffTab === 0;

    // ─────────────────────────────────────────────────────────────
    const loadData = async () => {
        setLoading(true);
        const endpoint = showingAll ? '/loans' : '/my-loans';
        try {
            const [loansRes, accRes] = await Promise.all([
                api.get(endpoint, {
                    params: statusFilter !== 'all' ? { status: statusFilter } : {}
                }),
                api.get('/my-accounts')
            ]);
            let list = loansRes.data.data || [];
            if (statusFilter !== 'all') {
                list = list.filter(l => l.status === statusFilter);
            }
            setLoans(list);
            const userAccounts = accRes.data.accounts || [];
            setAccounts(userAccounts);
            if (userAccounts.length > 0 && !receivingAccountId) {
                setReceivingAccountId(userAccounts[0].id);
            }
        } catch (err) {
            console.error('Failed to load loans:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        loadData();
    }, [user, staffTab, statusFilter]);

    // ── Apply Submit ─────────────────────────────────────────────
    const handleApplySubmit = async (e) => {
        e.preventDefault();
        setApplyError('');
        setApplySuccess('');
        setSubmitting(true);

        const formData = new FormData();
        formData.append('account_id', receivingAccountId);
        formData.append('principal_amount', principalAmount);
        formData.append('term_months', termMonths);
        formData.append('purpose', purpose);

        uploadedFiles.forEach((item, i) => {
            formData.append(`documents[${i}]`, item.file);
            formData.append(`document_types[${i}]`, item.type);
        });

        try {
            await api.post('/loans/apply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setApplySuccess('Loan application submitted! Awaiting administrator approval.');
            await loadData();
            setTimeout(() => {
                setApplyOpen(false);
                setPurpose('');
                setUploadedFiles([]);
                setApplySuccess('');
            }, 1200);
        } catch (err) {
            setApplyError(err.response?.data?.message || 'Failed to submit loan application.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Repay Submit ─────────────────────────────────────────────
    const handleRepaySubmit = async (e) => {
        e.preventDefault();
        setRepayError('');
        setRepaySuccess('');
        setSubmitting(true);
        try {
            const res = await api.post(`/loans/${repayLoan.id}/repay`, {
                amount: parseFloat(repayAmount),
            });
            setRepaySuccess(`Repayment of $${repayAmount} successful! Remaining: $${res.data.remaining_loan_balance}.`);
            await loadData();
            setTimeout(() => { setRepayLoan(null); setRepaySuccess(''); }, 1200);
        } catch (err) {
            setRepayError(err.response?.data?.message || 'Repayment failed.');
        } finally {
            setSubmitting(false);
        }
    };

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
            // Refresh review modal data
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

    // ── File picker helpers ──────────────────────────────────────
    const handleFileAdd = (e) => {
        const files = Array.from(e.target.files);
        const newItems = files.map(f => ({ file: f, type: 'other' }));
        setUploadedFiles(prev => [...prev, ...newItems]);
        e.target.value = '';
    };

    const handleFileTypeChange = (index, newType) => {
        setUploadedFiles(prev => prev.map((item, i) => i === index ? { ...item, type: newType } : item));
    };

    const handleFileRemove = (index) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Loan estimate calc
    const calcPrincipal = parseFloat(principalAmount) || 0;
    const calcMonths    = parseInt(termMonths) || 1;
    const estRate       = 10.0;
    const estInterest   = (calcPrincipal * (estRate / 100) * (calcMonths / 12));
    const estTotal      = calcPrincipal + estInterest;
    const estMonthly    = estTotal / calcMonths;

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        {showingAll ? 'Loan Portfolio Administration' : 'My Loans & Credit Facilities'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {showingAll
                            ? isAdmin
                                ? 'Review loan applications, verify client documents, and approve or reject requests.'
                                : 'Review loan applications and verify client-submitted documentation (read-only).'
                            : 'Request credit facilities, monitor your repayment schedule, and make repayments.'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { setApplyError(''); setApplySuccess(''); setUploadedFiles([]); setApplyOpen(true); }}
                >
                    Apply for Loan
                </Button>
            </Box>

            {/* Staff Role Tabs */}
            {isStaff && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={staffTab} onChange={(_, val) => setStaffTab(val)}>
                        <Tab
                            label={isAdmin ? 'All Loan Applications (Admin Review)' : 'All Loan Applications (Read-Only Review)'}
                            icon={isAdmin ? <GavelIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
                            iconPosition="start"
                        />
                        <Tab label="My Personal Loans" />
                    </Tabs>
                </Box>
            )}

            {/* Officer read-only notice */}
            {isOfficer && staffTab === 0 && (
                <Alert severity="info" icon={<LockIcon />} sx={{ mb: 2 }}>
                    <strong>Read-Only Review Mode</strong> — As a Compliance Officer you can review loan applications and
                    verify all client-submitted documentation. Only an Administrator can approve or reject loans.
                </Alert>
            )}

            {/* Status Filter Chips */}
            <Box mb={3} display="flex" gap={1} flexWrap="wrap">
                {[
                    { label: 'All Statuses',     value: 'all' },
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
                                {showingAll && <TableCell>Applicant</TableCell>}
                                <TableCell>Disbursement Account</TableCell>
                                <TableCell align="right">Principal</TableCell>
                                <TableCell align="right">Total Obligation</TableCell>
                                <TableCell align="right">Remaining</TableCell>
                                <TableCell>Term</TableCell>
                                <TableCell>Docs</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && loans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={showingAll ? 10 : 9} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : loans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={showingAll ? 10 : 9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No loan applications found matching criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                loans.map((loan) => (
                                    <TableRow key={loan.id} hover sx={{ opacity: loading ? 0.7 : 1 }}>
                                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                            #{loan.id}
                                        </TableCell>
                                        {showingAll && (
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {loan.user?.name || 'N/A'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {loan.user?.email || ''}
                                                </Typography>
                                            </TableCell>
                                        )}
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
                                                    label={loan.loan_documents.length}
                                                    size="small"
                                                    color="info"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={loan.status} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                {/* Schedule button */}
                                                <Tooltip title="View repayment schedule">
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        startIcon={<ScheduleIcon />}
                                                        onClick={() => handleViewSchedule(loan.id)}
                                                    >
                                                        Schedule
                                                    </Button>
                                                </Tooltip>

                                                {/* Repay button (customer or personal tab) */}
                                                {loan.status === 'active' && Number(loan.remaining_balance) > 0 && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        startIcon={<PaymentIcon />}
                                                        onClick={() => {
                                                            setRepayLoan(loan);
                                                            setRepayAmount(String(Math.min(500, Number(loan.remaining_balance))));
                                                            setRepayError('');
                                                            setRepaySuccess('');
                                                        }}
                                                    >
                                                        Repay
                                                    </Button>
                                                )}

                                                {/* Review button for staff */}
                                                {isStaff && showingAll && (
                                                    <Button
                                                        size="small"
                                                        variant={isAdmin && loan.status === 'pending' ? 'contained' : 'outlined'}
                                                        color={isAdmin && loan.status === 'pending' ? 'warning' : 'primary'}
                                                        startIcon={isAdmin ? <GavelIcon /> : <VisibilityIcon />}
                                                        onClick={() => handleOpenReview(loan.id)}
                                                    >
                                                        {isAdmin ? (loan.status === 'pending' ? 'Review & Decide' : 'View Details') : 'Review'}
                                                    </Button>
                                                )}
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
                LOAN REVIEW MODAL (Admin: approve/reject | Officer: read-only)
            ═══════════════════════════════════════════════════════════ */}
            <Dialog open={Boolean(reviewLoan)} onClose={() => setReviewLoan(null)} maxWidth="md" fullWidth>
                <DialogTitle fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isAdmin ? <GavelIcon color="warning" /> : <SearchIcon color="info" />}
                    Loan #{reviewLoan?.id} — {isAdmin ? 'Review & Decision' : 'Read-Only Review'}
                    {isOfficer && (
                        <Chip icon={<LockIcon />} label="Read-Only" size="small" color="info" sx={{ ml: 'auto' }} />
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
                    {actionSuccess && <Alert severity="success" sx={{ mb: 2 }}>{actionSuccess}</Alert>}

                    {/* ── Loan Info Summary ── */}
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                        LOAN APPLICATION SUMMARY
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Applicant</Typography>
                            <Typography fontWeight={700}>{reviewLoan?.user?.name || 'N/A'}</Typography>
                            <Typography variant="caption">{reviewLoan?.user?.email || ''}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Principal Requested</Typography>
                            <Typography fontWeight={700} color="primary">
                                ${Number(reviewLoan?.principal_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Term / Rate</Typography>
                            <Typography fontWeight={700}>{reviewLoan?.term_months} months @ {reviewLoan?.interest_rate}%</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">Status</Typography>
                            <Box mt={0.5}><StatusBadge status={reviewLoan?.status} /></Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">Loan Purpose</Typography>
                            <Typography>{reviewLoan?.purpose || '—'}</Typography>
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

                    {/* ── Submitted Documents ── */}
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                        CLIENT-SUBMITTED DOCUMENTS ({reviewLoan?.loan_documents?.length || 0})
                    </Typography>
                    {(!reviewLoan?.loan_documents || reviewLoan.loan_documents.length === 0) ? (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            No supporting documents were submitted with this loan application.
                        </Alert>
                    ) : (
                        <List dense sx={{ mb: 2 }}>
                            {reviewLoan.loan_documents.map((doc) => (
                                <ListItem
                                    key={doc.id}
                                    sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 1 }}
                                    secondaryAction={
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            href={doc.download_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            startIcon={<DescriptionIcon />}
                                        >
                                            Open
                                        </Button>
                                    }
                                >
                                    <ListItemIcon>
                                        <InsertDriveFileIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography fontWeight={600}>
                                                {doc.document_type_label || doc.document_type}
                                            </Typography>
                                        }
                                        secondary={`${doc.original_name} ${doc.file_size ? '• ' + formatBytes(doc.file_size) : ''}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}

                    {/* ── Admin-only: Approve / Reject Actions ── */}
                    {isAdmin && reviewLoan?.status === 'pending' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                                ADMINISTRATIVE DECISION
                            </Typography>
                            <Tabs value={actionTab} onChange={(_, v) => setActionTab(v)} sx={{ mb: 2 }}>
                                <Tab label="✅ Approve Loan" />
                                <Tab label="❌ Reject Loan" />
                            </Tabs>
                            {actionTab === 0 && (
                                <Box>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Approving will disburse <strong>${Number(reviewLoan?.principal_amount || 0).toLocaleString()}</strong> into
                                        account <strong>{reviewLoan?.account?.account_number}</strong>.
                                    </Alert>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="Approval Notes (optional)"
                                        value={approveNotes}
                                        onChange={(e) => setApproveNotes(e.target.value)}
                                        placeholder="e.g. Documents verified. Credit check passed."
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
                                        Approve & Disburse Funds
                                    </Button>
                                </Box>
                            )}
                            {actionTab === 1 && (
                                <Box>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Rejection Reason *"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="e.g. Insufficient income documentation. ID document could not be verified."
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
                                        Reject Loan Application
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}

                    {/* Officer notice: no actions */}
                    {isOfficer && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Alert severity="info" icon={<LockIcon />}>
                                <strong>Compliance Officer — Review Complete.</strong> You have reviewed the application and
                                supporting documents. Contact the Administrator to take approval action on this loan.
                            </Alert>
                        </>
                    )}

                    {/* Admin view when already decided */}
                    {isAdmin && reviewLoan?.status !== 'pending' && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Alert severity={reviewLoan?.status === 'active' ? 'success' : 'warning'}>
                                This loan has already been <strong>{reviewLoan?.status}</strong>.
                                {reviewLoan?.approved_at && ` Decision made on ${new Date(reviewLoan.approved_at).toLocaleDateString()}.`}
                            </Alert>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setReviewLoan(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════
                APPLY LOAN MODAL
            ═══════════════════════════════════════════════════════════ */}
            <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>Apply for a Loan</DialogTitle>
                <form onSubmit={handleApplySubmit}>
                    <DialogContent dividers>
                        {applyError && <Alert severity="error" sx={{ mb: 2 }}>{applyError}</Alert>}
                        {applySuccess && <Alert severity="success" sx={{ mb: 2 }}>{applySuccess}</Alert>}

                        {accounts.length === 0 ? (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                You do not have any active bank accounts to receive loan disbursement funds.
                                <Button size="small" onClick={() => { setApplyOpen(false); navigate('/accounts'); }} sx={{ ml: 1 }}>
                                    Open Account
                                </Button>
                            </Alert>
                        ) : (
                            <TextField
                                select
                                fullWidth
                                label="Receiving Account (Disbursement Target)"
                                value={receivingAccountId}
                                onChange={(e) => setReceivingAccountId(e.target.value)}
                                margin="normal"
                                required
                            >
                                {accounts.map((acc) => (
                                    <MenuItem key={acc.id} value={acc.id}>
                                        {acc.account_name} — {acc.account_number} (${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Principal Amount ($)"
                                    type="number"
                                    value={principalAmount}
                                    onChange={(e) => setPrincipalAmount(e.target.value)}
                                    margin="normal"
                                    inputProps={{ min: '100', step: '50' }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Repayment Term"
                                    value={termMonths}
                                    onChange={(e) => setTermMonths(e.target.value)}
                                    margin="normal"
                                    required
                                >
                                    <MenuItem value="3">3 Months</MenuItem>
                                    <MenuItem value="6">6 Months</MenuItem>
                                    <MenuItem value="12">12 Months (1 Year)</MenuItem>
                                    <MenuItem value="24">24 Months (2 Years)</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>

                        {/* Loan Calculator Preview */}
                        <Paper variant="outlined" sx={{ p: 2, my: 2, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b' }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                                ESTIMATED REPAYMENT PREVIEW (10.0% P.A.)
                            </Typography>
                            <Box display="flex" justifyContent="space-between" mt={1}>
                                <Typography variant="body2">Monthly Installment:</Typography>
                                <Typography variant="body2" fontWeight={800} color="primary">
                                    ${estMonthly.toFixed(2)} / month
                                </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2">Total Interest Payable:</Typography>
                                <Typography variant="body2" fontWeight={600}>${estInterest.toFixed(2)}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2">Total Repayable Amount:</Typography>
                                <Typography variant="body2" fontWeight={800}>${estTotal.toFixed(2)}</Typography>
                            </Box>
                        </Paper>

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Loan Purpose & Business Case"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            margin="normal"
                            placeholder="e.g. Equipment purchase, home renovation, education fees..."
                            required
                        />

                        {/* Supporting Documents Upload */}
                        <Box mt={2}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                Supporting Documents
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                Upload relevant documents (National ID, pay slip, employment letter, etc.). PDF, JPG, PNG — max 5 MB each.
                            </Typography>

                            <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                startIcon={<AttachFileIcon />}
                            >
                                Add Document(s)
                                <input type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileAdd} />
                            </Button>

                            {uploadedFiles.length > 0 && (
                                <List dense sx={{ mt: 1 }}>
                                    {uploadedFiles.map((item, i) => (
                                        <ListItem
                                            key={i}
                                            sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5 }}
                                            secondaryAction={
                                                <IconButton size="small" color="error" onClick={() => handleFileRemove(i)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <InsertDriveFileIcon fontSize="small" color="primary" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.file.name}
                                                secondary={formatBytes(item.file.size)}
                                                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                                sx={{ mr: 6 }}
                                            />
                                            <TextField
                                                select
                                                size="small"
                                                value={item.type}
                                                onChange={(e) => handleFileTypeChange(i, e.target.value)}
                                                sx={{ minWidth: 160, mr: 1 }}
                                            >
                                                {DOCUMENT_TYPES.map(dt => (
                                                    <MenuItem key={dt.value} value={dt.value}>{dt.label}</MenuItem>
                                                ))}
                                            </TextField>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setApplyOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained" disabled={submitting || accounts.length === 0}>
                            {submitting ? <CircularProgress size={20} /> : 'Submit Application'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════
                REPAY MODAL
            ═══════════════════════════════════════════════════════════ */}
            <Dialog open={Boolean(repayLoan)} onClose={() => setRepayLoan(null)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={700}>Make Loan Repayment</DialogTitle>
                <form onSubmit={handleRepaySubmit}>
                    <DialogContent dividers>
                        {repayError && <Alert severity="error" sx={{ mb: 2 }}>{repayError}</Alert>}
                        {repaySuccess && <Alert severity="success" sx={{ mb: 2 }}>{repaySuccess}</Alert>}

                        <Typography variant="body2" color="text.secondary" mb={1}>
                            Loan #{repayLoan?.id} Outstanding Balance:
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color="error.main" mb={2}>
                            ${Number(repayLoan?.remaining_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                            Debited from Account: <strong>{repayLoan?.account?.account_number}</strong>
                        </Typography>

                        <TextField
                            fullWidth
                            label="Repayment Amount ($)"
                            type="number"
                            value={repayAmount}
                            onChange={(e) => setRepayAmount(e.target.value)}
                            inputProps={{ min: '0.01', max: repayLoan?.remaining_balance, step: '0.01' }}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setRepayLoan(null)}>Cancel</Button>
                        <Button type="submit" variant="contained" color="success" disabled={submitting}>
                            {submitting ? <CircularProgress size={20} /> : 'Confirm Payment'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════
                INSTALLMENT SCHEDULE MODAL
            ═══════════════════════════════════════════════════════════ */}
            <Dialog open={Boolean(viewLoan)} onClose={() => setViewLoan(null)} maxWidth="md" fullWidth>
                <DialogTitle fontWeight={700}>
                    Loan #{viewLoan?.id} — Amortization & Repayment Schedule
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
                                    <TableCell align="right">Paid Amount</TableCell>
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
        </Container>
    );
}
