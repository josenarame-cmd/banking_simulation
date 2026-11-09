import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Badge,
    Menu,
    MenuItem,
    Avatar,
    Tooltip,
    useMediaQuery,
    useTheme,
    Chip,
    Popover,
    Button
} from '@mui/material';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PercentIcon from '@mui/icons-material/Percent';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import SecurityIcon from '@mui/icons-material/Security';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ThemeContext';
import api from '../api/client';

const DRAWER_WIDTH = 260;

export default function Layout() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout, isAdmin, isInstructor, unreadNotifications, setUnreadNotifications } = useAuth();
    const { mode, toggleColorMode } = useColorMode();
    const navigate = useNavigate();
    const location = useLocation();

    // User Profile Menu Anchor
    const [anchorEl, setAnchorEl] = useState(null);
    const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
    const handleProfileMenuClose = () => setAnchorEl(null);

    // Notifications Popover Anchor
    const [notifAnchor, setNotifAnchor] = useState(null);
    const [notificationsList, setNotificationsList] = useState([]);
    const handleNotifOpen = async (e) => {
        setNotifAnchor(e.currentTarget);
        try {
            const res = await api.get('/notifications');
            setNotificationsList(res.data.data || []);
            setUnreadNotifications(res.data.unread_count || 0);
        } catch (err) {
            console.error(err);
        }
    };
    const handleNotifClose = () => setNotifAnchor(null);

    const handleMarkAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setUnreadNotifications(0);
            setNotificationsList(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = async () => {
        handleProfileMenuClose();
        await logout();
        navigate('/login');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Navigation Menu Structure based on Roles
    const navSections = [
        {
            title: 'Personal Banking',
            roles: ['customer', 'admin', 'officer'],
            items: [
                { text: 'My Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
                { text: 'My Accounts', path: '/accounts', icon: <AccountBalanceIcon /> },
                { text: 'Send Transfer', path: '/transfers', icon: <SwapHorizIcon /> },
                { text: 'Transactions', path: '/transactions', icon: <ReceiptLongIcon /> },
                { text: 'Simulated Loans', path: '/loans', icon: <MonetizationOnIcon /> },
                { text: 'Scheduled Transfers', path: '/scheduled', icon: <ScheduleIcon /> },
            ]
        },
        {
            title: 'Control & Oversight',
            roles: ['admin', 'officer'],
            items: [
                ...(isAdmin ? [{ text: 'Admin Overview', path: '/admin/dashboard', icon: <DashboardIcon /> }] : []),
                ...(isInstructor ? [{ text: 'Officer Lab', path: '/instructor/dashboard', icon: <DashboardIcon /> }] : []),
                { text: 'Transfer Approvals', path: '/approvals', icon: <HowToVoteIcon /> },
                { text: 'Loan Review & Approvals', path: '/loan-approvals', icon: <AssignmentTurnedInIcon /> },
                { text: 'Double-Entry Ledger', path: '/ledger', icon: <MenuBookIcon /> },
                { text: 'Ledger Reconciliation', path: '/reconciliation', icon: <FactCheckIcon /> },
                { text: 'Security & Fraud Alerts', path: '/security-alerts', icon: <SecurityIcon /> },
                { text: 'System Reports', path: '/reports', icon: <AssessmentIcon /> },
            ]
        },
        {
            title: 'Administration',
            roles: ['admin'],
            items: [
                { text: 'All Bank Accounts', path: '/admin/accounts', icon: <AccountBalanceIcon /> },
                { text: 'User Management', path: '/admin/users', icon: <PeopleIcon /> },
                { text: 'Interest Calculations', path: '/admin/interest', icon: <PercentIcon /> },
                { text: 'Banking Fee Rules', path: '/admin/fees', icon: <PriceCheckIcon /> },
                { text: 'System Audit Logs', path: '/admin/audit-logs', icon: <SecurityIcon /> },
            ]
        }
    ];

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                component={RouterLink}
                to="/"
                sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'action.hover' }
                }}
            >
                <Avatar sx={{ bgcolor: 'primary.main', width: 42, height: 42 }}>
                    <AccountBalanceIcon />
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
                        CoreBanking
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        FinTech Simulation Lab
                    </Typography>
                </Box>
            </Box>
            <Divider />

            <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
                {navSections.map((section, idx) => {
                    const hasAccess = section.roles.includes(user?.role);
                    if (!hasAccess || section.items.length === 0) return null;

                    return (
                        <Box key={idx} sx={{ mb: 2 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    px: 2,
                                    py: 0.5,
                                    display: 'block',
                                    color: 'text.secondary',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontSize: '0.68rem',
                                }}
                            >
                                {section.title}
                            </Typography>
                            <List dense disablePadding>
                                {section.items.map((item) => {
                                    const selected = location.pathname === item.path;
                                    return (
                                        <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                                            <ListItemButton
                                                component={RouterLink}
                                                to={item.path}
                                                selected={selected}
                                                onClick={() => isMobile && setMobileOpen(false)}
                                                sx={{
                                                    borderRadius: 2,
                                                    '&.Mui-selected': {
                                                        bgcolor: (theme) => theme.palette.mode === 'light' ? '#e0f2fe' : '#0369a1',
                                                        color: (theme) => theme.palette.mode === 'light' ? '#0369a1' : '#ffffff',
                                                        fontWeight: 700,
                                                        '& .MuiListItemIcon-root': {
                                                            color: (theme) => theme.palette.mode === 'light' ? '#0369a1' : '#ffffff',
                                                        },
                                                    },
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 38, color: selected ? 'primary.main' : 'text.secondary' }}>
                                                    {item.icon}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={item.text}
                                                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: selected ? 700 : 500 }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </Box>
                    );
                })}
            </Box>

            <Divider />
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: 'secondary.main' }}>
                    {user?.name?.charAt(0) || 'U'}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                        {user?.name}
                    </Typography>
                    <Chip
                        label={
                            user?.role === 'admin' ? 'ADMINISTRATOR' :
                            user?.role === 'officer' ? 'COMPLIANCE OFFICER' :
                            'CUSTOMER'
                        }
                        size="small"
                        color={user?.role === 'admin' ? 'primary' : user?.role === 'officer' ? 'secondary' : 'default'}
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Top Navigation Bar */}
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { md: `${DRAWER_WIDTH}px` },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                    boxShadow: 'none',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" fontWeight={700} noWrap sx={{ flexGrow: 1 }}>
                        Core Banking Management Platform
                    </Typography>

                    {/* Real-time Online Beacon */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, mr: 2, px: 1.5, py: 0.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)', borderRadius: 2, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <span className="status-pulse" />
                        <Typography variant="caption" fontWeight={700} color="success.main" letterSpacing={0.5}>
                            SETTLEMENT NETWORK ONLINE
                        </Typography>
                    </Box>

                    {/* Dark / Light Mode Toggle */}
                    <Tooltip title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} mode`}>
                        <IconButton onClick={toggleColorMode} color="inherit" sx={{ mr: 1 }}>
                            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                    </Tooltip>

                    {/* Notification Bell */}
                    <Tooltip title="Notifications">
                        <IconButton color="inherit" onClick={handleNotifOpen} sx={{ mr: 1.5 }}>
                            <Badge badgeContent={unreadNotifications} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* User Profile Avatar Menu */}
                    <Tooltip title="Account menu">
                        <IconButton onClick={handleProfileMenuOpen} size="small">
                            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                                {user?.name?.charAt(0) || 'U'}
                            </Avatar>
                        </IconButton>
                    </Tooltip>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleProfileMenuClose}
                        PaperProps={{ sx: { width: 220, borderRadius: 2, mt: 1.5 } }}
                    >
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight={700} noWrap>{user?.name}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
                        </Box>
                        <Divider />
                        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
                            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                            My Profile
                        </MenuItem>
                        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/'); }}>
                            <ListItemIcon><AccountBalanceIcon fontSize="small" color="primary" /></ListItemIcon>
                            Platform Landing Page
                        </MenuItem>
                        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                            <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                            Logout
                        </MenuItem>
                    </Menu>

                    {/* Notifications Popover */}
                    <Popover
                        open={Boolean(notifAnchor)}
                        anchorEl={notifAnchor}
                        onClose={handleNotifClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{ sx: { width: 340, maxHeight: 420, borderRadius: 2, mt: 1.5, p: 2 } }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                            <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
                            {unreadNotifications > 0 && (
                                <Button size="small" onClick={handleMarkAllRead}>
                                    Mark all read
                                </Button>
                            )}
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                        {notificationsList.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                                No notifications found.
                            </Typography>
                        ) : (
                            <List dense disablePadding sx={{ maxHeight: 300, overflowY: 'auto' }}>
                                {notificationsList.map((n) => (
                                    <ListItem
                                        key={n.id}
                                        sx={{
                                            mb: 1,
                                            borderRadius: 2,
                                            bgcolor: n.is_read ? 'transparent' : 'action.hover',
                                            p: 1.5,
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        <Typography variant="subtitle2" fontWeight={n.is_read ? 500 : 700}>
                                            {n.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {n.message}
                                        </Typography>
                                        <Typography variant="caption" color="primary" sx={{ mt: 0.5, fontSize: '0.65rem' }}>
                                            {new Date(n.created_at).toLocaleString()}
                                        </Typography>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Popover>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawers */}
            <Box
                component="nav"
                sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
            >
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
                    }}
                >
                    {drawerContent}
                </Drawer>

                {/* Desktop Permanent Drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: (theme) => `1px solid ${theme.palette.divider}` },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, md: 3 },
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    mt: '64px',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}

