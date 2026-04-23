"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid2X2, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import { ROUTES } from "@/lib/constants";

const tabs = [
  { name: "Home", href: ROUTES.HOME, icon: Home },
  { name: "Categories", href: ROUTES.CATEGORIES, icon: Grid2X2 },
  { name: "Cart", href: ROUTES.CART, icon: ShoppingCart },
  { name: "Profile", href: ROUTES.PROFILE, icon: User },
] as const;

const HIDDEN_ON: RegExp[] = [
  /^\/orders\/[^/]+$/,    // individual order detail
  /^\/account-settings$/, // account settings
  /^\/saved$/,            // saved items
  /^\/vouchers$/,         // vouchers
  /^\/referrals$/,        // referrals
  /^\/help$/,             // help & support
  /^\/terms$/,            // terms & policies
  /^\/disputes\/new$/,    // raise dispute
  /^\/orders$/,           // order history list
  /^\/checkout$/,         // checkout
  /^\/checkout\/success$/, // checkout success
  /^\/products\/[^/]+$/,  // product detail
];

export default function BottomNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems());

  if (HIDDEN_ON.some((pattern) => pattern.test(pathname))) return null;

  return (
    /* Fixed to viewport bottom, centered within the 390px content column — hidden on tablet/desktop */
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-[390px] px-[24px] pb-[17px] pointer-events-none">
        <div className="h-[55px] rounded-[48px] bg-[rgba(255,255,255,0.75)] shadow-[0px_0px_1px_0px_rgba(0,0,0,0.3)] backdrop-blur-sm flex flex-row items-center px-[4px] pointer-events-auto">
          {tabs.map(({ name, href, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (name === "Home" && pathname === "/");
            const isCart = name === "Cart";

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center h-[47px] rounded-[48px] gap-[2px]",
                  isActive ? "bg-[rgba(51,51,51,0.1)]" : ""
                )}
              >
                <div className="relative">
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={isActive ? "text-[#2E7D32]" : "text-[#151515]"}
                  />
                  {isCart && totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#FDC500] text-[#151515] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "font-jakarta text-[12px] font-normal leading-[1.26] tracking-[-0.04em]",
                    isActive ? "text-[#2E7D32]" : "text-[#151515]"
                  )}
                >
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
