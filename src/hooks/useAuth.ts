"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/lib/api";
import { tokenStorage } from "@/lib/api";
import { QUERY_KEYS, ROUTES } from "@/lib/constants";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout: logoutStore } = useAuthStore();

  // Fetch current user on mount if token exists
  const { data: fetchedUser, isLoading: isFetching } = useQuery({
    queryKey: QUERY_KEYS.USER,
    queryFn: authService.getMe,
    enabled: !!tokenStorage.getAccess() && !isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (fetchedUser) setUser(fetchedUser);
    else if (!isFetching) setLoading(false);
  }, [fetchedUser, isFetching, setUser, setLoading]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(QUERY_KEYS.USER, data.user);

      const role = data.user.role as string;

      // In production, each role lives on its own subdomain.
      // window.location.href is required for cross-subdomain navigation
      // since router.push cannot cross domain boundaries.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const crossDomainRoutes: Record<string, string> = {
        customer:    `${appUrl}/home`,
        vendor:      "https://vendor.shopshopa.com.ng/vendor/dashboard",
        admin:       "https://uadmin.shopshopa.com.ng/admin/dashboard",
        super_admin: "https://sadmin.shopshopa.com.ng/superadmin/dashboard",
      };

      // In development / monorepo, all roles share the same origin.
      const sameDomainRoutes: Record<string, string> = {
        customer:    ROUTES.HOME,
        vendor:      ROUTES.VENDOR_DASHBOARD,
        admin:       ROUTES.ADMIN_DASHBOARD,
        super_admin: ROUTES.SUPERADMIN_DASHBOARD,
      };

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
