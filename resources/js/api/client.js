import axios from 'axios';

// Base API URL handles both dev server and XAMPP subfolder deployment
const getBaseURL = () => {
    if (window.location.pathname.startsWith('/banking/public')) {
        return '/banking/public/api';
    }
    return '/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second request timeout
});

// Request Interceptor: Attach Sanctum Bearer Token and Idempotency Key
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('banking_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach UUID idempotency key for state-changing operations
    if (['post', 'put', 'patch'].includes(config.method?.toLowerCase()) && !config.headers['X-Idempotency-Key']) {
        config.headers['X-Idempotency-Key'] = 'IDEM-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Global 401 handling
// The AuthContext handles session state; we only clean up localStorage
// and redirect if we're not already on the login page.
let isRedirecting = false;

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear stored credentials on any 401
            localStorage.removeItem('banking_token');
            localStorage.removeItem('banking_user');

            // Redirect to login only once (avoid race from multiple concurrent 401s)
            const isOnAuthPage = window.location.pathname.includes('/login') ||
                                 window.location.pathname.includes('/register') ||
                                 window.location.pathname === '/';
            if (!isRedirecting && !isOnAuthPage) {
                isRedirecting = true;
                // Small delay so AuthContext can process the session expiry first
                setTimeout(() => {
                    isRedirecting = false;
                    if (!localStorage.getItem('banking_token')) {
                        window.location.href = '/login';
                    }
                }, 500);
            }
        }
        return Promise.reject(error);
    }
);

export const downloadCsv = async (url, defaultFilename = 'export.csv') => {
    const res = await api.get(url, { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', defaultFilename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
};

export default api;
