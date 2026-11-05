import React, { useState, useEffect } from 'react';
import {
    Container,
    Card,
    Typography,
    Box,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    LinearProgress,
    Stack,
    Pagination,
    Chip
} from '@mui/material';

import api from '../../api/client';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState('');
    const [debouncedAction, setDebouncedAction] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce action filter
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedAction(action), 300);
        return () => clearTimeout(timer);
    }, [action]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/audit-logs', {
                params: {
                    action: debouncedAction,
                    from_date: fromDate,
                    to_date: toDate,
                    page,
                }
            });
            setLogs(res.data.data || []);
            setTotalPages(res.data.last_page || 1);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [debouncedAction, fromDate, toDate, page]);

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box mb={4}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    System Security & Audit Trail
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Immutable event log capturing authentication attempts, financial ledger mutations, and administrative overrides.
                </Typography>
            </Box>

            {/* Filter Bar */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        size="small"
                        label="Filter Action"
                        value={action}
                        onChange={(e) => { setAction(e.target.value); setPage(1); }}
                        placeholder="e.g. TRANSFER, DEPOSIT, LOGIN"
                        sx={{ minWidth: 240 }}
                    />
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

            <Card sx={{ borderRadius: 3, position: 'relative' }}>
                {loading && (
                    <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }} />
                )}
                <TableContainer component={Paper} elevation={0}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Log ID</TableCell>
                                <TableCell>Action</TableCell>
                                <TableCell>Actor</TableCell>
                                <TableCell>Target Entity</TableCell>
                                <TableCell>IP Address</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Timestamp</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No audit records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id} hover>
                                        <TableCell sx={{ fontWeight: 600 }}>#{log.id}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={log.action}
                                                color={log.action.includes('REJECT') || log.action.includes('FAIL') ? 'error' : 'primary'}
                                                sx={{ fontWeight: 700, fontSize: '0.68rem' }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            {log.user?.name || 'System / Unauth'}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.82rem' }}>
                                            {log.entity_type ? `${log.entity_type} #${log.entity_id || ''}` : '—'}
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                            {log.ip_address}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 300, fontSize: '0.85rem' }}>
                                            {log.description}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                            {new Date(log.created_at).toLocaleString()}
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

