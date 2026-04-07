import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { refreshAuthTokens } from '@/features/auth/api/refresh';

/**
 * WorkNest Robust API Client
 * 
 * Features:
 * 1. Automatic /api/v1 prefixing for all local requests.
 * 2. Normalization of baseURL to domain-root to avoid Axios path-merging quirks.
 * 3. Consistent detection of public auth routes (forgot password, activation, etc).
 * 4. Automatic injection of JWT and Multi-tenant headers.
 * 5. Silent Refresh Token Rotation for expired sessions.
 */

const API_PREFIX = '/api/v1';

// Extract base domain from environment variable
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

// --- REFRESH TOKEN STATE ---
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Unified Request Interceptor
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. PRE-PATH NORMALIZATION
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith(API_PREFIX)) {
      const separator = config.url.startsWith('/') ? '' : '/';
      config.url = `${API_PREFIX}${separator}${config.url}`;
    }

    // 2. PUBLIC ROUTE DETECTION
    const isPublicAuth = config.url?.startsWith(`${API_PREFIX}/auth/`) && 
                         !config.url?.includes('/auth/refresh'); // Refresh itself needs the old token if using headers, but here we pass in body

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

    // 4. DEBUG LOGGING
    if (process.env.NODE_ENV === 'development') {
      const fullPath = axios.getUri(config);
      console.log(`🚀 [API REQUEST] ${config.method?.toUpperCase()} ${fullPath}`);
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Unified Response Interceptor
 * Handles Global Error Logging, 401 Silent Refresh, and Queueing.
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 Handler with Refresh Rotation
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt refresh if we're on the login page or if it was a final auth attempt
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');
      const isAuthRequest = originalRequest.url?.includes('/auth/login') || 
                            originalRequest.url?.includes('/auth/refresh') ||
                            originalRequest.url?.includes('/auth/logout');

      if (isLoginPage || isAuthRequest) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

      if (!refreshToken) {
        isRefreshing = false;
        // Optionally redirect to login or clear store
        return Promise.reject(error);
      }

      try {
        console.log('🔄 [Auth] Token expired. Attempting silent refresh...');
        const refreshResponse = await refreshAuthTokens(refreshToken);
        
        const { accessToken, refreshToken: newRefreshToken, tenantContext } = refreshResponse;

        // Update local storage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', accessToken);
          localStorage.setItem('refresh_token', newRefreshToken);
          if (tenantContext?.companyId) {
            localStorage.setItem('current_company_id', tenantContext.companyId);
          }
        }

        console.log('✅ [Auth] Silent refresh successful. Retrying original request.');
        
        processQueue(null, accessToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ [Auth] Silent refresh failed. Session expired.');
        processQueue(refreshError, null);
        
        // Clear local storage and redirect if needed
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('current_company_id');
          // window.location.href = '/login?expired=true';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Standard error logging
    console.error(`❌ [API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export { apiClient };
