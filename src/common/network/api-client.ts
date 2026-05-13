import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { refreshAuthTokens } from '@/features/auth/api/refresh';
import { setCookie } from '@/common/utils/cookies';
import { toast } from 'sonner';
import { handleApiError } from '@/common/utils/api-error-parser';
import { translate } from '@/common/i18n/translate';

/**
 * WorkNest Robust API Client
 *
 * Features:
 * 1. Automatic /api/v1 prefixing for all local requests.
 * 2. Normalization of baseURL to domain-root to avoid Axios path-merging quirks.
 * 3. Consistent detection of public auth routes (forgot password, activation, etc).
 * 4. Automatic injection of JWT and Multi-tenant headers.
 * 5. Silent Refresh Token Rotation for expired sessions with queue-based
 *    concurrency control and full loop-prevention guards.
 */

const API_PREFIX = '/api/v1';

// Derive the bare domain so we can prepend /api/v1 ourselves without
// triggering Axios URL-merging quirks.
const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
const BASE_URL = rawBaseURL.replace(/\/api\/v1\/?$/, '');

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// ---------------------------------------------------------------------------
// REFRESH TOKEN STATE
// ---------------------------------------------------------------------------

/** True while a refresh request is in-flight. */
let isRefreshing = false;

type ToastRequestConfig = InternalAxiosRequestConfig & {
  toastId?: string | number;
};

type MutationHeaders = InternalAxiosRequestConfig['headers'] & {
  'X-Silent-Mutation'?: unknown;
};

/**
 * Queue of { resolve, reject } callbacks for requests that arrived while a
 * refresh was already in-flight.  Flushed once the refresh settles.
 */
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // token is guaranteed non-null when error is null
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function getLocalItem(key: string): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
}

function setLocalItem(key: string, value: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(key, value);
}

function removeLocalItems(keys: string[]): void {
  if (typeof window !== 'undefined') keys.forEach((k) => localStorage.removeItem(k));
}

const AUTH_STORAGE_KEYS = ['auth_token', 'refresh_token', 'access_token_expires_at', 'current_company_id'] as const;

/**
 * Routes that must NEVER have the Authorization header injected and must
 * NEVER trigger a token refresh on 401.
 */
const PUBLIC_AUTH_ENDPOINTS: string[] = [
  `${API_PREFIX}/auth/login`,
  `${API_PREFIX}/auth/refresh`,
  `${API_PREFIX}/auth/logout`,
  `${API_PREFIX}/auth/invitations/activate`,
  `${API_PREFIX}/auth/forgot-password`,
  `${API_PREFIX}/auth/reset-password`,
  `${API_PREFIX}/companies/register`,
  `${API_PREFIX}/media/public/upload`,
];

function isPublicAuthUrl(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_AUTH_ENDPOINTS.some((endpoint) => url.startsWith(endpoint));
}

// ---------------------------------------------------------------------------
// REQUEST INTERCEPTOR
// ---------------------------------------------------------------------------

