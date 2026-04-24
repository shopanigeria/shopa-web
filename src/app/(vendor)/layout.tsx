"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ClipboardList, Headphones, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_TABS = [
  { label: "Dashboard", href: "/vendor/dashboard", Icon: LayoutDashboard },
  { label: "Products", href: "/vendor/products", Icon: Package },
  { label: "Orders", href: "/vendor/orders", Icon: ClipboardList },
  { label: "Disputes", href: "/vendor/disputes", Icon: Headphones },
  { label: "Earnings", href: "/vendor/earnings", Icon: Wallet },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F7FFF8] flex">

      {/* ── Sidebar nav — tablet/desktop only ── */}
      <aside className="hidden md:flex flex-col w-[220px] lg:w-[240px] min-h-screen bg-white border-r border-[#EAEAEA] fixed top-0 left-0 z-40">
        {/* Logo */}
        <div className="h-[72px] flex items-center px-[24px] border-b border-[#EAEAEA]">
          <Image src="/images/logo-green.svg" alt="Shopa" width={90} height={32} priority />
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-[24px] flex flex-col gap-[4px] px-[12px]">
          {NAV_TABS.map(({ label, href, Icon }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors",
                  active
                    ? "bg-[#D8FFDA] text-[#2E7D32]"
                    : "text-[#545454] hover:bg-[#F7FFF8] hover:text-[#2E7D32]"
                )}
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
                <span className={cn(
                  "font-jakarta text-[14px] tracking-[-0.04em]",
                  active ? "font-semibold" : "font-medium"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-[220px] lg:ml-[240px]">
        {/* Mobile: constrained + bottom nav padding */}
        <div className="w-full max-w-[390px] mx-auto md:max-w-none md:mx-0 relative min-h-screen pb-[80px] md:pb-0">
          {children}
        </div>
      </div>

      {/* ── Bottom nav — mobile only ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EAEAEA]">
        <div className="flex items-center justify-around h-[60px] px-[8px] max-w-[390px] mx-auto">
          {NAV_TABS.map(({ label, href, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-[2px] flex-1">
                <Icon
                  size={22}
                  className={active ? "text-[#2E7D32]" : "text-[#9B9B9B]"}
                  strokeWidth={active ? 2 : 1.5}
                />
                <span className={cn(
                  "font-jakarta text-[10px] tracking-[-0.04em]",
                  active ? "text-[#2E7D32] font-semibold" : "text-[#9B9B9B] font-normal"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
