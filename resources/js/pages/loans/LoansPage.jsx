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
    Stack
} from '@mui/material';

import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';

import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function LoansPage() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const isStaff = user?.role === 'admin' || user?.role === 'officer';

    // Staff tab: 0 = All System Loans (Staff Directory), 1 = My Personal Loans
    const [staffTab, setStaffTab] = useState(0);

    // Status filter tab
    const [statusFilter, setStatusFilter] = useState('all');

    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState([]);

    // Application Modal
    const [applyOpen, setApplyOpen] = useState(false);
    const [receivingAccountId, setReceivingAccountId] = useState('');
    const [principalAmount, setPrincipalAmount] = useState('2000');
    const [termMonths, setTermMonths] = useState('6');
    const [purpose, setPurpose] = useState('');
    const [docFile, setDocFile] = useState(null);
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Repay Modal
    const [repayLoan, setRepayLoan] = useState(null);
    const [repayAmount, setRepayAmount] = useState('');
    const [repayError, setRepayError] = useState('');
    const [repaySuccess, setRepaySuccess] = useState('');

    // Schedule Viewer Modal
    const [viewLoan, setViewLoan] = useState(null);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    const showingAll = isStaff && staffTab === 0;

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
            // In case of client-side filtering needed for my-loans
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
        if (docFile) formData.append('document', docFile);

        try {
            await api.post('/loans/apply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setApplySuccess('Loan application submitted! Awaiting administrator approval.');
            await loadData();
            setTimeout(() => {
                setApplyOpen(false);
                setPurpose('');
                setApplySuccess('');
            }, 1200);
        } catch (err) {
            setApplyError(err.response?.data?.message || 'Failed to submit loan application.');
        } finally {
            setSubmitting(false);
        }
    };

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
            setTimeout(() => {
                setRepayLoan(null);
                setRepaySuccess('');
            }, 1200);
        } catch (err) {
            setRepayError(err.response?.data?.message || 'Repayment failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApproveLoan = async (id) => {
        if (!window.confirm('Approve this loan and disburse principal funds into student account?')) return;
        try {
            await api.post(`/loans/${id}/approve`);
            alert('Loan approved and funds disbursed successfully!');
            await loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Approval failed');
        }
    };

    const handleRejectLoan = async (id) => {
        const reason = prompt('Please enter reason for loan rejection:');
        if (!reason) return;
        try {
            await api.post(`/loans/${id}/reject`, { reason });
            alert('Loan rejected.');
            await loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        }
    };

    const handleViewSchedule = async (loanId) => {
        setScheduleLoading(true);
        try {
            const res = await api.get(`/loans/${loanId}`);
            setViewLoan(res.data.loan);
        } catch (err) {
            alert('Failed to load repayment schedule: ' + (err.response?.data?.message || err.message));
        } finally {
            setScheduleLoading(false);
        }
    };

    // Loan estimate calculation
    const calcPrincipal = parseFloat(principalAmount) || 0;
    const calcMonths = parseInt(termMonths) || 1;
    const estRate = 10.0;
    const estInterest = (calcPrincipal * (estRate / 100) * (calcMonths / 12));
    const estTotal = calcPrincipal + estInterest;
    const estMonthly = estTotal / calcMonths;

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        {showingAll ? 'Loan Portfolio Administration' : 'Simulated Loans & Credit Facilities'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {showingAll
                            ? 'Review student loan requests, evaluate credit risk, disburse funds, and monitor amortizations.'
                            : 'Request institutional credit facilities, monitor repayment schedules, and make repayments.'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { setApplyError(''); setApplySuccess(''); setApplyOpen(true); }}
                >
                    Apply for Loan
                </Button>
            </Box>

            {/* Staff Role Tabs (All System Loans vs My Personal Loans) */}
            {isStaff && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={staffTab} onChange={(e, val) => setStaffTab(val)}>
                        <Tab label="All Loan Applications (Staff Directory)" />
                        <Tab label="My Personal Loans" />
                    </Tabs>
                </Box>
            )}

            {/* Status Filter Chips / Tabs */}
            <Box mb={3} display="flex" gap={1} flexWrap="wrap">
                {[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Pending Approval', value: 'pending' },
                    { label: 'Active Facilities', value: 'active' },
                    { label: 'Paid / Completed', value: 'paid' },
                    { label: 'Rejected', value: 'rejected' },
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
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && loans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={showingAll ? 9 : 8} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : loans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={showingAll ? 9 : 8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
                                            <StatusBadge status={loan.status} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Button
                                                    size="small"
                                                    variant="text"
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

                                                {isStaff && loan.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="primary"
                                                            onClick={() => handleApproveLoan(loan.id)}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            onClick={() => handleRejectLoan(loan.id)}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
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

            {/* Apply Loan Modal */}
            <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight={700}>Apply for Simulated Loan Facility</DialogTitle>
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
                                    inputProps={{ min: "100", step: "50" }}
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
                                ESTIMATED REPAYMENT SCHEDULE PREVIEW (10.0% P.A.)
                            </Typography>
                            <Box display="flex" justifyContent="space-between" mt={1}>
                                <Typography variant="body2">Estimated Monthly Installment:</Typography>
                                <Typography variant="body2" fontWeight={800} color="primary">
                                    ${estMonthly.toFixed(2)} / month
                                </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2">Total Interest Payable:</Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    ${estInterest.toFixed(2)}
                                </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2">Total Repayable Amount:</Typography>
                                <Typography variant="body2" fontWeight={800}>
                                    ${estTotal.toFixed(2)}
                                </Typography>
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
                            placeholder="e.g. Funding simulated equipment purchase for ICT practical module"
                            required
                        />

                        <Box mt={2}>
                            <Button variant="outlined" component="label" size="small">
                                Upload Supporting Documentation (PDF / JPG)
                                <input type="file" hidden onChange={(e) => setDocFile(e.target.files[0])} />
                            </Button>
                            {docFile && (
                                <Typography variant="caption" sx={{ ml: 1, display: 'inline-block' }}>
                                    Selected: {docFile.name}
                                </Typography>
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

            {/* Repay Modal */}
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
                            inputProps={{ min: "0.01", max: repayLoan?.remaining_balance, step: "0.01" }}
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

            {/* Installment Schedules Viewer Modal */}
            <Dialog open={Boolean(viewLoan)} onClose={() => setViewLoan(null)} maxWidth="md" fullWidth>
                <DialogTitle fontWeight={700}>
                    Loan #{viewLoan?.id} — Amortization & Repayment Schedule
                </DialogTitle>
                <DialogContent dividers>
                    <Box display="flex" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
                        <Typography variant="body2">
                            Principal: <strong>${Number(viewLoan?.principal_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> | Total Obligation: <strong>${Number(viewLoan?.total_payable || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
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
