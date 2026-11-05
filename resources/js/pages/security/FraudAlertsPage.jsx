import React, { useState, useEffect } from 'react';
import {
    Container,
    Card,
    Typography,
    Box,
    Grid,
    Paper,
    CircularProgress,
    Chip,
    Alert,
    Button,
    Divider,
    Stack
} from '@mui/material';

import SecurityIcon from '@mui/icons-material/Security';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import api from '../../api/client';

export default function FraudAlertsPage() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadAlerts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/security-alerts');
            setAlerts(res.data.alerts || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();
    }, []);

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Fraud Monitoring & Anomaly Detection
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Heuristic analysis engine detecting velocity violations, credential brute-force, and high-risk movements.
                    </Typography>
                </Box>
                <Button variant="outlined" onClick={loadAlerts}>
                    Re-scan Alerts
                </Button>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
            ) : alerts.length === 0 ? (
                <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                    <CheckCircleOutlineIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                    <Typography variant="h5" fontWeight={700}>All Systems Normal</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        No suspicious transfer velocity, brute-force login patterns, or unauthorized activities detected.
                    </Typography>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {alerts.map((al, idx) => (
                        <Grid item xs={12} md={6} key={idx}>
                            <Card sx={{ p: 3, borderRadius: 3, borderLeft: (theme) => `6px solid ${al.severity === 'high' ? theme.palette.error.main : theme.palette.warning.main}` }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {al.severity === 'high' ? <ErrorOutlineIcon color="error" /> : <WarningAmberIcon color="warning" />}
                                        <Typography variant="h6" fontWeight={700}>
                                            {al.title}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        size="small"
                                        label={al.severity?.toUpperCase()}
                                        color={al.severity === 'high' ? 'error' : 'warning'}
                                        sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                                    />
                                </Box>

                                <Typography variant="body2" color="text.secondary" mb={2}>
                                    {al.description}
                                </Typography>

                                <Divider sx={{ my: 1.5 }} />

                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                        Target: {al.entity}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Flagged: {new Date(al.timestamp).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
}

