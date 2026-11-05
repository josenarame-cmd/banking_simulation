import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (user.role === 'instructor') {
                navigate('/instructor/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
            <Card sx={{ width: '100%', p: { xs: 2, md: 3 }, borderRadius: 3 }}>
                <CardContent>
                    <Box textAlign="center" mb={3}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                p: 1.5,
                                borderRadius: 3,
                                bgcolor: 'primary.main',
                                color: 'white',
                                mb: 1.5
                            }}
                        >
                            <AccountBalanceIcon sx={{ fontSize: 36 }} />
                        </Box>
                        <Typography variant="h5" fontWeight={800}>
                            ApexCore Online Banking
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to access your digital banking portal
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2, py: 1.3, fontWeight: 700 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button>
                    </form>

                    <Box textAlign="center" mt={2}>
                        <Typography variant="body2" color="text.secondary">
                            Don't have an account?{' '}
                            <RouterLink to="/register" style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                                Register for Free
                            </RouterLink>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}
