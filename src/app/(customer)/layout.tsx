import type { Metadata } from "next";
import BottomNav from "@/components/layout/BottomNav";
import NavBar from "@/components/layout/NavBar";
import { PushNotificationInit } from "@/components/customer/PushNotificationInit";
import { CampusSuspendedBanner } from "@/components/customer/CampusSuspendedBanner";

export const metadata: Metadata = {
  title: { default: "Shopa", template: "%s | Shopa" },
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      {/* Top nav — hidden on mobile, visible md+ */}
      <NavBar />

      {/* Content column: 390px on mobile (centered), full width on md+ */}
      <PushNotificationInit />
      <CampusSuspendedBanner />
      <div className="w-full min-w-0 relative min-h-screen">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
