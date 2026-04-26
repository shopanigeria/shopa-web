"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/lib/api";
import { tokenStorage } from "@/lib/api";
import { QUERY_KEYS, ROUTES } from "@/lib/constants";

// Maps NEXT_PUBLIC_APP_ROLE → expected JWT role value from the backend
const PORTAL_ROLE_MAP: Record<string, string> = {
  customer:   "STUDENT",
  vendor:     "VENDOR",
  admin:      "ADMIN",
  superadmin: "SUPER_ADMIN",
};

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout: logoutStore } = useAuthStore();
  const [portalError, setPortalError] = useState<string | null>(null);

  // Fetch current user on mount if token exists
  const { data: fetchedUser, isLoading: isFetching } = useQuery({
    queryKey: QUERY_KEYS.USER,
    queryFn: authService.getMe,
    enabled: !!tokenStorage.getAccess() && !isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (fetchedUser) setUser(fetchedUser);
    else if (!isFetching) setLoading(false);
  }, [fetchedUser, isFetching, setUser, setLoading]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      const role = data.user.role as string; // e.g. "STUDENT", "VENDOR", "ADMIN", "SUPER_ADMIN"
      const appRole = process.env.NEXT_PUBLIC_APP_ROLE; // e.g. "customer", "vendor", "admin", "superadmin"

      // If APP_ROLE is set, verify this user belongs to this portal.
      // Normalise both sides to uppercase so "student" == "STUDENT" etc.
      if (appRole) {
        const expectedRole = PORTAL_ROLE_MAP[appRole];
        if (expectedRole && role.toUpperCase() !== expectedRole.toUpperCase()) {
          // Wrong portal — clear the token and show an error, do NOT redirect
          tokenStorage.clearTokens();
          setPortalError("You don't have access to this portal.");
          return;
        }
      }

      setPortalError(null);
      setUser(data.user);
      queryClient.setQueryData(QUERY_KEYS.USER, data.user);

      // Route map: JWT role → same-domain path
      const sameDomainRoutes: Record<string, string> = {
        STUDENT:    ROUTES.HOME,
        VENDOR:     ROUTES.VENDOR_DASHBOARD,
        ADMIN:      ROUTES.ADMIN_DASHBOARD,
        SUPER_ADMIN: ROUTES.SUPERADMIN_DASHBOARD,
      };

      // Route map: JWT role → production subdomain URL
      // Ensure appUrl always has a protocol so we don't get double-domain paths
      const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const appUrl = rawAppUrl && !rawAppUrl.startsWith("http")
        ? `https://${rawAppUrl}`
        : rawAppUrl;
      const crossDomainRoutes: Record<string, string> = {
        STUDENT:     `${appUrl}/home`,
        VENDOR:      "https://vendor.shopshopa.com.ng/vendor/dashboard",
        ADMIN:       "https://uadmin.shopshopa.com.ng/admin/dashboard",
        SUPER_ADMIN: "https://sadmin.shopshopa.com.ng/superadmin/dashboard",
      };

      // In production each role has its own subdomain → cross-domain redirect
      if (process.env.NODE_ENV === "production" && crossDomainRoutes[role]) {
        window.location.href = crossDomainRoutes[role];
      } else {
        router.push(sameDomainRoutes[role] ?? ROUTES.HOME);
      }
    },
  });

  const signupMutation = useMutation({
    mutationFn: authService.signup,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(QUERY_KEYS.USER, data.user);
      router.push(ROUTES.HOME);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      logoutStore();
      queryClient.clear();
      router.push(ROUTES.LOGIN);
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isFetching,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoginPending: loginMutation.isPending,
    loginError: loginMutation.error,
    portalError,
    signup: signupMutation.mutate,
    signupAsync: signupMutation.mutateAsync,
    isSignupPending: signupMutation.isPending,
    signupError: signupMutation.error,
    logout: logoutMutation.mutate,
    isLogoutPending: logoutMutation.isPending,
    googleAuth: authService.googleAuth,
  };
}

/** Use this to protect client components that require auth */
export function useRequireAuth(requiredRole?: string) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      router.push(ROUTES.HOME);
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  return { user, isAuthenticated, isLoading };
}
