import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * WorkNest Robust API Client
 * 
 * Features:
 * 1. Automatic /api/v1 prefixing for all local requests.
 * 2. Normalization of baseURL to domain-root to avoid Axios path-merging quirks.
 * 3. Consistent detection of public auth routes (forgot password, activation, etc).
 * 4. Automatic injection of JWT and Multi-tenant headers.
 */

const API_PREFIX = '/api/v1';

// Extract base domain from environment variable, ensuring we don't have redundant prefixes
const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const BASE_URL = rawBaseURL.replace(/\/api\/v1\/?$/, '');

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

/**
 * Unified Request Interceptor
 * Handles Debug Logging, Authentication, and Multi-tenancy headers.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. PRE-PATH NORMALIZATION
    // Prepend the mandatory API prefix if it's a relative path and missing the prefix.
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith(API_PREFIX)) {
      const separator = config.url.startsWith('/') ? '' : '/';
      config.url = `${API_PREFIX}${separator}${config.url}`;
    }

    // 2. PUBLIC ROUTE DETECTION
    // Align with backend SecurityConfig: any POST to /auth/** is generally public.
    const isPublicAuth = config.url?.startsWith(`${API_PREFIX}/auth/`);

    // 3. HEADER INJECTION
    if (!isPublicAuth) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const companyId = typeof window !== 'undefined' ? localStorage.getItem('current_company_id') : null;
      if (companyId && config.headers) {
        config.headers['X-Company-ID'] = companyId;
      }
    }

    // 4. VERBOSE DEBUG LOGGING
    // In development, show the FULLY QUALIFIED URL that Axiom is about to call.
    if (process.env.NODE_ENV === 'development') {
      const fullPath = axios.getUri(config);
      console.log(`🚀 [API REQUEST] ${config.method?.toUpperCase()} ${fullPath}`, {
        headers: config.headers,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Unified Response Interceptor
 * Handles Global Error Logging and 401 Redirects.
 */
apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    // Detailed ERROR logging with as much context as possible
    console.error(`❌ [API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    // 401 Global Handler
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_company_id');
        // Optional: window.location.href = '/login'; 
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
