"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Home, Grid2X2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/lib/constants";

const navLinks = [
  { label: "Home", href: ROUTES.HOME, icon: Home },
  { label: "Categories", href: ROUTES.CATEGORIES, icon: Grid2X2 },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems());
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${ROUTES.PRODUCTS}?title=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="hidden md:flex sticky top-0 z-50 w-full bg-[#2E7D32] shadow-md">
      <div className="w-full max-w-[1280px] mx-auto px-6 lg:px-8 h-[64px] flex items-center gap-6">

        {/* Logo */}
        <Link href={ROUTES.HOME} className="shrink-0">
          <Image src="/images/logo.svg" alt="Shopa" width={100} height={28} priority />
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (label === "Home" && pathname === "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-[6px] px-[14px] py-[8px] rounded-[8px] font-jakarta text-[14px] font-medium transition-colors",
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-[480px]">
          <div className="flex items-center bg-white rounded-[8px] px-[12px] h-[38px] gap-[8px]">
            <Search size={16} className="text-[#C2C2C2] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for any item..."
              className="flex-1 font-jakarta text-[14px] text-[#151515] placeholder:text-[#C2C2C2] bg-transparent focus:outline-none tracking-[-0.04em]"
            />
          </div>
        </form>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-4 shrink-0">
          {/* Cart */}
          <button
            type="button"
            onClick={() => router.push(ROUTES.CART)}
            className="relative p-[8px] hover:bg-white/10 rounded-[8px] transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart size={22} className="text-white" />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 bg-[#FDC500] text-[#151515] font-jakarta text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none tracking-[-0.04em]">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>

          {/* Profile */}
          <Link
            href={ROUTES.PROFILE}
            className="flex items-center gap-[8px] hover:bg-white/10 px-[10px] py-[6px] rounded-[8px] transition-colors"
          >
            <div className="w-[32px] h-[32px] rounded-full bg-white/20 flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            {user?.firstName && (
              <span className="font-jakarta text-[13px] font-medium text-white tracking-[-0.04em] hidden lg:block">
                {user.firstName}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
