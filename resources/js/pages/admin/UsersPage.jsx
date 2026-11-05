import React, { useState, useEffect } from 'react';
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
    IconButton,
    LinearProgress
} from '@mui/material';

import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import StatusBadge from '../../components/StatusBadge';
import api from '../../api/client';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users', {
                params: {
                    search: debouncedSearch,
                    role: roleFilter,
                    status: statusFilter,
                    page,
                }
            });
            setUsers(res.data.data || []);
            setTotalPages(res.data.last_page || 1);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [debouncedSearch, roleFilter, statusFilter, page]);

    const handleUpdateStatus = async (userId, newStatus) => {
        const reason = prompt(`Reason for setting status to ${newStatus}:`);
        if (reason === null) return;
        try {
            await api.put(`/users/${userId}/status`, { status: newStatus, reason });
            loadUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update user status');
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box mb={4}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    Platform User & Learner Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Inspect user profiles, manage authorization privileges, and enforce account suspensions.
                </Typography>
            </Box>

            {/* Filters */}
            <Card sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        size="small"
                        label="Search User Name or Email"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        sx={{ minWidth: 260 }}
                    />
                    <TextField
                        select
                        size="small"
                        label="Role"
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="">All Roles</MenuItem>
                        <MenuItem value="admin">Administrator</MenuItem>
                        <MenuItem value="instructor">Instructor</MenuItem>
                        <MenuItem value="user">Student User</MenuItem>
                    </TextField>
                    <TextField
                        select
                        size="small"
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="suspended">Suspended</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                    </TextField>
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
                                <TableCell>ID</TableCell>
                                <TableCell>Full Name</TableCell>
                                <TableCell>Email Address</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell align="center">Accounts</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No users found matching criteria.
                                    </TableCell>
                                </TableRow>
                            ) : users.map((u) => (
                                <TableRow key={u.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>#{u.id}</TableCell>
                                    <TableCell fontWeight={700}>{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>{u.phone || '—'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={u.role?.toUpperCase()}
                                            color={u.role === 'admin' ? 'primary' : u.role === 'instructor' ? 'secondary' : 'default'}
                                            sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip label={u.accounts?.length || 0} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={u.status} />
                                    </TableCell>
                                    <TableCell align="center">
                                        {u.status === 'active' ? (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                startIcon={<BlockIcon />}
                                                onClick={() => handleUpdateStatus(u.id, 'suspended')}
                                                sx={{ py: 0.3, px: 1, fontSize: '0.72rem' }}
                                            >
                                                Suspend
                                            </Button>
                                        ) : (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="success"
                                                startIcon={<CheckCircleIcon />}
                                                onClick={() => handleUpdateStatus(u.id, 'active')}
                                                sx={{ py: 0.3, px: 1, fontSize: '0.72rem' }}
                                            >
                                                Activate
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
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

