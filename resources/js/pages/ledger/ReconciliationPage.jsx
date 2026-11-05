import React, { useState, useEffect } from 'react';
import {
    Container,
    Card,
    Typography,
    Box,
    Button,
    Grid,
    TextField,
    Paper,
    CircularProgress,
    Alert,
    Divider,
    Stack
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import FactCheckIcon from '@mui/icons-material/FactCheck';

import api from '../../api/client';

export default function ReconciliationPage() {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reconcile, setReconcile] = useState(null);
    const [loading, setLoading] = useState(true);

    const runReconciliation = async () => {
        setLoading(true);
        try {
            const res = await api.get('/ledger/reconciliation', {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                }
            });
            setReconcile(res.data.reconciliation);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runReconciliation();
    }, []);

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Double-Entry Ledger Reconciliation
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Audit verification console ensuring Total Debits equal Total Credits across all posted financial transactions.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={runReconciliation}
                    disabled={loading}
                >
                    Run Verification
                </Button>
            </Box>

            {/* Date Filters Card */}
            <Card sx={{ p: 2, mb: 4, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        size="small"
                        label="From Date"
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        size="small"
                        label="To Date"
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Button variant="outlined" onClick={runReconciliation}>
                        Filter Period
                    </Button>
                </Stack>
            </Card>

            {loading ? (
                <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
                </Box>
            ) : reconcile ? (
                <Grid container spacing={3}>
                    {/* Status Banner */}
                    <Grid item xs={12}>
                        <Paper
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                borderRadius: 3,
                                bgcolor: reconcile.is_balanced ? 'success.main' : 'error.main',
                                color: '#ffffff',
                            }}
                        >
                            {reconcile.is_balanced ? (
                                <>
                                    <CheckCircleIcon sx={{ fontSize: 64, mb: 1 }} />
                                    <Typography variant="h4" fontWeight={800}>
                                        DOUBLE-ENTRY LEDGER IS BALANCED
                                    </Typography>
                                    <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                                        Total Debits strictly equal Total Credits. Zero discrepancy detected.
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <ErrorOutlineIcon sx={{ fontSize: 64, mb: 1 }} />
                                    <Typography variant="h4" fontWeight={800}>
                                        UNBALANCED LEDGER DISCREPANCY DETECTED
                                    </Typography>
                                    <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                                        Discrepancy of ${reconcile.difference}. Unbalanced transactions found: {reconcile.unbalanced_transaction_ids?.join(', ')}
                                    </Typography>
                                </>
                            )}
                        </Paper>
                    </Grid>

                    {/* Breakdown Cards */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                            <Typography variant="overline" color="text.secondary">
                                Cumulative Debits
                            </Typography>
                            <Typography variant="h3" fontWeight={800} color="error.main" sx={{ my: 1 }}>
                                ${Number(reconcile.total_debits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Across {reconcile.total_entries} ledger postings
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                            <Typography variant="overline" color="text.secondary">
                                Cumulative Credits
                            </Typography>
                            <Typography variant="h3" fontWeight={800} color="success.main" sx={{ my: 1 }}>
                                ${Number(reconcile.total_credits).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Across {reconcile.total_entries} ledger postings
                            </Typography>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
                            <Typography variant="overline" color="text.secondary">
                                Variance / Difference
                            </Typography>
                            <Typography variant="h3" fontWeight={800} color={reconcile.difference === 0 ? 'text.primary' : 'error.main'} sx={{ my: 1 }}>
                                ${Number(reconcile.difference).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Verified: {new Date(reconcile.reconciled_at).toLocaleString()}
                            </Typography>
                        </Card>
                    </Grid>
                </Grid>
            ) : null}
        </Container>
    );
}

