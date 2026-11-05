import React, { useState } from 'react';
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
    Avatar,
    Divider,
    CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function Profile() {
    const { user, refreshUser } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.profile?.address || '');
    const [idNumber, setIdNumber] = useState(user?.profile?.identification_number || '');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');

    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        setLoading(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('phone', phone);
        formData.append('address', address);
        formData.append('identification_number', idNumber);
        if (avatarFile) {
            formData.append('profile_picture', avatarFile);
        }

        try {
            await api.post('/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfileSuccess('Profile information updated successfully!');
            await refreshUser();
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== newPasswordConfirmation) {
            setPasswordError('New passwords do not match.');
            return;
        }

        try {
            await api.post('/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: newPasswordConfirmation,
            });
            setPasswordSuccess('Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setNewPasswordConfirmation('');
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to update password.');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>
                User Profile & Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
                Manage your credentials, simulated identification, and security settings
            </Typography>

            <Grid container spacing={3}>
                {/* Profile Information */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <PersonIcon color="primary" />
                                <Typography variant="h6" fontWeight={700}>Personal Details</Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            {profileSuccess && <Alert severity="success" sx={{ mb: 2 }}>{profileSuccess}</Alert>}
                            {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}

                            <form onSubmit={handleProfileSubmit}>
                                <Box display="flex" alignItems="center" gap={2} mb={3}>
                                    <Avatar
                                        src={avatarPreview || (user?.profile?.profile_picture ? `/storage/${user.profile.profile_picture}` : '')}
                                        sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: '1.75rem' }}
                                    >
                                        {user?.name?.charAt(0)}
                                    </Avatar>
                                    <Button variant="outlined" component="label" size="small">
                                        Upload Avatar
                                        <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                                    </Button>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Full Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Email (Read-only)"
                                            value={user?.email || ''}
                                            disabled
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Phone"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="ID / Passport Number"
                                            value={idNumber}
                                            onChange={(e) => setIdNumber(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Address"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                        />
                                    </Grid>
                                </Grid>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    sx={{ mt: 3, fontWeight: 700 }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Password Change */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <LockResetIcon color="primary" />
                                <Typography variant="h6" fontWeight={700}>Change Password</Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>}
                            {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}

                            <form onSubmit={handlePasswordSubmit}>
                                <TextField
                                    fullWidth
                                    label="Current Password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    margin="normal"
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="New Password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    margin="normal"
                                    required
                                />
                                <TextField
                                    fullWidth
                                    label="Confirm New Password"
                                    type="password"
                                    value={newPasswordConfirmation}
                                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                    margin="normal"
                                    required
                                />
                                <Button
                                    type="submit"
                                    variant="outlined"
                                    color="primary"
                                    sx={{ mt: 2, fontWeight: 700 }}
                                >
                                    Update Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}