// How many milliseconds before expiry to proactively refresh the token.
const PROACTIVE_REFRESH_BUFFER_MS = 30_000;

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Show global loading toast for mutations
    if (typeof window !== 'undefined' && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      // Allow opting out of toasts
      const headers = config.headers as MutationHeaders;
      if (!headers?.['X-Silent-Mutation']) {
        (config as ToastRequestConfig).toastId = toast.loading(translate('common.feedback.processingRequest'));
      }
    }

    // 1. Prepend /api/v1 to relative paths
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith(API_PREFIX)) {
      const separator = config.url.startsWith('/') ? '' : '/';
      config.url = `${API_PREFIX}${separator}${config.url}`;
    }

    // 2. Proactive token refresh — refresh before expiry so callers never see a 401.
    if (!isPublicAuthUrl(config.url)) {
      const expiresAt = getLocalItem('access_token_expires_at');
      const storedRefreshToken = getLocalItem('refresh_token');

      if (expiresAt && storedRefreshToken) {
        const expiresAtMs = new Date(expiresAt).getTime();

        if (Date.now() + PROACTIVE_REFRESH_BUFFER_MS >= expiresAtMs) {
          if (isRefreshing) {
            // Another request is already refreshing; wait for it to complete.
            await new Promise<void>((resolve, reject) => {
              failedQueue.push({
                resolve: () => resolve(),
                reject: (err: unknown) => reject(err),
              });
            });
          } else {
            isRefreshing = true;
            try {
              if (process.env.NODE_ENV === 'development') {
                console.log('🔄 [Auth] Proactive refresh: token expiring soon.');
              }
              const refreshResponse = await refreshAuthTokens(storedRefreshToken);
              const {
                accessToken,
                refreshToken: newRefreshToken,
                tenantContext,
                accessTokenExpiresAt,
              } = refreshResponse;

              setLocalItem('auth_token', accessToken);
              setLocalItem('refresh_token', newRefreshToken);
              setLocalItem('access_token_expires_at', accessTokenExpiresAt);
              if (tenantContext?.companyId) {
                setLocalItem('current_company_id', tenantContext.companyId);
              }
              setCookie('auth_token', accessToken, 7);

              processQueue(null, accessToken);

              if (process.env.NODE_ENV === 'development') {
                console.log('✅ [Auth] Proactive refresh successful.');
              }
            } catch (proactiveErr) {
              processQueue(proactiveErr, null);
              removeLocalItems([...AUTH_STORAGE_KEYS]);
              if (typeof window !== 'undefined') {
                window.location.href = `/login?expired=true`;
              }
              return Promise.reject(proactiveErr);
            } finally {
              isRefreshing = false;
            }
          }
        }
      }
    }

    // 3. Inject auth / tenant headers for protected routes only
    if (!isPublicAuthUrl(config.url)) {
      const token = getLocalItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const companyId = getLocalItem('current_company_id');
      if (companyId && config.headers) {
        config.headers['X-Company-ID'] = companyId;
      }
    }

    // 4. Debug logging (dev only)
    if (process.env.NODE_ENV === 'development') {
      const fullPath = axios.getUri(config);
      console.log(`🚀 [API REQUEST] ${config.method?.toUpperCase()} ${fullPath}`);
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// RESPONSE INTERCEPTOR — Silent Refresh Token Rotation
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as ToastRequestConfig;
    if (typeof window !== 'undefined' && config.toastId) {
      // Use the exact message provided by backend, or fallback
      const msg = response.data?.message || translate('common.feedback.operationSuccessful');
      toast.success(msg, { id: config.toastId });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean, toastId?: string | number };

    // -----------------------------------------------------------------------
    // 401 Handler
    // -----------------------------------------------------------------------
    if (error.response?.status === 401) {
      // Guard 1: Never retry auth / public endpoints — avoids refresh loops.
      if (isPublicAuthUrl(originalRequest.url)) {
        return Promise.reject(error);
      }

      // Guard 2: Never retry a request that we already retried — avoids
      //          infinite loops when the new token is also rejected.
      if (originalRequest._retry) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ [Auth] Retry request also returned 401. Aborting to prevent loop.');
        }
        return Promise.reject(error);
      }

      // Guard 3: Never attempt a refresh if already on the login page.
      const isLoginPage =
        typeof window !== 'undefined' && window.location.pathname.includes('/login');
      if (isLoginPage) {
        return Promise.reject(error);
      }

      // -----------------------------------------------------------------------
      // Multi-tab sync: another tab may have refreshed the token while this
      // request was in-flight.  If the stored token differs from the one that
      // was used, just retry with the newer token — no refresh needed.
      // -----------------------------------------------------------------------
      const usedToken = originalRequest.headers?.Authorization?.toString().replace('Bearer ', '');
      const storedToken = getLocalItem('auth_token');

      if (storedToken && usedToken && storedToken !== usedToken) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            '🔄 [Auth] Multi-tab sync: token already refreshed by another tab. Retrying.',
          );
        }
        // Mark as retried so a subsequent 401 does not loop.
        originalRequest._retry = true;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${storedToken}`;
        }
        return apiClient(originalRequest);
      }

      // -----------------------------------------------------------------------
      // No refresh token available → bail out immediately.
      // -----------------------------------------------------------------------
      const refreshToken = getLocalItem('refresh_token');
      if (!refreshToken) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ [Auth] No refresh token found. Forwarding 401 to caller.');
        }
        return Promise.reject(error);
      }

      // -----------------------------------------------------------------------
      // Another request is already refreshing → queue this one and wait.
      // -----------------------------------------------------------------------
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          // Mark the original request as retried BEFORE queuing so that if the
          // resolved token is also invalid the retry will not re-enter this path.
          originalRequest._retry = true;
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        });
      }

      // -----------------------------------------------------------------------
      // This request will own the refresh.
      // -----------------------------------------------------------------------
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 [Auth] Token expired. Attempting silent refresh...');
        }

        const refreshResponse = await refreshAuthTokens(refreshToken);
        const {
          accessToken,
          refreshToken: newRefreshToken,
          tenantContext,
          accessTokenExpiresAt,
        } = refreshResponse;

        // Persist the new token pair and expiry, and sync the auth cookie.
        setLocalItem('auth_token', accessToken);
        setLocalItem('refresh_token', newRefreshToken);
        setLocalItem('access_token_expires_at', accessTokenExpiresAt);
        setCookie('auth_token', accessToken, 7);

        // Only update tenantContext if the server returned one; preserving the
        // existing companyId when absent avoids accidental tenant mismatches.
        if (tenantContext?.companyId) {
          setLocalItem('current_company_id', tenantContext.companyId);
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [Auth] Silent refresh successful. Retrying original request.');
        }

        // Unblock all queued requests
        processQueue(null, accessToken);

        // Retry the original request with the fresh token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ [Auth] Silent refresh failed. Clearing session.');
        }

        processQueue(refreshError, null);

        // Wipe local auth state and redirect to login
        removeLocalItems([...AUTH_STORAGE_KEYS]);
        if (typeof window !== 'undefined') {
          window.location.href = `/login?expired=true&originalUrl=${encodeURIComponent(window.location.pathname)}`;
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // -----------------------------------------------------------------------
    // Non-401 errors: log and forward
    // -----------------------------------------------------------------------
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ [API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    if (typeof window !== 'undefined' && originalRequest?.toastId) {
      handleApiError(error, { toastId: originalRequest.toastId });
    }

    return Promise.reject(error);
  },
);

export { apiClient };
