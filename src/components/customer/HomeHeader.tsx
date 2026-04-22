"use client";

import Image from "next/image";
import { Search, ShoppingCart, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { useCartStore } from "@/stores/cart.store";

interface HomeHeaderProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

export default function HomeHeader({ searchQuery, onSearchChange }: HomeHeaderProps) {
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <div className="sticky top-0 z-40 bg-[#2E7D32] h-[155px] rounded-b-[12px] relative overflow-visible shrink-0">
      {/* Shopa logo — left */}
      <div className="absolute left-[25px] top-[43px]">
        <Image src="/images/logo.svg" alt="Shopa" width={95} height={26} priority />
      </div>

      {/* Icons — right */}
      <div className="absolute right-[24px] top-[46px] flex items-center gap-[20px]">
        <button
          type="button"
          onClick={() => router.push(ROUTES.CART)}
          className="relative"
          aria-label="Cart"
        >
          <ShoppingCart size={22} className="text-white" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FDC500] text-[#151515] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </button>
        
      </div>

      {/* Search bar */}
      <div className="absolute left-[24px] right-[24px] top-[95px] h-[45px] bg-white rounded-[12px] flex items-center gap-[10px] px-[10px]">
        <Search size={24} className="text-[#C2C2C2] shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search for any item.."
          className="flex-1 text-[12px] text-[#151515] placeholder:text-[#C2C2C2] bg-transparent focus:outline-none font-jakarta"
        />
      </div>
    </div>
  );
}
