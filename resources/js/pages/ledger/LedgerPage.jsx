import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Card,
    Typography,
    Box,
    Button,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Stack,
    Pagination,
    Chip,
    LinearProgress
} from '@mui/material';

import FactCheckIcon from '@mui/icons-material/FactCheck';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import StatusBadge from '../../components/StatusBadge';
import api, { downloadCsv } from '../../api/client';

export default function LedgerPage() {
    const navigate = useNavigate();

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entryType, setEntryType] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            await downloadCsv('/reports/export/ledger', `general-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
        } catch (err) {
            alert('Failed to export CSV: ' + (err.response?.data?.message || err.message));
        } finally {
            setExporting(false);
        }
    };

    const loadEntries = async () => {
        setLoading(true);
        try {
            const res = await api.get('/ledger', {
                params: {
                    entry_type: entryType,
                    from_date: fromDate,
                    to_date: toDate,
                    page,
                }
            });
            setEntries(res.data.data || []);
            setTotalPages(res.data.last_page || 1);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEntries();
    }, [entryType, fromDate, toDate, page]);

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Central Double-Entry General Ledger
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Immutable financial records. Every transaction maintains: Total Debits = Total Credits.
                    </Typography>
                </Box>
                <Box display="flex" gap={1.5}>
                    <Button
                        variant="outlined"
                        startIcon={<FactCheckIcon />}
                        onClick={() => navigate('/reconciliation')}
                    >
                        Verify Ledger Integrity
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <FileDownloadIcon />}
                        onClick={handleExport}
                        disabled={exporting}
                    >
                        Export Ledger CSV
                    </Button>
                </Box>
            </Box>

            {/* Filters */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        select
                        size="small"
                        label="Entry Type"
                        value={entryType}
                        onChange={(e) => { setEntryType(e.target.value); setPage(1); }}
                        sx={{ minWidth: 160 }}
                    >
                        <MenuItem value="">All Entries</MenuItem>
                        <MenuItem value="debit">Debits Only</MenuItem>
                        <MenuItem value="credit">Credits Only</MenuItem>
                    </TextField>
                    <TextField
                        size="small"
                        label="From Date"
                        type="date"
                        value={fromDate}
                        onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        size="small"
                        label="To Date"
                        type="date"
                        value={toDate}
                        onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>
            </Card>

            {/* General Ledger Table */}
            <Card sx={{ borderRadius: 3, position: 'relative' }}>
                {loading && (
                    <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} />
                )}
                <TableContainer component={Paper} elevation={0}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Entry ID</TableCell>
                                <TableCell>Tx Reference</TableCell>
                                <TableCell>Account Target</TableCell>
                                <TableCell>Entry Type</TableCell>
                                <TableCell align="right">Debit (-)</TableCell>
                                <TableCell align="right">Credit (+)</TableCell>
                                <TableCell align="right">Balance After</TableCell>
                                <TableCell>Timestamp</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No ledger entries found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((e) => (
                                    <TableRow key={e.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>#{e.id}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                            {e.transaction?.reference || '—'}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>
                                            {e.account ? `${e.account.account_number} (${e.account.user?.name || ''})` : 'CLEARING / VAULT'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={e.entry_type?.toUpperCase()}
                                                color={e.entry_type === 'debit' ? 'error' : 'success'}
                                                sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                                            />
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: e.debit > 0 ? 800 : 400 }}>
                                            {e.debit > 0 ? `$${Number(e.debit).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: e.credit > 0 ? 800 : 400 }}>
                                            {e.credit > 0 ? `$${Number(e.credit).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                                        </TableCell>
                                        <TableCell align="right" fontWeight={700}>
                                            ${Number(e.balance_after).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.82rem' }}>
                                            {new Date(e.created_at).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {totalPages > 1 && (
                    <Box display="flex" justifyContent="center" p={2}>
                        <Pagination count={totalPages} page={page} onChange={(e, val) => setPage(val)} color="primary" />
                    </Box>
                )}
            </Card>
        </Container>
    );
}

