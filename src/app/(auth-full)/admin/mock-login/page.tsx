"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuthStore } from "@/stores/auth.store";

const MOCK_ADMIN_USER = {
  id: "mock-admin-001",
  email: "admin@crawford.edu",
  firstName: "Chidi",
  lastName: "Nwosu",
  phone: "08012345678",
  role: "admin" as const,
  isVerified: true,
  createdAt: new Date().toISOString(),
};

export default function AdminMockLoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    Cookies.set("shopa_mock_admin", "1", { expires: 1 });
    setUser(MOCK_ADMIN_USER);
    router.replace("/admin/dashboard");
  }, [router, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="font-jakarta text-[14px] text-[#9B9B9B]">Signing in as mock campus admin...</p>
    </div>
  );
}
