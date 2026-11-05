import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    Box,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        role: 'customer',
        address: '',
        date_of_birth: '',
        identification_number: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const user = await register(formData);
            if (user.role === 'admin') navigate('/admin/dashboard');
            else if (user.role === 'officer') navigate('/instructor/dashboard');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
            <Card sx={{ width: '100%', p: { xs: 2, md: 4 }, borderRadius: 3 }}>
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
                            Open a Simulated Banking Account
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create your digital profile. Includes a complimentary $1,000 checking account bonus!
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Full Legal Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email Address"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+250 788 000 000"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="role-select-label">Account Role</InputLabel>
                                    <Select
                                        labelId="role-select-label"
                                        name="role"
                                        value={formData.role}
                                        label="Account Role"
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="customer">Banking Customer</MenuItem>
                                        <MenuItem value="officer">Compliance Officer</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="National ID / Passport No."
                                    name="identification_number"
                                    value={formData.identification_number}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Date of Birth"
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Residential Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Password (min 8 characters)"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Confirm Password"
                                    type="password"
                                    name="password_confirmation"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                        </Grid>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2, py: 1.3, fontWeight: 700 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                        </Button>
                    </form>

                    <Box textAlign="center" mt={2}>
                        <Typography variant="body2" color="text.secondary">
                            Already registered?{' '}
                            <RouterLink to="/login" style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
                                Sign in here
                            </RouterLink>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}

