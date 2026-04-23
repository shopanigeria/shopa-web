"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, CloudOff } from "lucide-react";
import { useProducts, useCategories, usePopularProducts } from "@/hooks/useProducts";
import HomeHeader from "@/components/customer/HomeHeader";
import ProductCard from "@/components/customer/ProductCard";
import { ROUTES } from "@/lib/constants";
import type { Product, Category } from "@/types";

import {
  Shirt,
  BookOpen,
  Smartphone,
  ShoppingBasket,
  Dumbbell,
  Sparkles,
  Grid2X2,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  clothing: Shirt,
  fashion: Shirt,
  stationery: BookOpen,
  books: BookOpen,
  electronics: Smartphone,
  gadgets: Smartphone,
  provisions: ShoppingBasket,
  food: ShoppingBasket,
  sports: Dumbbell,
  beauty: Sparkles,
  "body care": Sparkles,
};

function getCategoryIcon(name: string): React.ElementType {
  const key = name.toLowerCase();
  for (const [k, Icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return Icon;
  }
  return Grid2X2;
}

// ─── Skeleton grid ────────────────────────────────────────────────────────────
function ProductRowSkeleton() {
  return (
    <div className="flex gap-[12px] overflow-hidden md:hidden">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-[160px] shrink-0 animate-pulse">
          <div className="h-[210px] rounded-[12px] bg-[#EAEAEA]" />
        </div>
      ))}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-[16px]">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-[260px] rounded-[12px] bg-[#EAEAEA]" />
        </div>
      ))}
    </div>
  );
}

// ─── Product section ──────────────────────────────────────────────────────────
function ProductSection({
  title,
  seeAllHref,
  products,
  isLoading,
}: {
  title: string;
  seeAllHref: string;
  products: Product[];
  isLoading: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-[12px]">
        <span className="font-jakarta font-semibold text-[18px] md:text-[20px] text-[#151515] leading-[1.26] tracking-[-0.04em]">
          {title}
        </span>
        <Link
          href={seeAllHref}
          className="font-jakarta text-[12px] md:text-[13px] font-bold text-[#2E7D32] leading-[1.26] tracking-[-0.04em] underline"
        >
          See all
        </Link>
      </div>

      {isLoading ? (
        <>
          <ProductRowSkeleton />
          <ProductGridSkeleton />
        </>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <ShoppingBag size={48} className="text-[#9B9B9B]" />
          <p className="mt-4 font-jakarta text-[13px] text-[#9B9B9B] text-center tracking-[-0.04em]">
            No products available yet
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: horizontal scroll row */}
          <div className="md:hidden flex gap-[8px] overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {/* Tablet/Desktop: grid */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-[16px]">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} className="w-full" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Homepage ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: popularData, isLoading: popularLoading } = usePopularProducts();
  const { data: forYouData, isLoading: forYouLoading, isError, refetch } = useProducts({ limit: 20 });
  const { data: categories, isLoading: catsLoading } = useCategories();

  const allProducts = forYouData?.data ?? [];

  const popularProducts =
    popularData && Array.isArray(popularData) && popularData.length > 0
      ? popularData
      : allProducts.slice(0, Math.ceil(allProducts.length / 2));

  const forYouProducts = allProducts.slice(Math.ceil(allProducts.length / 2));

  const q = searchQuery.toLowerCase();
  const filteredPopular = q
    ? popularProducts.filter((p) => p.name.toLowerCase().includes(q))
    : popularProducts;
  const filteredForYou = q
    ? forYouProducts.filter((p) => p.name.toLowerCase().includes(q))
    : forYouProducts;

  if (isError) {
    return (
      <div className="min-h-screen bg-[#F7FFF8]">
        <HomeHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <div className="flex flex-col items-center justify-center px-[24px] py-20">
          <CloudOff size={48} className="text-[#9B9B9B]" />
          <p className="mt-4 font-jakarta text-[14px] text-[#9B9B9B] text-center tracking-[-0.04em]">
            Failed to load products
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-[8px] bg-[#2E7D32] px-[24px] py-[12px]"
          >
            <span className="font-jakarta text-[14px] font-semibold text-white tracking-[-0.04em]">Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      {/* Mobile header (hidden on md+, NavBar takes over) */}
      <HomeHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />


<div className="px-[24px] md:px-6 lg:px-8 pt-[20px] pb-[100px] md:pb-[40px] flex flex-col gap-[24px] md:gap-[32px] max-w-[1280px] md:mx-auto">

        {/* ── Categories ── */}
        <div>
          <div className="flex items-center justify-between mb-[12px]">
            <span className="font-jakarta font-semibold text-[18px] md:text-[20px] text-[#151515] leading-[1.26] tracking-[-0.04em]">
              Categories
            </span>
            <Link
              href={ROUTES.CATEGORIES}
              className="font-jakarta text-[12px] md:text-[13px] font-bold text-[#2E7D32] leading-[1.26] tracking-[-0.04em] underline"
            >
              See all
            </Link>
          </div>

          <div className="flex gap-[10px] overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch] md:flex-wrap md:overflow-visible">
            {catsLoading
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-[91px] h-[30px] shrink-0 rounded-[5px] bg-[#EAEAEA] animate-pulse" />
                ))
              : (categories ?? []).map((cat: Category) => {
                  const Icon = getCategoryIcon(cat.name);
                  return (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.id}`}
                      className="shrink-0 flex items-center gap-[10px] bg-[#D8FFDA] rounded-[5px] h-[30px] px-[10px] hover:bg-[#c4f5c7] transition-colors md:h-[34px] md:px-[14px]"
                    >
                      <Icon size={14} className="text-[#2E7D32]" />
                      <span className="font-satoshi font-medium text-[12px] md:text-[13px] text-[#2E7D32] leading-[1.35] tracking-[-0.04em] whitespace-nowrap">
                        {cat.name}
                      </span>
                    </Link>
                  );
                })}
          </div>
        </div>

        {/* ── Popular in your school ── */}
        <ProductSection
          title="Popular in your school"
          seeAllHref={`${ROUTES.PRODUCTS}?title=Popular+in+your+school`}
          products={filteredPopular}
          isLoading={popularLoading || forYouLoading}
        />

        {/* ── For You ── */}
        <ProductSection
          title="For You"
          seeAllHref={`${ROUTES.PRODUCTS}?title=For+You`}
          products={filteredForYou}
          isLoading={forYouLoading}
        />
      </div>
    </div>
  );
}
