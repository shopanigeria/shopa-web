"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/customer/ProductCard";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

// RN sort options — exactly as defined in PopularInSchoolScreen
type SortOption =
  | "bestRatings"
  | "popularity"
  | "newestFirst"
  | "oldestFirst"
  | "priceLowToHigh"
  | "priceHighToLow";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "bestRatings", label: "Best ratings" },
  { value: "popularity", label: "Popularity" },
  { value: "newestFirst", label: "Newest first" },
  { value: "oldestFirst", label: "Oldest first" },
  { value: "priceLowToHigh", label: "Price (low to high)" },
  { value: "priceHighToLow", label: "Price (high to low)" },
];

function toApiSort(sort: SortOption) {
  if (sort === "newestFirst") return "newest" as const;
  if (sort === "priceLowToHigh") return "price_asc" as const;
  if (sort === "priceHighToLow") return "price_desc" as const;
  return "popular" as const;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const title = searchParams.get("title") ?? "Products";

  const [selectedSort, setSelectedSort] = useState<SortOption>("bestRatings");
  const [showSortModal, setShowSortModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError } = useProducts({
    categoryId,
    sortBy: toApiSort(selectedSort),
    limit: 20,
  });

  const products: Product[] = data?.data ?? [];
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // bg-main-bg = #F7FFF8
    <div className="flex-1 bg-[#F7FFF8] min-h-screen">

      {/* ScreenHeader — direct translation of RN ScreenHeader component */}
      <ScreenHeader
        title={title}
        showBack
        enableSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showCart
      />

      {/* Sort Button */}
      <div className="px-[24px] py-[16px]">
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setShowSortModal((v) => !v)}
            className="flex items-center gap-[8px] bg-[#D8FFDA] rounded-[5px] h-[35px] px-[12px]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
              <path d="M3 6h18M6 12h12M10 18h4" />
            </svg>
            <span className="font-jakarta font-semibold text-[13px] text-[#2E7D32] leading-[1.26] tracking-[-0.04em]">
              SORT BY
            </span>
          </button>

          {showSortModal && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortModal(false)} />
              <div className="absolute left-0 top-full mt-[4px] z-50 w-[220px] rounded-[12px] bg-white border border-[#2E7D32] shadow-[0px_2px_8px_rgba(0,0,0,0.1)] px-[16px] py-[12px]">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setSelectedSort(option.value); setShowSortModal(false); }}
                    className="w-full flex items-center gap-[12px] py-[8px]"
                  >
                    <div className="w-[16px] h-[16px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center shrink-0">
                      {selectedSort === option.value && (
                        <div className="w-[8px] h-[8px] rounded-full bg-[#2E7D32]" />
                      )}
                    </div>
                    <span className={cn(
                      "font-jakarta text-[13px] leading-[1.26] tracking-[-0.04em] text-[#151515]",
                      selectedSort === option.value ? "font-semibold" : "font-normal"
                    )}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Products Grid — flex-row flex-wrap justify-between px-6 pb-6 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 px-6 pb-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-[16px] border border-[#E0E0E0] bg-white">
                  <div className="h-[180px] rounded-t-[16px] bg-[#E0E0E0]" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-[#E0E0E0] rounded w-3/4" />
                    <div className="h-4 bg-[#E0E0E0] rounded w-1/2" />
                    <div className="h-3 bg-[#E0E0E0] rounded w-1/3" />
                    <div className="h-10 bg-[#E0E0E0] rounded mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <p className="font-jakarta text-[14px] text-[#9B9B9B] text-center tracking-[-0.04em]">Failed to load products</p>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-4 rounded-[8px] bg-[#2E7D32] px-6 py-3"
            >
              <span className="font-jakarta text-[14px] font-semibold text-white tracking-[-0.04em]">Try Again</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 px-6 pb-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
