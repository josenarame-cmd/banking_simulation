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
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('banking_token');
            localStorage.removeItem('banking_user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
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

