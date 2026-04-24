"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Store, MessageSquare, Users, Bell, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/admin/dashboard",  Icon: LayoutDashboard },
  { label: "Vendors",    href: "/admin/vendors",     Icon: Store },
  { label: "Disputes",   href: "/admin/disputes",    Icon: MessageSquare },
  { label: "Students",   href: "/admin/students",    Icon: Users },
];

export function AdminLayout({ children, campusName }: { children: React.ReactNode; campusName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const adminName = user ? `${user.firstName} ${user.lastName}` : "Admin";

  return (
    <div className="bg-[#F7FFF8] flex min-h-screen">

      {/* ── Sidebar — desktop only ── */}
      <aside className="hidden md:flex flex-col w-[220px] lg:w-[240px] min-h-screen bg-white border-r border-[#EAEAEA] fixed top-0 left-0 z-40">
        {/* Logo / Campus */}
        <div className="h-[72px] flex items-center px-[20px] border-b border-[#EAEAEA] gap-[10px]">
          <Image src="/images/logo.svg" alt="Shopa" width={72} height={26} priority />
          <div className="w-[1px] h-[20px] bg-[#EAEAEA] mx-[2px]" />
          <div className="min-w-0">
            <p className="font-jakarta text-[10px] font-bold text-[#9B9B9B] uppercase tracking-[0.06em]">Admin</p>
            <p className="font-jakarta text-[11px] font-semibold text-[#151515] truncate">{campusName ?? "Campus"}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-[20px] flex flex-col gap-[2px] px-[10px]">
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}
                className={cn("flex items-center gap-[10px] px-[12px] py-[10px] rounded-[8px] transition-colors",
                  active ? "bg-[#D8FFDA] text-[#2E7D32]" : "text-[#545454] hover:bg-[#F7FFF8] hover:text-[#2E7D32]"
                )}>
                <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                <span className={cn("font-jakarta text-[13px] tracking-[-0.04em]", active ? "font-semibold" : "font-medium")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-[10px] pb-[20px] border-t border-[#EAEAEA] pt-[16px]">
          <div className="px-[12px] py-[8px] mb-[4px]">
            <p className="font-jakarta text-[13px] font-semibold text-[#151515] truncate">{adminName}</p>
            <p className="font-jakarta text-[11px] text-[#9B9B9B] truncate">{user?.email}</p>
          </div>
          <button type="button" onClick={handleLogout}
            className="w-full flex items-center gap-[10px] px-[12px] py-[10px] rounded-[8px] text-[#E53935] hover:bg-[#FFEBEE] transition-colors">
            <LogOut size={18} />
            <span className="font-jakarta text-[13px] font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-[220px] lg:ml-[240px] flex flex-col">
        {/* Top bar */}
        <header className="h-[64px] bg-white border-b border-[#EAEAEA] flex items-center justify-between px-[20px] md:px-[32px] sticky top-0 z-30">
          {/* Mobile: logo. Desktop: campus name */}
          <div>
            <Image src="/images/logo.svg" alt="Shopa" width={64} height={24} priority className="md:hidden" />
            <p className="hidden md:block font-satoshi font-bold text-[15px] text-[#151515]">{campusName ?? "Campus Admin"}</p>
          </div>

          <div className="flex items-center gap-[10px]">
            <Link href="/admin/notifications" aria-label="Notifications"
              className="w-[36px] h-[36px] rounded-full bg-[#F7FFF8] border border-[#EAEAEA] flex items-center justify-center hover:bg-[#D8FFDA] transition-colors">
              <Bell size={18} className="text-[#2E7D32]" />
            </Link>
            <div className="hidden md:flex items-center gap-[8px]">
              <div className="w-[32px] h-[32px] rounded-full bg-[#2E7D32] flex items-center justify-center">
                <span className="font-jakarta text-[12px] font-bold text-white">{adminName[0]}</span>
              </div>
              <span className="font-jakarta text-[13px] font-semibold text-[#151515]">{adminName}</span>
            </div>
          </div>
        </header>

        {/* Page content — pb-[80px] on mobile to clear the fixed bottom nav */}
        <main className="flex-1 p-[20px] pb-[96px] md:pb-[40px] md:p-[32px] lg:p-[40px]">
          {children}
        </main>
      </div>

      {/* ── Bottom nav — mobile only ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#EAEAEA]">
        <div className="flex items-center justify-around h-[60px] px-[8px]">
          {NAV_ITEMS.map(({ label, href, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-[2px] flex-1">
                <Icon size={22} className={active ? "text-[#2E7D32]" : "text-[#9B9B9B]"} strokeWidth={active ? 2 : 1.5} />
                <span className={cn("font-jakarta text-[10px] tracking-[-0.04em]",
                  active ? "text-[#2E7D32] font-semibold" : "text-[#9B9B9B] font-normal"
                )}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
