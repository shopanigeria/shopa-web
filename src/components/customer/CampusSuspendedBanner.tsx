"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";

export function CampusSuspendedBanner() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const suspended =
    user?.campusSuspended === true ||
    (user?.campus && user.campus.isActive === false);

  if (!suspended) return null;

  const campusName = user?.campus?.name ?? "Your university";

  return (
    <div className="w-full bg-[#E53935] px-[16px] py-[10px] text-center">
      <p className="font-jakarta text-[13px] font-semibold text-white leading-[1.5]">
        {campusName} has been suspended. Shopping and selling are currently unavailable.
        Please contact support for more information.
      </p>
    </div>
  );
}
