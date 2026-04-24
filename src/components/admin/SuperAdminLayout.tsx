"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BarChart2, University, Users, Store, GraduationCap,
  ShoppingBag, MessageSquare, Wallet, LogOut, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard",  href: "/superadmin/dashboard",  Icon: LayoutDashboard },
      { label: "Analytics",  href: "/superadmin/analytics",  Icon: BarChart2 },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Universities", href: "/superadmin/universities", Icon: University },
      { label: "Admins",       href: "/superadmin/admins",       Icon: Users },
      { label: "Vendors",      href: "/superadmin/vendors",      Icon: Store },
      { label: "Students",     href: "/superadmin/students",     Icon: GraduationCap },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Orders",      href: "/superadmin/orders",      Icon: ShoppingBag },
      { label: "Disputes",    href: "/superadmin/disputes",    Icon: MessageSquare },
      { label: "Withdrawals", href: "/superadmin/withdrawals", Icon: Wallet },
    ],
  },
];

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const adminName = user ? `${user.firstName} ${user.lastName}` : "Super Admin";

  return (
    <div className="min-h-screen bg-[#F0F4F0] flex">
      {/* ── Fixed sidebar ── */}
      <aside className="fixed top-0 left-0 w-[260px] min-h-screen bg-[#1D5620] flex flex-col z-40">
        {/* Logo */}
        <div className="h-[72px] flex items-center px-[24px] border-b border-white/10">
          <div className="flex items-center gap-[10px]">
            <div className="w-[32px] h-[32px] rounded-[6px] bg-[#FDC500] flex items-center justify-center">
              <span className="font-satoshi font-bold text-[14px] text-[#1D5620]">S</span>
            </div>
            <div>
              <p className="font-satoshi font-bold text-[14px] text-white">Shopa</p>
              <p className="font-jakarta text-[10px] text-white/50">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-[16px] overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-[8px]">
              <p className="px-[20px] py-[6px] font-jakarta text-[10px] font-bold text-white/40 uppercase tracking-[0.08em]">
                {section.title}
              </p>
              {section.items.map(({ label, href, Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link key={href} href={href}
                    className={cn(
                      "flex items-center gap-[10px] px-[20px] py-[10px] mx-[8px] rounded-[8px] transition-colors group",
                      active ? "bg-white/10" : "hover:bg-white/5"
                    )}>
                    <Icon size={16} className={active ? "text-[#FDC500]" : "text-white/60 group-hover:text-white"} strokeWidth={active ? 2 : 1.5} />
                    <span className={cn("font-jakarta text-[13px] tracking-[-0.04em]",
                      active ? "font-bold text-[#FDC500]" : "font-medium text-white/70 group-hover:text-white"
                    )}>{label}</span>
                    {active && <ChevronRight size={12} className="text-[#FDC500] ml-auto" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 px-[16px] py-[16px]">
          <div className="flex items-center gap-[10px] px-[4px] mb-[8px]">
            <div className="w-[32px] h-[32px] rounded-full bg-[#FDC500] flex items-center justify-center shrink-0">
              <span className="font-jakarta font-bold text-[12px] text-[#1D5620]">{adminName[0]}</span>
            </div>
            <div className="min-w-0">
              <p className="font-jakarta text-[12px] font-semibold text-white truncate">{adminName}</p>
              <p className="font-jakarta text-[10px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout}
            className="w-full flex items-center gap-[8px] px-[8px] py-[8px] rounded-[6px] text-white/60 hover:text-white hover:bg-white/5 transition-colors">
            <LogOut size={15} />
            <span className="font-jakarta text-[12px] font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-[64px] bg-white border-b border-[#EAEAEA] flex items-center justify-between px-[32px] sticky top-0 z-30">
          <p className="font-satoshi font-bold text-[15px] text-[#151515]">Shopa Platform Admin</p>
          <div className="flex items-center gap-[8px]">
            <div className="w-[32px] h-[32px] rounded-full bg-[#1D5620] flex items-center justify-center">
              <span className="font-jakarta font-bold text-[12px] text-white">{adminName[0]}</span>
            </div>
            <span className="font-jakarta text-[13px] font-semibold text-[#151515]">{adminName}</span>
          </div>
        </header>

        <main className="flex-1 p-[32px]">
          {children}
        </main>
      </div>
    </div>
  );
}
