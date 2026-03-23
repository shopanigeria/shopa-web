import { apiClient, tokenStorage } from "../client";
import type { User } from "@/types";

export interface LoginPayload { email: string; password: string; }
export interface SignupPayload { firstName: string; email: string; phone?: string; password: string; university?: string; }
export interface AuthResponse { user: User; accessToken: string; refreshToken: string; }

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },
  signup: async (payload: SignupPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data;
  },
  logout: async (): Promise<void> => {
    try { await apiClient.post("/auth/logout"); } finally { tokenStorage.clearTokens(); }
  },
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<User>("/users/me");
    return data;
  },
  googleAuth: (redirectPath?: string): void => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const callback = redirectPath ?? "/home";
    window.location.href = `${apiUrl}/auth/google?redirect=${encodeURIComponent(callback)}`;
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/auth/forgot-password", { email });
    return data;
  },
  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post("/auth/reset-password", { token, password });
    return data;
  },
};
