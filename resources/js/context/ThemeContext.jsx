import React, { createContext, useContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ColorModeContext = createContext({
    toggleColorMode: () => {},
    mode: 'light',
});

export const useColorMode = () => useContext(ColorModeContext);

export const CustomThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        return localStorage.getItem('banking_theme_mode') || 'light';
    });

    const colorMode = useMemo(() => ({
        toggleColorMode: () => {
            setMode((prevMode) => {
                const newMode = prevMode === 'light' ? 'dark' : 'light';
                localStorage.setItem('banking_theme_mode', newMode);
                return newMode;
            });
        },
        mode,
    }), [mode]);

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: {
                main: mode === 'light' ? '#0f4c81' : '#38bdf8', // Classic Navy / Sky Blue
                light: '#3b82f6',
                dark: '#082f49',
                contrastText: '#ffffff',
            },
            secondary: {
                main: mode === 'light' ? '#059669' : '#34d399', // Emerald FinTech Green
                light: '#10b981',
                dark: '#064e3b',
                contrastText: '#ffffff',
            },
            background: {
                default: mode === 'light' ? '#f8fafc' : '#0b1120',
                paper: mode === 'light' ? '#ffffff' : '#1e293b',
            },
            text: {
                primary: mode === 'light' ? '#0f172a' : '#f8fafc',
                secondary: mode === 'light' ? '#64748b' : '#94a3b8',
            },
            divider: mode === 'light' ? '#e2e8f0' : '#334155',
        },
        typography: {
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            h4: { fontWeight: 700, letterSpacing: '-0.02em' },
            h5: { fontWeight: 600, letterSpacing: '-0.01em' },
            h6: { fontWeight: 600 },
            button: { textTransform: 'none', fontWeight: 600 },
        },
        shape: {
            borderRadius: 12,
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        padding: '8px 18px',
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        boxShadow: mode === 'light'
                            ? '0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.05)'
                            : '0 4px 6px -1px rgba(0,0,0,0.4)',
                        border: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #334155',
                    },
                },
            },
            MuiTableHead: {
                styleOverrides: {
                    root: {
                        backgroundColor: mode === 'light' ? '#f8fafc' : '#0f172a',
                    },
                },
            },
        },
    }), [mode]);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
};

