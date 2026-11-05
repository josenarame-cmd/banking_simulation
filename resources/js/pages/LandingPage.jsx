import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Card,
    Stack,
    Chip,
    Paper,
    Slider,
    Divider,
    IconButton,
    useTheme,
    Avatar,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';

// Icons
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SecurityIcon from '@mui/icons-material/Security';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import SpeedIcon from '@mui/icons-material/Speed';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ContactlessIcon from '@mui/icons-material/Contactless';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShieldCheckIcon from '@mui/icons-material/GppGood';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';

export default function LandingPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { user, login } = useAuth();
    const { toggleColorMode } = useColorMode();
    const navigate = useNavigate();

    // Interactive Calculator State
    const [calcType, setCalcType] = useState('loan'); // 'loan' or 'savings'
    const [calcPrincipal, setCalcPrincipal] = useState(10000);
    const [calcMonths, setCalcMonths] = useState(12);
    const [calcRate, setCalcRate] = useState(8.5);

    // Savings compound calc
    const [savingsDeposit, setSavingsDeposit] = useState(5000);
    const [savingsMonthly, setSavingsMonthly] = useState(300);
    const [savingsYears, setSavingsYears] = useState(3);
    const [savingsApy] = useState(5.5);

    // Loan calculations
    const calcInterest = (calcPrincipal * (calcRate / 100) * (calcMonths / 12));
    const calcTotal = calcPrincipal + calcInterest;
    const calcMonthlyPayment = calcTotal / calcMonths;

    // Savings calculation
    const totalMonthsSavings = savingsYears * 12;
    const monthlyRate = (savingsApy / 100) / 12;
    let savingsFutureVal = savingsDeposit * Math.pow(1 + monthlyRate, totalMonthsSavings);
    for (let i = 1; i <= totalMonthsSavings; i++) {
        savingsFutureVal += savingsMonthly * Math.pow(1 + monthlyRate, totalMonthsSavings - i);
    }
    const totalContributed = savingsDeposit + (savingsMonthly * totalMonthsSavings);
    const totalEarnedInterest = Math.max(0, savingsFutureVal - totalContributed);

    // Active card tab preview
    const [activeCardType, setActiveCardType] = useState('checking');

    // Quick demo login trigger
    const handleQuickLogin = async (email, password) => {
        try {
            const loggedInUser = await login(email, password);
            if (loggedInUser.role === 'admin') navigate('/admin/dashboard');
            else if (loggedInUser.role === 'officer') navigate('/instructor/dashboard');
            else navigate('/dashboard');
        } catch (err) {
            navigate('/login');
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', overflowX: 'hidden' }}>
            
            {/* Top Security & Announcement Ticker Bar */}
            <Box
                sx={{
                    bgcolor: isDark ? '#020617' : '#0f172a',
                    color: '#94a3b8',
                    py: 0.8,
                    fontSize: '0.75rem',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Container maxWidth="xl">
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box display="flex" alignItems="center" gap={0.8}>
                                <ShieldCheckIcon sx={{ fontSize: 16, color: '#10b981' }} />
                                <Typography variant="caption" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                                    256-Bit SSL Encryption & Idempotent Transactions
                                </Typography>
                            </Box>
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.8 }}>
                                <span className="status-pulse" />
                                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                                    Settlement Engine: ONLINE
                                </Typography>
                            </Box>
                        </Stack>

                        <Stack direction="row" spacing={2.5} alignItems="center">
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <LockOutlinedIcon sx={{ fontSize: 14, color: '#38bdf8' }} />
                                <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 700 }}>
                                    Multi-Factor Protected
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Container>
            </Box>

            {/* Main Header / Navigation Bar */}
            <Box
                component="header"
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1100,
                    backdropFilter: 'blur(16px)',
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                    borderBottom: 1,
                    borderColor: 'divider',
                    py: 1.5,
                }}
            >
                <Container maxWidth="xl">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={1.5} component={RouterLink} to="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, boxShadow: '0 0 20px rgba(2, 132, 199, 0.45)' }}>
                                <AccountBalanceIcon />
                            </Avatar>
                            <Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="h6" fontWeight={900} letterSpacing="-0.02em" sx={{ lineHeight: 1 }}>
                                        Apex<span style={{ color: '#0284c7' }}>Core</span>
                                    </Typography>
                                    <Chip label="v2.5" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'primary.main', color: '#fff' }} />
                                </Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5}>
                                    Online Banking System
                                </Typography>
                            </Box>
                        </Box>

                        {/* Navigation Links */}
                        <Stack direction="row" spacing={3} alignItems="center" sx={{ display: { xs: 'none', lg: 'flex' } }}>
                            <Typography component="a" href="#services" variant="body2" fontWeight={600} sx={{ textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                Services
                            </Typography>
                            <Typography component="a" href="#architecture" variant="body2" fontWeight={600} sx={{ textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                How It Works
                            </Typography>
                            <Typography component="a" href="#rates" variant="body2" fontWeight={600} sx={{ textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                Rates
                            </Typography>
                            <Typography component="a" href="#calculator" variant="body2" fontWeight={600} sx={{ textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                Calculators
                            </Typography>
                            <Typography component="a" href="#security" variant="body2" fontWeight={600} sx={{ textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                Security
                            </Typography>
                            <Typography component="a" href="#faq" variant="body2" fontWeight={600} sx={{ textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                FAQ
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <IconButton onClick={toggleColorMode} color="inherit" size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                                {isDark ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
                            </IconButton>

                            <Button
                                variant="outlined"
                                component={RouterLink}
                                to="/login"
                                sx={{ fontWeight: 600, borderRadius: 2, px: 2 }}
                            >
                                Log In
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                component={RouterLink}
                                to="/register"
                                sx={{ fontWeight: 700, borderRadius: 2, px: 2.2, boxShadow: '0 4px 14px 0 rgba(2, 132, 199, 0.35)' }}
                            >
                                Register
                            </Button>
                        </Stack>
                    </Box>
                </Container>
            </Box>

            {/* Hero Section */}
            <Box
                className="cinematic-bg"
                sx={{
                    pt: { xs: 6, md: 9 },
                    pb: { xs: 8, md: 11 },
                    position: 'relative',
                    borderBottom: 1,
                    borderColor: 'divider',
                    overflow: 'hidden',
                }}
            >
                {/* Cinematic Full-Bleed Moving Background Photo */}
                <Box
                    component="img"
                    className="cinematic-photo-zoom"
                    src="https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&w=2000&q=80"
                    alt="Institutional Bank Architecture"
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 40%',
                        opacity: isDark ? 0.28 : 0.18,
                        pointerEvents: 'none',
                        zIndex: 0,
                        filter: isDark ? 'brightness(0.7) contrast(1.15)' : 'saturate(0.9) brightness(1.05)',
                    }}
                />

                {/* Soft Gradient Mask for Perfect Text Legibility */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background: isDark
                            ? 'radial-gradient(circle at 25% 40%, rgba(15, 23, 42, 0.94) 0%, rgba(15, 23, 42, 0.88) 60%, rgba(15, 23, 42, 0.96) 100%)'
                            : 'radial-gradient(circle at 25% 40%, rgba(255, 255, 255, 0.93) 0%, rgba(248, 250, 252, 0.85) 60%, rgba(241, 245, 249, 0.94) 100%)',
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                />

                {/* Ambient Cinematic Moving Glow Orbs */}
                <Box
                    className="cinematic-glow-orb"
                    sx={{
                        width: 480,
                        height: 480,
                        background: 'radial-gradient(circle, rgba(2, 132, 199, 0.28) 0%, transparent 70%)',
                        top: -120,
                        left: -100,
                    }}
                />
                <Box
                    className="cinematic-glow-orb"
                    sx={{
                        width: 520,
                        height: 520,
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)',
                        bottom: -150,
                        right: -80,
                        animationDelay: '-3.5s',
                    }}
                />
                <Box
                    className="cinematic-glow-orb"
                    sx={{
                        width: 320,
                        height: 320,
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
                        top: '40%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        animationDelay: '-5s',
                    }}
                />

                <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={5} alignItems="center">
                        <Grid item xs={12} lg={7}>
                            <Box mb={2}>
                                <Chip
                                    icon={<ShieldCheckIcon fontSize="small" />}
                                    label="SECURE DIGITAL BANKING"
                                    color="primary"
                                    variant="outlined"
                                    sx={{
                                        fontWeight: 700,
                                        fontSize: '0.72rem',
                                        letterSpacing: 0.6,
                                        bgcolor: isDark ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.06)',
                                    }}
                                />
                            </Box>

                            <Typography
                                component="h1"
                                sx={{
                                    fontSize: { xs: '1.9rem', sm: '2.4rem', md: '2.8rem' },
                                    fontWeight: 800,
                                    lineHeight: 1.2,
                                    letterSpacing: '-0.025em',
                                    mb: 2,
                                }}
                            >
                                Next-Gen Core Banking &{' '}
                                <span className="gradient-text">Real-Time Ledger</span> Settlement
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: { xs: '0.92rem', sm: '0.98rem' },
                                    color: 'text.secondary',
                                    fontWeight: 400,
                                    lineHeight: 1.65,
                                    mb: 3.5,
                                    maxWidth: 580,
                                }}
                            >
                                Experience institutional banking operations built on strict international financial standards: balanced double-entry accounting, real-time peer-to-peer transfers, interest accrual simulations, automated scheduled settlements, and multi-factor transaction approvals.
                            </Typography>

                            {/* Trust Badge Indicators */}
                            <Stack direction="row" spacing={2.5} mb={3.5} flexWrap="wrap" gap={1}>
                                <Box display="flex" alignItems="center" gap={0.8}>
                                    <CheckCircleIcon color="success" sx={{ fontSize: 18 }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Zero Discrepancy Books</Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={0.8}>
                                    <CheckCircleIcon color="success" sx={{ fontSize: 18 }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Idempotent Transfers</Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={0.8}>
                                    <CheckCircleIcon color="success" sx={{ fontSize: 18 }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Automated Loan Amortization</Typography>
                                </Box>
                            </Stack>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.8} mb={4}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="medium"
                                    endIcon={<ArrowForwardIcon />}
                                    component={RouterLink}
                                    to="/register"
                                    sx={{
                                        py: 1.4,
                                        px: 3.2,
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        borderRadius: 2.2,
                                        boxShadow: '0 6px 20px rgba(2, 132, 199, 0.35)',
                                    }}
                                >
                                    Open Account in 2 Minutes
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="medium"
                                    component="a"
                                    href="#calculator"
                                    sx={{
                                        py: 1.4,
                                        px: 2.8,
                                        fontSize: '0.92rem',
                                        fontWeight: 600,
                                        borderRadius: 2.2,
                                    }}
                                >
                                    Financial Calculator
                                </Button>
                            </Stack>

                            {/* Quick Role Simulator Box */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2.5,
                                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.7)',
                                    border: '1px dashed',
                                    borderColor: 'primary.main',
                                    maxWidth: 580,
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <PlayArrowIcon color="primary" fontSize="small" />
                                    <Typography variant="caption" fontWeight={800} color="primary.main" letterSpacing={0.4}>
                                        INSTANT DEMO PROFILES (CLICK TO PREVIEW):
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.8}>
                                    <Chip
                                        avatar={<Avatar sx={{ bgcolor: '#0284c7', color: '#fff' }}>A</Avatar>}
                                        label="System Administrator (Jose Narame)"
                                        clickable
                                        color="primary"
                                        variant="filled"
                                        onClick={() => handleQuickLogin('josenarame@gmail.com', 'password123')}
                                        sx={{ fontWeight: 700, fontSize: '0.78rem' }}
                                    />
                                    <Chip
                                        avatar={<Avatar sx={{ bgcolor: '#10b981', color: '#fff' }}>O</Avatar>}
                                        label="Compliance Officer (Cyprien Safari)"
                                        clickable
                                        color="success"
                                        variant="filled"
                                        onClick={() => handleQuickLogin('safaricyprien@gmail.com', 'password123')}
                                        sx={{ fontWeight: 700, fontSize: '0.78rem' }}
                                    />
                                    <Chip
                                        avatar={<Avatar sx={{ bgcolor: '#8b5cf6', color: '#fff' }}>C</Avatar>}
                                        label="Customer Account"
                                        clickable
                                        color="secondary"
                                        variant="filled"
                                        onClick={() => handleQuickLogin('james.carter@banking.com', 'password123')}
                                        sx={{ fontWeight: 700, fontSize: '0.78rem' }}
                                    />
                                </Stack>
                            </Paper>
                        </Grid>

                        {/* FinTech Card & Micro Ledger Simulator */}
                        <Grid item xs={12} lg={5}>
                            <Box sx={{ perspective: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {/* Account selector pills above card */}
                                <Stack direction="row" spacing={0.8} mb={1.8} sx={{ bgcolor: isDark ? '#1e293b' : '#e2e8f0', p: 0.5, borderRadius: 2.5 }}>
                                    <Button
                                        size="small"
                                        variant={activeCardType === 'checking' ? 'contained' : 'text'}
                                        onClick={() => setActiveCardType('checking')}
                                        sx={{ borderRadius: 2, fontSize: '0.72rem', fontWeight: 700 }}
                                    >
                                        Checking
                                    </Button>
                                    <Button
                                        size="small"
                                        variant={activeCardType === 'savings' ? 'contained' : 'text'}
                                        onClick={() => setActiveCardType('savings')}
                                        sx={{ borderRadius: 2, fontSize: '0.72rem', fontWeight: 700 }}
                                    >
                                        High-Yield
                                    </Button>
                                    <Button
                                        size="small"
                                        variant={activeCardType === 'fixed' ? 'contained' : 'text'}
                                        onClick={() => setActiveCardType('fixed')}
                                        sx={{ borderRadius: 2, fontSize: '0.72rem', fontWeight: 700 }}
                                    >
                                        Fixed Term
                                    </Button>
                                </Stack>

                                <Paper
                                    elevation={16}
                                    className="floating-hero-card shimmer-card"
                                    sx={{
                                        width: '100%',
                                        maxWidth: 420,
                                        height: 245,
                                        borderRadius: 3.5,
                                        p: 3,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        background: activeCardType === 'checking'
                                            ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0369a1 100%)'
                                            : activeCardType === 'savings'
                                                ? 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)'
                                                : 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)',
                                        color: '#ffffff',
                                        boxShadow: isDark
                                            ? '0 25px 60px -15px rgba(2, 132, 199, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
                                            : '0 25px 50px -12px rgba(30, 27, 75, 0.45)',
                                        border: '1px solid rgba(255, 255, 255, 0.22)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: -50,
                                            right: -50,
                                            width: 160,
                                            height: 160,
                                            borderRadius: '50%',
                                            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
                                            pointerEvents: 'none',
                                        }}
                                    />

                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="overline" fontWeight={900} letterSpacing={1.8} sx={{ opacity: 0.9, fontSize: '0.68rem' }}>
                                            {activeCardType === 'checking' ? 'PREMIER CHECKING DEBIT' : activeCardType === 'savings' ? 'GROWTH SAVINGS VAULT' : 'CERTIFICATE OF DEPOSIT'}
                                        </Typography>
                                        <ContactlessIcon sx={{ fontSize: 24, opacity: 0.85 }} />
                                    </Box>

                                    <Box display="flex" alignItems="center" justifyContent="space-between" my={0.5}>
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 34,
                                                borderRadius: 1.5,
                                                bgcolor: '#fbbf24',
                                                border: '1px solid rgba(0,0,0,0.2)',
                                                background: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)',
                                                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)',
                                            }}
                                        />
                                        <Box textAlign="right">
                                            <Typography variant="caption" sx={{ opacity: 0.75, display: 'block', fontSize: '0.65rem', letterSpacing: 0.5 }}>
                                                SETTLED BALANCE
                                            </Typography>
                                            <Typography variant="h5" fontWeight={900} letterSpacing={0.5}>
                                                {activeCardType === 'checking' ? '$75,450.00' : activeCardType === 'savings' ? '$120,800.50' : '$250,000.00'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Typography variant="body2" fontFamily="monospace" fontWeight={700} letterSpacing={2.5} sx={{ mb: 0.8, opacity: 0.95 }}>
                                            4242 •••• •••• {activeCardType === 'checking' ? '9958' : activeCardType === 'savings' ? '3819' : '7724'}
                                        </Typography>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-end">
                                            <Box>
                                                <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.7, letterSpacing: 0.8, display: 'block' }}>
                                                    ACCOUNT HOLDER
                                                </Typography>
                                                <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: '0.8rem', letterSpacing: 0.5 }}>
                                                    PREMIER CLIENT
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" fontWeight={700} letterSpacing={0.8} sx={{ opacity: 0.85, fontSize: '0.72rem' }}>
                                                EXP 11/29
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>

                                {/* Micro Transaction Stream Simulation Box */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        width: '100%',
                                        maxWidth: 420,
                                        mt: 2,
                                        p: 1.8,
                                        borderRadius: 2.5,
                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff',
                                    }}
                                >
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.2}>
                                        <Typography variant="caption" fontWeight={800} color="text.secondary" letterSpacing={0.5}>
                                            REAL-TIME JOURNAL STREAM
                                        </Typography>
                                        <Chip label="Live Feed" size="small" color="success" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                                    </Box>

                                    <Stack spacing={1}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark', width: 26, height: 26 }}>
                                                    <ArrowDownwardIcon sx={{ fontSize: 15 }} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" fontWeight={700} display="block">Direct Inflow</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>TXN-98432 • Settled</Typography>
                                                </Box>
                                            </Box>
                                            <Typography variant="body2" fontWeight={800} color="success.main">+$4,500.00</Typography>
                                        </Box>

                                        <Divider />

                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', width: 26, height: 26 }}>
                                                    <SwapHorizIcon sx={{ fontSize: 15 }} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="caption" fontWeight={700} display="block">P2P Account Transfer</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>To: Acc #...847</Typography>
                                                </Box>
                                            </Box>
                                            <Typography variant="body2" fontWeight={800}>-$250.00</Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Live Financial Metrics Ticker */}
            <Box sx={{ bgcolor: isDark ? '#0b1120' : '#f1f5f9', py: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Container maxWidth="xl">
                    <Grid container spacing={2} textAlign="center">
                        <Grid item xs={6} md={3}>
                            <Typography variant="h5" fontWeight={900} color="primary.main">
                                100%
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                Double-Entry Balanced Books
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="h5" fontWeight={900} color="success.main">
                                &lt; 50ms
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                Instant Ledger Settlement
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="h5" fontWeight={900} color="secondary.main">
                                Idempotent
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                Zero Duplicate Charges
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <Typography variant="h5" fontWeight={900} color="warning.main">
                                Dual-Control
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                High-Value Approvals
                            </Typography>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Middle of Page: Cinematic Bank & Customer Life in Motion */}
            <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: isDark ? '#080e1a' : '#f1f5f9', borderTop: 1, borderBottom: 1, borderColor: 'divider', position: 'relative', overflow: 'hidden' }}>
                <Container maxWidth="xl">
                    <Box textAlign="center" mb={6} maxWidth={720} mx="auto">
                        <Chip
                            icon={<span className="status-pulse" style={{ marginRight: 4 }} />}
                            label="REAL-WORLD BANKING IN MOTION"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.8, mb: 1.5 }}
                        />
                        <Typography variant="h4" fontWeight={900} gutterBottom letterSpacing="-0.02em" sx={{ fontSize: { xs: '1.7rem', md: '2.2rem' } }}>
                            Serving Real People & Modern Institutions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            From customer consultations in branch lounges to digital phone transfers and corporate vault towers.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {[
                            {
                                img: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=900&q=80',
                                title: 'Personal Client Advisory',
                                desc: 'One-on-one wealth management and private teller services.',
                                tag: 'Branch Operations',
                                status: 'Active Lounge',
                            },
                            {
                                img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=900&q=80',
                                title: 'Instant Mobile Banking',
                                desc: 'Customer executing real-time transfers with biometric validation.',
                                tag: 'Digital Experience',
                                status: '24/7 Transacting',
                            },
                            {
                                img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
                                title: 'Institutional Settlement Vault',
                                desc: 'Financial headquarters housing core ledgers and treasury reserves.',
                                tag: 'Headquarters',
                                status: 'Central Vault',
                            },
                        ].map((card, idx) => (
                            <Grid item xs={12} md={4} key={idx}>
                                <Paper
                                    elevation={8}
                                    sx={{
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        height: 310,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        boxShadow: isDark
                                            ? '0 20px 40px -15px rgba(0,0,0,0.7)'
                                            : '0 20px 40px -15px rgba(2, 132, 199, 0.25)',
                                        transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                                        '&:hover': {
                                            transform: 'translateY(-6px)',
                                            boxShadow: '0 25px 50px -12px rgba(2, 132, 199, 0.35)',
                                        },
                                    }}
                                >
                                    {/* Cinematic Pan & Zoom Image */}
                                    <Box
                                        component="img"
                                        className="cinematic-photo-zoom"
                                        src={card.img}
                                        alt={card.title}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block',
                                        }}
                                    />
                                    {/* Vignette Overlay & Typography */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.3) 60%, transparent 100%)',
                                            p: 3,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Chip
                                                label={card.tag}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(15, 23, 42, 0.75)',
                                                    backdropFilter: 'blur(10px)',
                                                    color: '#ffffff',
                                                    fontWeight: 700,
                                                    fontSize: '0.7rem',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                }}
                                            />
                                            <Chip
                                                label={card.status}
                                                size="small"
                                                color="primary"
                                                sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
                                            />
                                        </Box>

                                        <Box>
                                            <Typography variant="h6" fontWeight={900} color="#ffffff" sx={{ fontSize: '1.2rem', lineHeight: 1.25, mb: 0.5 }}>
                                                {card.title}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                                {card.desc}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Products & Banking Services Section */}
            <Box id="services" sx={{ py: { xs: 7, md: 9 } }}>
                <Container maxWidth="xl">
                    <Box textAlign="center" mb={6} maxWidth={720} mx="auto">
                        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={1.2}>
                            BANKING SOLUTIONS
                        </Typography>
                        <Typography variant="h4" fontWeight={900} gutterBottom letterSpacing="-0.02em" sx={{ fontSize: { xs: '1.6rem', md: '2.1rem' } }}>
                            Tailored For Modern Financial Life
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            From instant consumer payments to high-yield term instruments, our platform provides full commercial banking capabilities.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {[
                            {
                                icon: <AccountBalanceWalletIcon sx={{ fontSize: 30, color: '#0284c7' }} />,
                                title: 'Multi-Account Portfolio',
                                desc: 'Open and manage Checking, High-Yield Savings, and Fixed Deposit accounts with unique 10-digit account numbers and balances.',
                                badge: 'Instant Opening',
                            },
                            {
                                icon: <SwapHorizIcon sx={{ fontSize: 30, color: '#10b981' }} />,
                                title: 'Real-Time Interbank Transfers',
                                desc: 'Transfer funds domestically and internationally with instant validation, recipient account verification, and automated confirmation receipts.',
                                badge: 'Real-Time',
                            },
                            {
                                icon: <MonetizationOnIcon sx={{ fontSize: 30, color: '#8b5cf6' }} />,
                                title: 'Credit & Loan Engine',
                                desc: 'Complete loan lifecycle: online applications, instant credit scoring checks, administrative review workflows, and automated installment billing.',
                                badge: 'Flexible Terms',
                            },
                            {
                                icon: <TrendingUpIcon sx={{ fontSize: 30, color: '#f59e0b' }} />,
                                title: 'Automated Interest Calculation',
                                desc: 'Daily compounding and monthly interest accruals automatically calculated, posted, and verified by immutable ledger journal entries.',
                                badge: 'High Yield',
                            },
                            {
                                icon: <NotificationsActiveIcon sx={{ fontSize: 30, color: '#ef4444' }} />,
                                title: 'Scheduled & Recurring Transfers',
                                desc: 'Set up standing orders for bills, rent, or investments with automated retry mechanisms and real-time execution alerts.',
                                badge: 'Automated Cron',
                            },
                            {
                                icon: <ShieldCheckIcon sx={{ fontSize: 30, color: '#06b6d4' }} />,
                                title: 'Fraud Watchdog & Dual Controls',
                                desc: 'Transactions over $10,000 or abnormal velocity patterns automatically trigger administrative quarantine and approval checks.',
                                badge: 'Security Enforced',
                            },
                        ].map((item, idx) => (
                            <Grid item xs={12} sm={6} md={4} key={idx}>
                                <Card
                                    className="cinematic-card-glow"
                                    sx={{
                                        p: 3,
                                        height: '100%',
                                        borderRadius: 3,
                                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#ffffff',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                            <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(2, 132, 199, 0.08)' }}>
                                                {item.icon}
                                            </Box>
                                            <Chip label={item.badge} size="small" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                                        </Box>
                                        <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                                            {item.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                                            {item.desc}
                                        </Typography>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Live Banking Interest Rates Table */}
            <Box id="rates" sx={{ py: 7, bgcolor: isDark ? '#0b1120' : '#f8fafc', borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Container maxWidth="lg">
                    <Box textAlign="center" mb={5}>
                        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={1.2}>
                            TRANSPARENT VALUE
                        </Typography>
                        <Typography variant="h4" fontWeight={900} gutterBottom letterSpacing="-0.02em" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
                            Current Rates & Account Types
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Competitive interest rates backed by transparent fee structures and institutional guarantees.
                        </Typography>
                    </Box>

                    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                        <Grid container sx={{ p: 1.8, bgcolor: isDark ? '#1e293b' : '#e2e8f0', fontWeight: 800 }}>
                            <Grid item xs={4}><Typography variant="caption" fontWeight={800}>ACCOUNT PRODUCT</Typography></Grid>
                            <Grid item xs={4} textAlign="center"><Typography variant="caption" fontWeight={800}>ANNUAL YIELD (APY / APR)</Typography></Grid>
                            <Grid item xs={4} textAlign="right"><Typography variant="caption" fontWeight={800}>MINIMUM BALANCE</Typography></Grid>
                        </Grid>

                        {[
                            { name: 'Core Everyday Checking', desc: 'No monthly maintenance fee with e-Statements', rate: '0.15% APY', min: '$0.00', highlight: false },
                            { name: 'High-Yield Apex Savings', desc: 'Daily compounding interest paid monthly', rate: '4.85% APY', min: '$500.00', highlight: true },
                            { name: '12-Month Fixed Deposit Certificate', desc: 'Guaranteed fixed returns with term lock protection', rate: '5.25% APY', min: '$1,000.00', highlight: false },
                            { name: 'Personal Credit Facility', desc: 'Pre-approved loan lines for personal investment', rate: '7.50% APR', min: 'N/A', highlight: false },
                            { name: 'Institutional Commercial Loan', desc: 'Flexible amortizations up to 36 months', rate: '9.00% APR', min: 'N/A', highlight: false },
                        ].map((rate, i) => (
                            <Box key={i}>
                                <Grid
                                    container
                                    alignItems="center"
                                    sx={{
                                        p: 2,
                                        bgcolor: rate.highlight ? (isDark ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.05)') : 'transparent',
                                        borderBottom: i < 4 ? '1px solid' : 'none',
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="body2" fontWeight={800}>{rate.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{rate.desc}</Typography>
                                    </Grid>
                                    <Grid item xs={6} sm={4} sx={{ textAlign: { xs: 'left', sm: 'center' }, mt: { xs: 1, sm: 0 } }}>
                                        <Chip
                                            label={rate.rate}
                                            color={rate.highlight ? 'primary' : 'default'}
                                            size="small"
                                            sx={{ fontWeight: 800, fontSize: '0.78rem' }}
                                        />
                                    </Grid>
                                    <Grid item xs={6} sm={4} sx={{ textAlign: 'right', mt: { xs: 1, sm: 0 } }}>
                                        <Typography variant="body2" fontWeight={700}>{rate.min}</Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                    </Paper>
                </Container>
            </Box>

            {/* Interactive Dual Simulator */}
            <Box id="calculator" sx={{ py: { xs: 7, md: 9 } }}>
                <Container maxWidth="lg">
                    <Box textAlign="center" mb={5}>
                        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={1.2}>
                            FINANCIAL TOOLS
                        </Typography>
                        <Typography variant="h4" fontWeight={900} gutterBottom letterSpacing="-0.02em" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
                            Interactive Banking Simulators
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Simulate loan repayments or calculate the power of compound interest before committing funds.
                        </Typography>

                        {/* Simulator Switch */}
                        <Stack direction="row" spacing={1.5} justifyContent="center" mt={2.5}>
                            <Button
                                size="small"
                                variant={calcType === 'loan' ? 'contained' : 'outlined'}
                                onClick={() => setCalcType('loan')}
                                sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
                            >
                                Loan Simulator
                            </Button>
                            <Button
                                size="small"
                                variant={calcType === 'savings' ? 'contained' : 'outlined'}
                                onClick={() => setCalcType('savings')}
                                sx={{ borderRadius: 2, fontWeight: 700, px: 2.5 }}
                            >
                                Compound Savings
                            </Button>
                        </Stack>
                    </Box>

                    {calcType === 'loan' ? (
                        <Card sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3.5, boxShadow: '0 15px 35px -15px rgba(0,0,0,0.08)' }}>
                            <Grid container spacing={4} alignItems="center">
                                <Grid item xs={12} md={7}>
                                    <Box mb={3}>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="body2" fontWeight={700}>
                                                Requested Principal Amount
                                            </Typography>
                                            <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                                                ${calcPrincipal.toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Slider
                                            value={calcPrincipal}
                                            min={1000}
                                            max={50000}
                                            step={1000}
                                            onChange={(e, val) => setCalcPrincipal(val)}
                                            valueLabelDisplay="auto"
                                        />
                                    </Box>

                                    <Box mb={3}>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="body2" fontWeight={700}>
                                                Repayment Term
                                            </Typography>
                                            <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                                                {calcMonths} Months ({ (calcMonths / 12).toFixed(1) } Yrs)
                                            </Typography>
                                        </Box>
                                        <Slider
                                            value={calcMonths}
                                            min={6}
                                            max={36}
                                            step={6}
                                            onChange={(e, val) => setCalcMonths(val)}
                                            valueLabelDisplay="auto"
                                        />
                                    </Box>

                                    <Box>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="body2" fontWeight={700}>
                                                Configured Annual Interest Rate (APR)
                                            </Typography>
                                            <Typography variant="subtitle1" fontWeight={800} color="secondary.main">
                                                {calcRate}% P.A.
                                            </Typography>
                                        </Box>
                                        <Slider
                                            value={calcRate}
                                            min={3}
                                            max={20}
                                            step={0.5}
                                            onChange={(e, val) => setCalcRate(val)}
                                            valueLabelDisplay="auto"
                                            color="secondary"
                                        />
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={5}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                                            border: '2px solid',
                                            borderColor: 'primary.main',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.8}>
                                            ESTIMATED MONTHLY INSTALLMENT
                                        </Typography>
                                        <Typography variant="h4" fontWeight={900} color="primary.main" my={1}>
                                            ${calcMonthlyPayment.toFixed(2)}
                                            <Typography component="span" variant="caption" color="text.secondary">/mo</Typography>
                                        </Typography>

                                        <Divider sx={{ my: 1.5 }} />

                                        <Stack spacing={1} textAlign="left">
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="caption" color="text.secondary">Principal Borrowed:</Typography>
                                                <Typography variant="caption" fontWeight={700}>${calcPrincipal.toLocaleString()}</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="caption" color="text.secondary">Total Interest Charge:</Typography>
                                                <Typography variant="caption" fontWeight={700} color="warning.main">${calcInterest.toFixed(2)}</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="caption" color="text.secondary">Total Repayment Amount:</Typography>
                                                <Typography variant="caption" fontWeight={900}>${calcTotal.toFixed(2)}</Typography>
                                            </Box>
                                        </Stack>

                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            size="medium"
                                            onClick={() => navigate(user ? '/loans' : '/login')}
                                            sx={{ mt: 2.5, fontWeight: 700, borderRadius: 2 }}
                                        >
                                            Apply for This Loan →
                                        </Button>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Card>
                    ) : (
                        <Card sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3.5, boxShadow: '0 15px 35px -15px rgba(0,0,0,0.08)' }}>
                            <Grid container spacing={4} alignItems="center">
                                <Grid item xs={12} md={7}>
                                    <Box mb={3}>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="body2" fontWeight={700}>
                                                Initial Deposit
                                            </Typography>
                                            <Typography variant="subtitle1" fontWeight={800} color="success.main">
                                                ${savingsDeposit.toLocaleString()}
                                            </Typography>
                                        </Box>
                                        <Slider
                                            value={savingsDeposit}
                                            min={500}
                                            max={25000}
                                            step={500}
                                            onChange={(e, val) => setSavingsDeposit(val)}
                                            valueLabelDisplay="auto"
                                            color="success"
                                        />
                                    </Box>

                                    <Box mb={3}>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="body2" fontWeight={700}>
                                                Monthly Contribution
                                            </Typography>
                                            <Typography variant="subtitle1" fontWeight={800} color="success.main">
                                                ${savingsMonthly.toLocaleString()}/mo
                                            </Typography>
                                        </Box>
                                        <Slider
                                            value={savingsMonthly}
                                            min={50}
                                            max={2000}
                                            step={50}
                                            onChange={(e, val) => setSavingsMonthly(val)}
                                            valueLabelDisplay="auto"
                                            color="success"
                                        />
                                    </Box>

                                    <Box>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="body2" fontWeight={700}>
                                                Investment Horizon
                                            </Typography>
                                            <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                                                {savingsYears} Years ({savingsYears * 12} Months)
                                            </Typography>
                                        </Box>
                                        <Slider
                                            value={savingsYears}
                                            min={1}
                                            max={10}
                                            step={1}
                                            onChange={(e, val) => setSavingsYears(val)}
                                            valueLabelDisplay="auto"
                                        />
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={5}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                                            border: '2px solid',
                                            borderColor: 'success.main',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography variant="caption" fontWeight={700} color="text.secondary" letterSpacing={0.8}>
                                            PROJECTED FUTURE VALUE
                                        </Typography>
                                        <Typography variant="h4" fontWeight={900} color="success.main" my={1}>
                                            ${savingsFutureVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </Typography>

                                        <Divider sx={{ my: 1.5 }} />

                                        <Stack spacing={1} textAlign="left">
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="caption" color="text.secondary">Total Contributed:</Typography>
                                                <Typography variant="caption" fontWeight={700}>${totalContributed.toLocaleString()}</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="caption" color="text.secondary">Compound Interest Earned:</Typography>
                                                <Typography variant="caption" fontWeight={700} color="success.main">+${totalEarnedInterest.toFixed(2)}</Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="caption" color="text.secondary">Configured APY:</Typography>
                                                <Typography variant="caption" fontWeight={900}>{savingsApy}% Compound</Typography>
                                            </Box>
                                        </Stack>

                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="success"
                                            size="medium"
                                            onClick={() => navigate(user ? '/accounts' : '/register')}
                                            sx={{ mt: 2.5, fontWeight: 700, borderRadius: 2 }}
                                        >
                                            Open High-Yield Savings →
                                        </Button>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Card>
                    )}
                </Container>
            </Box>

            {/* Architecture & How Banking Works */}
            <Box id="architecture" sx={{ py: { xs: 7, md: 9 }, bgcolor: isDark ? '#0b1120' : '#f8fafc', borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Container maxWidth="xl">
                    <Box textAlign="center" mb={6} maxWidth={720} mx="auto">
                        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={1.2}>
                            FINANCIAL INTEGRITY
                        </Typography>
                        <Typography variant="h4" fontWeight={900} gutterBottom letterSpacing="-0.02em" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
                            How Core Banking Operates
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Commercial systems do not merely mutate balances. Every operation adheres to balanced accounting principles.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {[
                            {
                                step: '01',
                                title: 'Double-Entry General Ledger',
                                desc: 'For every balance change, a debited account and credited account are written together in an immutable journal. Total debits always equal credits.',
                            },
                            {
                                step: '02',
                                title: 'Cryptographic Idempotency',
                                desc: 'Network timeouts or double-clicked submit buttons are protected by unique idempotency keys, guaranteeing funds are deducted exactly once.',
                            },
                            {
                                step: '03',
                                title: 'Dual-Control 4-Eyes Governance',
                                desc: 'High-value transactions ($10,000+) and critical system fee or interest adjustments require a second authorized officer to review and approve.',
                            },
                            {
                                step: '04',
                                title: 'Automated Reconciliation',
                                desc: 'Automated nightly routines audit every individual account ledger against central vault totals to detect and resolve any financial drift.',
                            },
                        ].map((card, idx) => (
                            <Grid item xs={12} sm={6} md={3} key={idx}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        height: '100%',
                                        borderRadius: 3,
                                        bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                                    }}
                                >
                                    <Typography variant="h5" fontWeight={900} color="primary.main" gutterBottom sx={{ opacity: 0.85 }}>
                                        {card.step}
                                    </Typography>
                                    <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                                        {card.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                                        {card.desc}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>



            {/* Security Section */}
            <Box id="security" sx={{ py: { xs: 7, md: 9 } }}>
                <Container maxWidth="xl">
                    <Grid container spacing={5} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Box mb={1.5}>
                                <Chip
                                    icon={<SecurityIcon fontSize="small" />}
                                    label="BANK-GRADE SECURITY"
                                    color="success"
                                    variant="outlined"
                                    size="small"
                                    sx={{ fontWeight: 700 }}
                                />
                            </Box>
                            <Typography variant="h4" fontWeight={900} gutterBottom letterSpacing="-0.02em" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
                                Protection for Your Assets and Identity
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Designed with modern security primitives to simulate regulated financial institution requirements:
                            </Typography>

                            <Stack spacing={2} mt={2.5}>
                                {[
                                    {
                                        title: 'End-to-End Encryption & Session Tokenization',
                                        desc: 'All sensitive communications are encrypted in transit using TLS 1.3 and authenticated via secure tokens.',
                                    },
                                    {
                                        title: 'Full Audit Trail & Forensic Logging',
                                        desc: 'Every login, transfer, password update, and administrative action is preserved with IP addresses and timestamps.',
                                    },
                                    {
                                        title: 'Automated Fraud & Velocity Watchdog',
                                        desc: 'Intelligent monitoring detects anomalous activity like rapid successive withdrawals or out-of-character transfers.',
                                    },
                                ].map((sec, i) => (
                                    <Box key={i} display="flex" gap={1.5}>
                                        <CheckCircleIcon color="success" sx={{ fontSize: 20, mt: 0.3 }} />
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={800}>
                                                {sec.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                                                {sec.desc}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper
                                elevation={3}
                                sx={{
                                    p: 3.5,
                                    borderRadius: 3.5,
                                    bgcolor: isDark ? '#111827' : '#f8fafc',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                                    Security Certifications & Controls
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" mb={2.5}>
                                    Engineered to mirror financial risk parameters and SOC 2 Type II controls.
                                </Typography>

                                <Grid container spacing={2}>
                                    {[
                                        { title: 'Double-Entry Standard', status: 'Compliant' },
                                        { title: 'PCI-DSS Data Handling', status: 'Encrypted' },
                                        { title: 'AML / Velocity Rule Checks', status: 'Active' },
                                        { title: 'Dual-Key Authorization', status: 'Enforced' },
                                    ].map((badge, bidx) => (
                                        <Grid item xs={6} key={bidx}>
                                            <Paper variant="outlined" sx={{ p: 1.8, borderRadius: 2, textAlign: 'center' }}>
                                                <Typography variant="body2" fontWeight={800}>{badge.title}</Typography>
                                                <Chip label={badge.status} color="success" size="small" sx={{ mt: 0.8, fontWeight: 700, fontSize: '0.7rem' }} />
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Frequently Asked Questions (FAQ) */}
            <Box id="faq" sx={{ py: { xs: 7, md: 8 }, bgcolor: isDark ? '#0b1120' : '#f8fafc', borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Container maxWidth="md">
                    <Box textAlign="center" mb={5}>
                        <Typography variant="overline" color="primary" fontWeight={800} letterSpacing={1.2}>
                            COMMON QUESTIONS
                        </Typography>
                        <Typography variant="h4" fontWeight={900} gutterBottom letterSpacing="-0.02em" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
                            Frequently Asked Questions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Everything you need to know about navigating the CoreBanking platform.
                        </Typography>
                    </Box>

                    <Stack spacing={1.5}>
                        {[
                            {
                                q: 'What is the CoreBanking platform?',
                                a: 'It is a full-featured core banking environment that emulates real-world retail and commercial banking: multi-account management, instant P2P transfers, loan processing, scheduled jobs, and balanced double-entry accounting.',
                            },
                            {
                                q: 'How does the Double-Entry bookkeeping work in this app?',
                                a: 'Whenever funds move (deposit, transfer, withdrawal, interest payout), two balanced postings are recorded in the general ledger: a debit and a credit. The system enforces that sum(debits) - sum(credits) = 0 at all times.',
                            },
                            {
                                q: 'Can I test all available roles?',
                                a: 'Yes! Use the Quick Demo Profile launcher chips at the top of this page to switch between System Administrator, Compliance Officer, and Customer accounts in one click.',
                            },
                            {
                                q: 'How do dual-approval workflows work for high-value transfers?',
                                a: 'Transfers exceeding $10,000 are placed in a Quarantined status. An Administrator or Compliance Officer must review and approve the transaction in the Approvals queue before the balance is disbursed.',
                            },
                        ].map((faq, fidx) => (
                            <Accordion key={fidx} sx={{ borderRadius: 2, '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider' }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle2" fontWeight={800}>
                                        {faq.q}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                                        {faq.a}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* Call to Action Banner */}
            <Box
                sx={{
                    py: 7,
                    bgcolor: isDark ? '#0284c7' : '#0369a1',
                    color: '#ffffff',
                    textAlign: 'center',
                }}
            >
                <Container maxWidth="md">
                    <Typography variant="h4" fontWeight={900} gutterBottom letterSpacing="-0.02em" sx={{ fontSize: { xs: '1.6rem', md: '2.1rem' } }}>
                        Ready to Experience Real-World Banking?
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 3.5, maxWidth: 540, mx: 'auto' }}>
                        Start testing double-entry ledger transactions, peer-to-peer transfers, and multi-tier account management now.
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                            variant="contained"
                            size="medium"
                            onClick={() => navigate(user ? '/dashboard' : '/register')}
                            sx={{
                                bgcolor: '#ffffff',
                                color: '#0369a1',
                                fontWeight: 800,
                                px: 3.5,
                                py: 1.2,
                                borderRadius: 2,
                                '&:hover': { bgcolor: '#f1f5f9' },
                            }}
                        >
                            Open Account
                        </Button>
                        <Button
                            variant="outlined"
                            size="medium"
                            onClick={() => navigate('/login')}
                            sx={{
                                borderColor: '#ffffff',
                                color: '#ffffff',
                                fontWeight: 700,
                                px: 3.5,
                                py: 1.2,
                                borderRadius: 2,
                                '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' },
                            }}
                        >
                            Log In to Portal
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* Clean Footer */}
            <Box component="footer" sx={{ py: 6, bgcolor: isDark ? '#020617' : '#0f172a', color: '#94a3b8', borderTop: 1, borderColor: 'divider' }}>
                <Container maxWidth="xl">
                    <Grid container spacing={4} mb={4}>
                        <Grid item xs={12} md={4}>
                            <Box display="flex" alignItems="center" gap={1.2} mb={1.5}>
                                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                    <AccountBalanceIcon fontSize="small" />
                                </Avatar>
                                <Typography variant="subtitle1" fontWeight={900} color="#ffffff">
                                    Apex<span style={{ color: '#38bdf8' }}>Core</span> Banking
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ lineHeight: 1.7, display: 'block', pr: { md: 4 } }}>
                                Modern digital banking environment providing authentic financial engineering features, double-entry audit trails, and multi-tier account portfolios.
                            </Typography>
                        </Grid>

                        <Grid item xs={6} md={2}>
                            <Typography variant="caption" fontWeight={800} color="#ffffff" display="block" gutterBottom>
                                BANK PRODUCTS
                            </Typography>
                            <Stack spacing={0.8}>
                                <Typography component={RouterLink} to="/register" variant="caption" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: '#ffffff' } }}>Checking Accounts</Typography>
                                <Typography component={RouterLink} to="/register" variant="caption" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: '#ffffff' } }}>High-Yield Savings</Typography>
                                <Typography component={RouterLink} to="/register" variant="caption" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: '#ffffff' } }}>Fixed Term Deposits</Typography>
                                <Typography component="a" href="#calculator" variant="caption" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: '#ffffff' } }}>Personal Loans</Typography>
                            </Stack>
                        </Grid>

                        <Grid item xs={6} md={2}>
                            <Typography variant="caption" fontWeight={800} color="#ffffff" display="block" gutterBottom>
                                CORE ENGINE
                            </Typography>
                            <Stack spacing={0.8}>
                                <Typography component="a" href="#architecture" variant="caption" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: '#ffffff' } }}>Double-Entry Journal</Typography>
                                <Typography component="a" href="#security" variant="caption" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: '#ffffff' } }}>Fraud Watchdog</Typography>
                                <Typography component="a" href="#rates" variant="caption" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: '#ffffff' } }}>Accrual Rates</Typography>
                                <Typography component="a" href="#architecture" variant="caption" sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: '#ffffff' } }}>Dual-Approval</Typography>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" fontWeight={800} color="#ffffff" display="block" gutterBottom>
                                SECURITY NOTICE
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.6 }}>
                                All transactions are processed under secure cryptographic guarantees. Dual-factor authorization and audit logs are enforced on all account operations.
                            </Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2.5 }} />

                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" gap={1.5}>
                        <Typography variant="caption">
                            © {new Date().getFullYear()} ApexCore Banking System. All rights reserved.
                        </Typography>
                        <Stack direction="row" spacing={2.5}>
                            <Button component={RouterLink} to="/login" sx={{ color: '#94a3b8', fontSize: '0.78rem', p: 0 }}>
                                Sign In
                            </Button>
                            <Button component={RouterLink} to="/register" sx={{ color: '#94a3b8', fontSize: '0.78rem', p: 0 }}>
                                Register
                            </Button>
                        </Stack>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}
