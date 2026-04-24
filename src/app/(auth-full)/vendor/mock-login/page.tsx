"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAuthStore } from "@/stores/auth.store";

const MOCK_VENDOR_USER = {
  id: "mock-vendor-001",
  email: "vendor@shopa.test",
  firstName: "Lorem",
  lastName: "Stores",
  phone: "08012345678",
  role: "vendor" as const,
  isVerified: true,
  createdAt: new Date().toISOString(),
};

export default function VendorMockLoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Set mock vendor cookie so middleware allows /vendor/* routes
    Cookies.set("shopa_mock_vendor", "1", { expires: 1 });
    // Set user in store so useAuth sees a vendor
    setUser(MOCK_VENDOR_USER);
    router.replace("/vendor/dashboard");
  }, [router, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="font-jakarta text-[14px] text-[#9B9B9B]">Signing in as mock vendor...</p>
    </div>
  );
}
