"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings, Package, Heart, AlertOctagon,
  Ticket, Gift, HelpCircle, FileText, LogOut,
} from "lucide-react";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/lib/constants";

const menuItems = [
  { Icon: Settings,      label: "Account Settings",     href: ROUTES.ACCOUNT_SETTINGS },
  { Icon: Package,       label: "Order History",         href: ROUTES.ORDERS },
  { Icon: Heart,         label: "Saved Items",           href: ROUTES.SAVED },
  { Icon: AlertOctagon,  label: "Raise Order Dispute",   href: ROUTES.DISPUTES_NEW },
  { Icon: Ticket,        label: "Vouchers",              href: ROUTES.VOUCHERS },
  { Icon: Gift,          label: "Referrals",             href: ROUTES.REFERRALS },
  { Icon: HelpCircle,    label: "Help & Support",        href: ROUTES.HELP },
  { Icon: FileText,      label: "Terms & Policies",      href: ROUTES.TERMS },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <ScreenHeader title="Profile" />

      <div className="pb-[100px]">
        {/* User info */}
        <div className="px-[24px] py-[24px]">
          <p className="font-jakarta text-[18px] font-semibold text-[#333333] mb-[4px] leading-[1.26] tracking-[-0.04em]">
            Hello, {user?.firstName ?? "there"}!
          </p>
          <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">
            {user?.email ?? ""}
          </p>
        </div>

        {/* Menu items */}
        <div className="px-[24px]">
          {menuItems.map(({ Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center py-[16px] border-b border-[#F7FFF8] last:border-0"
            >
              <div className="w-[32px] mr-[8px] flex items-center">
                <Icon size={22} className="text-[#333333]" />
              </div>
              <span className="font-jakarta text-[14px] font-medium text-[#545454] tracking-[-0.04em]">{label}</span>
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-[8px] mt-[32px] mb-[32px] w-full"
        >
          <LogOut size={24} className="text-[#FDC500]" />
          <span className="font-jakarta text-[18px] font-semibold text-[#FDC500] tracking-[-0.04em]">SIGN OUT</span>
        </button>
      </div>
    </div>
  );
}
