import type { Metadata } from "next";
import BottomNav from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: { default: "Shopa", template: "%s | Shopa" },
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      {/* Max-width phone frame — centered on desktop */}
      <div className="w-full max-w-[390px] mx-auto relative min-h-screen">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
