"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { tokenStorage, authService } from "@/lib/api";
import { Loader2 } from "lucide-react";

function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setTokens } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (!accessToken || !refreshToken) {
      router.push("/login?error=google_failed");
      return;
    }

    tokenStorage.setTokens(accessToken, refreshToken);
    setTokens(accessToken);

    authService.getMe().then((user) => {
      setUser(user);
      const roleRoutes: Record<string, string> = {
        STUDENT: "/home",
        VENDOR: "/vendor/dashboard",
        ADMIN: "/admin/dashboard",
      };
      router.push(roleRoutes[user.role] ?? "/home");
    }).catch(() => {
      router.push("/login?error=google_failed");
    });
  }, [searchParams, router, setUser, setTokens]);

  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-secondary mx-auto mb-4" />
        <p className="text-white text-[14px] font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return <Suspense><GoogleCallbackHandler /></Suspense>;
}
