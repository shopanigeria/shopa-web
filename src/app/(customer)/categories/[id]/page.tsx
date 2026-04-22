"use client";

import { useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { Package } from "lucide-react";
import { useCategories, useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/customer/ProductCard";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { cn } from "@/lib/utils";

type SortOption =
  | "bestRatings"
  | "popularity"
  | "newestFirst"
  | "oldestFirst"
  | "priceLowToHigh"
  | "priceHighToLow";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "bestRatings", label: "Best ratings" },
  { value: "popularity", label: "Popularity" },
  { value: "newestFirst", label: "Newest first" },
  { value: "oldestFirst", label: "Oldest first" },
  { value: "priceLowToHigh", label: "Price (low to high)" },
  { value: "priceHighToLow", label: "Price (high to low)" },
];

function toApiSort(s: SortOption) {
  if (s === "newestFirst" || s === "oldestFirst") return "newest" as const;
  if (s === "priceLowToHigh") return "price_asc" as const;
  if (s === "priceHighToLow") return "price_desc" as const;
  return "popular" as const;
}

function CategoryContent() {
  const { id } = useParams<{ id: string }>();
  const [sort, setSort] = useState<SortOption>("bestRatings");
  const [showSort, setShowSort] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories } = useCategories();
  const category = categories?.find((c) => c.id === id);

  const { data, isLoading } = useProducts({
    categoryId: id,
    sortBy: toApiSort(sort),
    limit: 40,
  });

  const allProducts = data?.data ?? [];
  const products = searchQuery
    ? allProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allProducts;

  return (
    <div className="min-h-screen bg-[#F7FFF8]">

      {/* Header */}
      <ScreenHeader
        title={category?.name ?? "Category"}
        showBack
        enableSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search in category..."
        showCart
      />

      {/* Sort Button */}
      <div className="px-[24px] py-[16px]">
        <button
          type="button"
          onClick={() => setShowSort((v) => !v)}
          className="flex items-center gap-[8px] bg-[#D8FFDA] rounded-[5px] h-[35px] px-[12px] self-start"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2">
            <path d="M3 6h18M6 12h12M10 18h4" />
          </svg>
          <span className="font-jakarta font-semibold text-[13px] text-[#2E7D32] leading-[1.26]">
            SORT BY
          </span>
        </button>
      </div>

      {/* Sort dropdown */}
      {showSort && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
          <div className="absolute left-[24px] z-50 w-[220px] rounded-[12px] bg-white border border-[#2E7D32] shadow-[0px_2px_8px_rgba(0,0,0,0.1)] px-[16px] py-[12px]"
            style={{ top: 180 }}
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setSort(opt.value); setShowSort(false); }}
                className="w-full flex items-center gap-[12px] py-[8px]"
              >
                <div className="w-[16px] h-[16px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center shrink-0">
                  {sort === opt.value && (
                    <div className="w-[8px] h-[8px] rounded-full bg-[#2E7D32]" />
                  )}
                </div>
                <span
                  className={cn(
                    "font-jakarta text-[13px] leading-[1.26]",
                    sort === opt.value
                      ? "font-semibold text-[#151515]"
                      : "font-normal text-[#151515]"
                  )}
                >
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Product grid */}
      <div className="px-[24px] pb-[100px]">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-[16px]">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-[265px] rounded-[12px] bg-[#EAEAEA]" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package size={40} className="text-[#C2C2C2]" />
            <p className="mt-3 font-jakarta text-[13px] text-[#9B9B9B] text-center">
              {searchQuery ? "No products match your search" : "No products available yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[16px]">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} className="w-full" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense>
      <CategoryContent />
    </Suspense>
  );
}
