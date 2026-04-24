"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuthStore } from "@/stores/auth.store";

const MOCK_SUPERADMIN_USER = {
  id: "mock-superadmin-001",
  email: "superadmin@shopa.ng",
  firstName: "Shopa",
  lastName: "Platform",
  phone: "08000000001",
  role: "super_admin" as const,
  isVerified: true,
  createdAt: new Date().toISOString(),
};

export default function SuperAdminMockLoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    Cookies.set("shopa_mock_superadmin", "1", { expires: 1 });
    setUser(MOCK_SUPERADMIN_USER);
    router.replace("/superadmin/dashboard");
  }, [router, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="font-jakarta text-[14px] text-[#9B9B9B]">Signing in as mock super admin...</p>
    </div>
  );
}
