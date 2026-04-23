import type { Metadata } from "next";
import BottomNav from "@/components/layout/BottomNav";
import NavBar from "@/components/layout/NavBar";

export const metadata: Metadata = {
  title: { default: "Shopa", template: "%s | Shopa" },
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      {/* Top nav — hidden on mobile, visible md+ */}
      <NavBar />

      {/* Content column: 390px on mobile (centered), full width on md+ */}
      <div className="w-full max-w-[390px] mx-auto md:max-w-none relative min-h-screen">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
