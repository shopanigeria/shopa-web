import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const ACCESS_TOKEN_KEY = "shopa_access_token";
const REFRESH_TOKEN_KEY = "shopa_refresh_token";

// ─── Token helpers ────────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess: () => Cookies.get(ACCESS_TOKEN_KEY) ?? null,
  getRefresh: () => Cookies.get(REFRESH_TOKEN_KEY) ?? null,
  setTokens: (access: string, refresh: string) => {
    // HttpOnly cookies must be set server-side; these are client-accessible fallbacks
    // For production, the backend should set HttpOnly cookies directly
    Cookies.set(ACCESS_TOKEN_KEY, access, {
      expires: 1, // 1 day
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    Cookies.set(REFRESH_TOKEN_KEY, refresh, {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  },
  clearTokens: () => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  },
};

// ─── Axios instance ───────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ─── Request interceptor — attach token ───────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 + token refresh ───────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefresh();

      if (!refreshToken) {
        tokenStorage.clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefresh } = data;
        tokenStorage.setTokens(accessToken, newRefresh);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
