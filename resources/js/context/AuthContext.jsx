import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

// Session heartbeat interval (5 minutes) — validates token is still alive
const SESSION_HEARTBEAT_MS = 5 * 60 * 1000;
// Activity timeout — auto-logout after 30 min of inactivity
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('banking_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            localStorage.removeItem('banking_user');
            return null;
        }
    });
    const [token, setToken] = useState(() => localStorage.getItem('banking_token'));
    const [loading, setLoading] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    // Refs to avoid stale closure issues
    const tokenRef = useRef(token);
    const heartbeatRef = useRef(null);
    const inactivityRef = useRef(null);
    const isLoggingOut = useRef(false);

    // Keep tokenRef in sync
    useEffect(() => {
        tokenRef.current = token;
    }, [token]);

    // Clear session state — used by both logout and forced expiry
    const clearSession = useCallback(() => {
        setToken(null);
        setUser(null);
        setUnreadNotifications(0);
        tokenRef.current = null;
        localStorage.removeItem('banking_token');
        localStorage.removeItem('banking_user');
        localStorage.removeItem('banking_last_activity');
    }, []);

    // Logout with server call
    const logout = useCallback(async () => {
        if (isLoggingOut.current) return;
        isLoggingOut.current = true;

        try {
            if (tokenRef.current) {
                await api.post('/logout');
            }
        } catch {
            // Ignore — token may already be invalid
        } finally {
            clearSession();
            setSessionExpired(false);
            isLoggingOut.current = false;
        }
    }, [clearSession]);

    // Force session expiry (no server call — token already invalid)
    const forceExpireSession = useCallback(() => {
        if (isLoggingOut.current) return;
        clearSession();
        setSessionExpired(true);
    }, [clearSession]);

    // Refresh user data from the server
    const refreshUser = useCallback(async () => {
        const currentToken = tokenRef.current;
        if (!currentToken) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get('/me');
            const freshUser = res.data.user;
            setUser(freshUser);
            localStorage.setItem('banking_user', JSON.stringify(freshUser));

            // Fetch unread notifications count
            try {
                const notifRes = await api.get('/notifications');
                setUnreadNotifications(notifRes.data.unread_count || 0);
            } catch {
                // Non-critical — don't fail session refresh for notification fetch
            }
        } catch (err) {
            if (err.response?.status === 401) {
                forceExpireSession();
            } else {
                console.error('Failed to refresh user session', err);
                // Network error or server down — don't log out, let user retry
            }
        } finally {
            setLoading(false);
        }
    }, [forceExpireSession]);

    // Initial session validation on mount
    useEffect(() => {
        refreshUser();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Session heartbeat — periodically validate the token
    useEffect(() => {
        if (!token) {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            return;
        }

        heartbeatRef.current = setInterval(async () => {
            if (!tokenRef.current) return;
            try {
                await api.get('/me');
                // Token still valid — update last activity
                localStorage.setItem('banking_last_activity', Date.now().toString());
            } catch (err) {
                if (err.response?.status === 401) {
                    forceExpireSession();
                }
            }
        }, SESSION_HEARTBEAT_MS);

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }, [token, forceExpireSession]);

    // Inactivity timeout — track user activity
    useEffect(() => {
        if (!token) {
            if (inactivityRef.current) clearTimeout(inactivityRef.current);
            return;
        }

        const resetInactivityTimer = () => {
            if (inactivityRef.current) clearTimeout(inactivityRef.current);
            localStorage.setItem('banking_last_activity', Date.now().toString());
            inactivityRef.current = setTimeout(() => {
                if (tokenRef.current) {
                    forceExpireSession();
                }
            }, INACTIVITY_TIMEOUT_MS);
        };

        // User activity events
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(evt => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
        resetInactivityTimer();

        return () => {
            events.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
            if (inactivityRef.current) clearTimeout(inactivityRef.current);
        };
    }, [token, forceExpireSession]);

    // Cross-tab session sync — if another tab logs out, this tab follows
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'banking_token' && !e.newValue) {
                // Another tab cleared the token
                setToken(null);
                setUser(null);
                setUnreadNotifications(0);
                setSessionExpired(true);
            } else if (e.key === 'banking_token' && e.newValue && !tokenRef.current) {
                // Another tab logged in — pick up the new session
                setToken(e.newValue);
                const userStr = localStorage.getItem('banking_user');
                if (userStr) {
                    try { setUser(JSON.parse(userStr)); } catch { /* ignore */ }
                }
                setSessionExpired(false);
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Login
    const login = useCallback(async (email, password) => {
        const res = await api.post('/login', { email, password });
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        setSessionExpired(false);
        tokenRef.current = newToken;
        localStorage.setItem('banking_token', newToken);
        localStorage.setItem('banking_user', JSON.stringify(newUser));
        localStorage.setItem('banking_last_activity', Date.now().toString());
        return newUser;
    }, []);

    // Register
    const register = useCallback(async (userData) => {
        const res = await api.post('/register', userData);
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        setSessionExpired(false);
        tokenRef.current = newToken;
        localStorage.setItem('banking_token', newToken);
        localStorage.setItem('banking_user', JSON.stringify(newUser));
        localStorage.setItem('banking_last_activity', Date.now().toString());
        return newUser;
    }, []);

    const value = {
        user,
        token,
        loading,
        sessionExpired,
        unreadNotifications,
        setUnreadNotifications,
        login,
        register,
        logout,
        refreshUser,
        isAdmin: user?.role === 'admin',
        isInstructor: user?.role === 'officer',
        isOfficer: user?.role === 'officer',
        isCustomer: user?.role === 'customer',
        isUser: user?.role === 'customer',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
