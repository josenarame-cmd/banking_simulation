import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('banking_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('banking_token'));
    const [loading, setLoading] = useState(true);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const refreshUser = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.get('/me');
            setUser(res.data.user);
            localStorage.setItem('banking_user', JSON.stringify(res.data.user));

            // Fetch unread notifications count
            const notifRes = await api.get('/notifications');
            setUnreadNotifications(notifRes.data.unread_count || 0);
        } catch (err) {
            console.error('Failed to refresh user session', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, [token]);

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('banking_token', newToken);
        localStorage.setItem('banking_user', JSON.stringify(newUser));
        return newUser;
    };

    const register = async (userData) => {
        const res = await api.post('/register', userData);
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('banking_token', newToken);
        localStorage.setItem('banking_user', JSON.stringify(newUser));
        return newUser;
    };

    const logout = async () => {
        try {
            if (token) {
                await api.post('/logout');
            }
        } catch (e) {
            // Ignore error on logout
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem('banking_token');
            localStorage.removeItem('banking_user');
        }
    };

    const value = {
        user,
        token,
        loading,
        unreadNotifications,
        setUnreadNotifications,
        login,
        register,
        logout,
        refreshUser,
        isAdmin: user?.role === 'admin',
        isInstructor: user?.role === 'instructor',
        isUser: user?.role === 'user',
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

