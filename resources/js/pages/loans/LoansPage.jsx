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

import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

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

    // Status filter chip
    const [statusFilter, setStatusFilter] = useState('all');

    const [loans, setLoans]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState([]);

    // ── Application Modal ─────────────────────────────────────────
    const [applyOpen, setApplyOpen]                   = useState(false);
    const [receivingAccountId, setReceivingAccountId] = useState('');
    const [principalAmount, setPrincipalAmount]       = useState('2000');
    const [termMonths, setTermMonths]                 = useState('6');
    const [purpose, setPurpose]                       = useState('');
    const [applyError, setApplyError]                 = useState('');
    const [applySuccess, setApplySuccess]             = useState('');
    const [submitting, setSubmitting]                 = useState(false);
    const [uploadedFiles, setUploadedFiles]           = useState([]); // [{file, type}]

    // ── Repay Modal ───────────────────────────────────────────────
    const [repayLoan, setRepayLoan]     = useState(null);
    const [repayAmount, setRepayAmount] = useState('');
    const [repayError, setRepayError]   = useState('');
    const [repaySuccess, setRepaySuccess] = useState('');

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

    // ── Load Personal Loans ───────────────────────────────────────
    const loadData = async () => {
        setLoading(true);
        try {
            const [loansRes, accRes] = await Promise.all([
                api.get('/my-loans'),
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
            console.error('Failed to load personal loans:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        loadData();
    }, [user, statusFilter]);

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
            setApplySuccess('Loan application submitted! It is now pending administrative review.');
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
            setRepaySuccess(`Repayment of $${repayAmount} successful! Remaining balance: $${res.data.remaining_loan_balance}.`);
            await loadData();
            setTimeout(() => { setRepayLoan(null); setRepaySuccess(''); }, 1200);
        } catch (err) {
            setRepayError(err.response?.data?.message || 'Repayment failed.');
        } finally {
            setSubmitting(false);
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
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800}>
                            My Loans & Credit Facilities
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Request personal loan facilities, upload verification documents, inspect amortization schedules, and make repayments.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { setApplyError(''); setApplySuccess(''); setUploadedFiles([]); setApplyOpen(true); }}
                >
                    Apply for a Loan
                </Button>
            </Box>

            {/* Status Filter Chips */}
            <Box mb={3} display="flex" gap={1} flexWrap="wrap">
                {[
                    { label: 'All My Loans',     value: 'all' },
                    { label: 'Pending Approval', value: 'pending' },
                    { label: 'Active Facilities', value: 'active' },
                    { label: 'Paid in Full',     value: 'paid' },
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
                                <TableCell>Disbursement Account</TableCell>
                                <TableCell align="right">Principal</TableCell>
                                <TableCell align="right">Total Obligation</TableCell>
                                <TableCell align="right">Remaining Balance</TableCell>
                                <TableCell>Term / Rate</TableCell>
                                <TableCell>Documents</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && loans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : loans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                                        <Typography variant="body1" fontWeight={600} color="text.secondary">
                                            No personal loan applications found.
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Need funding? Click "Apply for a Loan" to submit your application.
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            sx={{ mt: 2 }}
                                            onClick={() => { setApplyError(''); setApplySuccess(''); setUploadedFiles([]); setApplyOpen(true); }}
                                        >
                                            Submit First Application
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                loans.map((loan) => (
                                    <TableRow key={loan.id} hover sx={{ opacity: loading ? 0.7 : 1 }}>
                                        <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                                            #{loan.id}
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
                                                <Typography variant="caption" color="text.disabled">—</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={loan.status} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<ScheduleIcon />}
                                                    onClick={() => handleViewSchedule(loan.id)}
                                                >
                                                    Schedule
                                                </Button>

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
                            placeholder="e.g. Funding equipment purchase, working capital, agriculture..."
                            required
                        />

                        {/* Supporting Documents Upload */}
                        <Box mt={2}>
                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                Supporting Documents
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                Upload relevant verification documents (National ID, pay slips, business registration). PDF, JPG, PNG — max 5 MB each.
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
                SCHEDULE & REPAYMENT VIEWER MODAL
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

                    {viewLoan?.rejection_reason && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            <strong>Application Declined:</strong> {viewLoan.rejection_reason}
                        </Alert>
                    )}

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

                    {/* Submitted Documents for this loan */}
                    {(viewLoan?.loan_documents?.length > 0) && (
                        <Box mt={3}>
                            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" gutterBottom>
                                YOUR SUBMITTED SUPPORTING DOCUMENTS
                            </Typography>
                            <List dense sx={{ mt: 0.5 }}>
                                {viewLoan.loan_documents.map((doc) => (
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
                                                    View Document
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
                                            <InsertDriveFileIcon color="primary" sx={{ fontSize: 30 }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={<Typography fontWeight={700} variant="body2">{doc.document_type_label || doc.document_type}</Typography>}
                                            secondary={`${doc.original_name} ${doc.file_size ? '• ' + formatBytes(doc.file_size) : ''}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setViewLoan(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════════════════════════════════════════════════════
                IN-APP DOCUMENT VIEWER / READER MODAL
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
                <DialogActions sx={{ p: 1.5, justifyContent: 'flex-end' }}>
                    <Button variant="contained" onClick={() => setPreviewDoc(null)}>Close Document</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
