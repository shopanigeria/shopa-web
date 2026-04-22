"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import { ROUTES } from "@/lib/constants";

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  enableSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  showCart?: boolean;
  backgroundColor?: string;
  rightElement?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  showBack = false,
  enableSearch = false,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search for any item...",
  showCart = false,
  backgroundColor = "#2E7D32",
  rightElement,
}: ScreenHeaderProps) {
  const router = useRouter();
  const [searchVisible, setSearchVisible] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());

  return (
    <div
      className="px-6 pb-4 pt-[70px] rounded-b-3xl"
      style={{ backgroundColor }}
    >
      {searchVisible ? (
        /* Search mode */
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setSearchVisible(false)} aria-label="Close search">
            <ChevronLeft size={24} className="text-white" />
          </button>
          <div className="flex flex-1 items-center rounded-xl bg-white px-4">
            <Search size={20} className="text-[#757575] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="ml-2 flex-1 py-3 font-jakarta text-[15px] text-[#212121] placeholder:text-[#757575] bg-transparent focus:outline-none tracking-[-0.04em]"
            />
          </div>
          {showCart && (
            <button
              type="button"
              onClick={() => router.push(ROUTES.CART)}
              className="ml-3 relative"
              aria-label="Cart"
            >
              <ShoppingCart size={24} className="text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-secondary text-neutral-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>
          )}
        </div>
      ) : (
        /* Normal mode */
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center">
            {showBack && (
              <button
                type="button"
                onClick={() => router.back()}
                className="mr-3"
                aria-label="Go back"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
            )}
            <p className="flex-1 font-jakarta text-[18px] font-semibold text-white capitalize truncate tracking-[-0.04em]">
              {title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {enableSearch && (
              <button
                type="button"
                onClick={() => setSearchVisible(true)}
                aria-label="Search"
              >
                <Search size={24} className="text-white" />
              </button>
            )}
            {showCart && (
              <button
                type="button"
                onClick={() => router.push(ROUTES.CART)}
                className={cn("relative", rightElement ? "mr-3" : "")}
                aria-label="Cart"
              >
                <ShoppingCart size={24} className="text-white" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-secondary text-neutral-black font-jakarta text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center tracking-[-0.04em]">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>
            )}
            {rightElement}
          </div>
        </div>
      )}
    </div>
  );
}
