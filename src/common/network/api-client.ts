import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Base API instance for WorkNest
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request Interceptor (Auth & Multi-tenancy)
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Inject Auth Token (from local storage for CSR, could be updated to Cookie based)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Inject Company ID (Multi-tenancy)
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;
    if (companyId && config.headers) {
      config.headers['X-Company-ID'] = companyId;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor (Error Handling)
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Global error handling (e.g., 401 redirect to login)
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        // window.location.href = '/login'; // Optional: handled by middleware or query client
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
