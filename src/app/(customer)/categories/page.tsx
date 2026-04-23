"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Shirt, BookOpen, Smartphone, ShoppingBasket, Dumbbell, Sparkles, Package,
} from "lucide-react";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { useCategories } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubCategoryItem {
  id: string;
  name: string;
  image: string;
}

interface SubCategorySection {
  id: string;
  title: string;
  items: SubCategoryItem[];
}

interface MainCategory {
  id: string;
  name: string;
  Icon: React.ElementType;
  sections: SubCategorySection[];
}

// ─── Static categories — exactly matching Figma design ───────────────────────
const STATIC_CATEGORIES: MainCategory[] = [
  {
    id: "cloth",
    name: "Clothing & Accessories",
    Icon: Shirt,
    sections: [
    {
      id: "s1",
      title: "MEN'S FASHION",
      items: [
        { id: "c1", name: "Shirts", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop" },
        { id: "c2", name: "Trousers", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=300&fit=crop" },
        { id: "c3", name: "Shorts", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=300&h=300&fit=crop" },
        { id: "c4", name: "T-shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop" },
        { id: "c5", name: "Underwears", image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=300&h=300&fit=crop" },
        { id: "c6", name: "Jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop" },
        { id: "c7", name: "Sportswear", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop" },
        { id: "c8", name: "Watches & Jewelry", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=300&h=300&fit=crop" },
        { id: "c9", name: "Footwear", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop" },
        { id: "c10", name: "Bags", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop" },
        { id: "c11", name: "Other Male Accessories", image: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=300&h=300&fit=crop" },
        { id: "c12", name: "Other Male Clothing", image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&h=300&fit=crop" },
      ],
    },
    {
      id: "s2",
      title: "WOMEN'S FASHION",
      items: [
        { id: "c13", name: "Dresses", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop" },
        { id: "c14", name: "Trousers", image: "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=300&h=300&fit=crop" },
        { id: "c15", name: "Tops", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop" },
        { id: "c16", name: "Skirts", image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=300&h=300&fit=crop" },
        { id: "c73", name: "Underwears", image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=300&h=300&fit=crop" },
        { id: "c74", name: "Swimwear", image: "https://images.unsplash.com/photo-1520367745676-56196632073f?w=300&h=300&fit=crop" },
        { id: "c17", name: "Co-ord sets", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop" },
        { id: "c18", name: "Jewelry", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&h=300&fit=crop" },
        { id: "c19", name: "Footwear", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop" },
        { id: "c20", name: "Bags", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop" },
        { id: "c21", name: "Other Women Accessories", image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=300&h=300&fit=crop" },
        { id: "c75", name: "Other Women Clothing", image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&h=300&fit=crop" },
      ],
    },
    {
      id: "s10",
      title: "UNISEX FASHION",
      items: [
        { id: "c22", name: "Unisex Clothing", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop" },
        { id: "c23", name: "Unisex Accessories", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&h=300&fit=crop" },
        { id: "c24", name: "Unisex Footwear", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop" },
      ],
    },
  ],
  },
  {
    id: "body",
    name: "Body care & Beauty",
    Icon: Sparkles,
    sections: [
    {
      id: "s3",
      title: "FRAGRANCES",
      items: [
        { id: "c25", name: "Men's Perfumes", image: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=300&h=300&fit=crop" },
        { id: "c26", name: "Women's Perfume", image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59bd9?w=300&h=300&fit=crop" },
        { id: "c27", name: "Unisex Perfumes", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop" },
      ],
    },
    {
      id: "s4",
      title: "BODY CARE",
      items: [
        { id: "c28", name: "Skin Care", image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=300&fit=crop" },
        { id: "c29", name: "Body Creams & Lotions", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop" },
        { id: "c30", name: "Deodorants", image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=300&h=300&fit=crop" },
        { id: "c31", name: "Soap", image: "https://images.unsplash.com/photo-1600857544200-242c40384d51?w=300&h=300&fit=crop" },
        { id: "c70", name: "Lip Care", image: "https://images.unsplash.com/photo-1586495777744-4e6b0d6eda0f?w=300&h=300&fit=crop" },
        { id: "c71", name: "Others", image: "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=300&h=300&fit=crop" },
      ],
    },
    {
      id: "s5",
      title: "PERSONAL CARE",
      items: [
        { id: "c32", name: "Oral Care", image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=300&h=300&fit=crop" },
        { id: "c33", name: "Feminine Care", image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=300&h=300&fit=crop" },
        { id: "c34", name: "Men's Care", image: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=300&h=300&fit=crop" },
        { id: "c76", name: "Others", image: "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=300&h=300&fit=crop" },
      ],
    },
    {
      id: "s12",
      title: "HAIR CARE",
      items: [
        { id: "c35", name: "Hair Products", image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=300&h=300&fit=crop" },
        { id: "c36", name: "Hair Accessories", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop" },
        { id: "c77", name: "Hair Appliances", image: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=300&h=300&fit=crop" },
        { id: "c37", name: "Wigs, Weaves & Extensions", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop" },
      ],
    },
    {
      id: "s13",
      title: "MAKEUP",
      items: [
        { id: "c38", name: "Makeup Products", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop" },
        { id: "c39", name: "Makeup Accessories", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=300&fit=crop" },
        { id: "c40", name: "Nails", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&h=300&fit=crop" },
        { id: "c78", name: "Others", image: "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=300&h=300&fit=crop" },
      ],
    },
  ],
  },
  {
    id: "provision",
    name: "Provisions",
    Icon: ShoppingBasket,
    sections: [
    {
      id: "s6",
      title: "PROVISIONS",
      items: [
        { id: "c41", name: "Cereal", image: "https://images.unsplash.com/photo-1563297007-0686b7003af7?w=300&h=300&fit=crop" },
        { id: "c42", name: "Milk & Beverages", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop" },
        { id: "c43", name: "Snacks & Confectioneries", image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300&h=300&fit=crop" },
        { id: "c44", name: "Others", image: "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=300&h=300&fit=crop" },
      ],
    },
  ],
  },
  {
    id: "sport",
    name: "Sports",
    Icon: Dumbbell,
    sections: [
    {
      id: "s7",
      title: "SPORTS",
      items: [
        { id: "c72", name: "Swimming", image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=300&h=300&fit=crop" },
        { id: "c45", name: "Football", image: "https://images.unsplash.com/photo-1614632537423-1e6c2e26c05d?w=300&h=300&fit=crop" },
        { id: "c46", name: "Basketball", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=300&fit=crop" },
        { id: "c47", name: "Fitness", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=300&fit=crop" },
        { id: "c48", name: "Sportswear", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop" },
        { id: "c49", name: "Footwear", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop" },
        { id: "c50", name: "Other Sports Accessories", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop" },
      ],
    },
  ],
  },
  {
    id: "gadget",
    name: "Gadgets & Accessories",
    Icon: Smartphone,
    sections: [
    {
      id: "s8",
      title: "GADGETS",
      items: [
        { id: "c51", name: "Smartphones", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop" },
        { id: "c79", name: "Mobile Phones", image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=300&h=300&fit=crop" },
        { id: "c80", name: "Tablets", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop" },
        { id: "c81", name: "iPads", image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=300&h=300&fit=crop" },
        { id: "c52", name: "Laptops", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop" },
        { id: "c82", name: "Desktops", image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=300&h=300&fit=crop" },
        { id: "c53", name: "Earphones", image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=300&h=300&fit=crop" },
        { id: "c54", name: "Headsets", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop" },
        { id: "c55", name: "Speakers", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop" },
        { id: "c57", name: "Gaming", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop" },
        { id: "c56", name: "Smart Watches", image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=300&h=300&fit=crop" },
        { id: "c58", name: "Other Gadgets", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=300&fit=crop" },
      ],
    },
    {
      id: "s9",
      title: "ACCESSORIES",
      items: [
        { id: "c59", name: "Phone Accessories", image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=300&h=300&fit=crop" },
        { id: "c60", name: "Computer Accessories", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop" },
        { id: "c83", name: "Tablet Accessories", image: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=300&h=300&fit=crop" },
        { id: "c61", name: "Power Banks", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&h=300&fit=crop" },
        { id: "c62", name: "Chargers", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&h=300&fit=crop" },
        { id: "c63", name: "Gaming Accessories", image: "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=300&h=300&fit=crop" },
        { id: "c64", name: "Storage Accessories", image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=300&h=300&fit=crop" },
        { id: "c84", name: "Other Accessories", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=300&fit=crop" },
      ],
    },
  ],
  },
  {
    id: "stationery",
    name: "Stationery",
    Icon: BookOpen,
    sections: [
      {
        id: "s11",
        title: "STATIONERY",
        items: [
          { id: "c65", name: "Books", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=300&fit=crop" },
          { id: "c66", name: "School Supplies", image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=300&h=300&fit=crop" },
          { id: "c67", name: "Other Stationery", image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&h=300&fit=crop" },
        ],
      },
    ],
  },
  {
    id: "others",
    name: "Others",
    Icon: Package,
    sections: [
      { id: "default", title: "SEE OTHER PRODUCTS", items: [] },
    ],
  },
];

// ─── CategoriesPage ───────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: apiCategories, isLoading } = useCategories();

  // Match API categories (by name) to STATIC_CATEGORIES (which hold the subcategory UI data)
  // API gives us real UUIDs; STATIC_CATEGORIES give us the subcategory sections
  const mergedCategories = STATIC_CATEGORIES.map((staticCat) => {
    const apiMatch = apiCategories?.find((a) => a.name === staticCat.name);
    return { ...staticCat, apiId: apiMatch?.id ?? null };
  });

  const currentCategory = mergedCategories[selectedIndex];

  const filteredSections = currentCategory.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  const handleItemPress = (item: SubCategoryItem) => {
    router.push(`${ROUTES.PRODUCTS}?title=${encodeURIComponent(item.name)}`);
  };

  const handleSeeAll = () => {
    if (currentCategory.apiId) {
      router.push(`${ROUTES.CATEGORIES}/${currentCategory.apiId}`);
    }
  };

  return (
    <div className="flex flex-col bg-[#F7FFF8] md:max-w-[1280px] md:mx-auto" style={{ height: "100dvh" }}>

      {/* Header */}
      <ScreenHeader
        title="Categories"
        enableSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search categories..."
      />

      {/* Two-column body */}
      <div className="flex flex-1 flex-row overflow-hidden">

        {/* ── Left sidebar ── */}
        <div className="bg-white shadow-[0_0_1px_rgba(0,0,0,0.25)] overflow-y-auto pb-[100px] w-[95px] md:w-[140px] lg:w-[180px]">
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-full flex flex-col items-center py-[24px] px-[8px] gap-[8px] animate-pulse">
                <div className="w-6 h-6 rounded-full bg-[#EAEAEA]" />
                <div className="w-14 h-3 rounded bg-[#EAEAEA]" />
              </div>
            ))
          ) : (
            mergedCategories.map((category, index) => {
              const isSelected = selectedIndex === index;
              const Icon = category.Icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full flex flex-col items-center justify-center py-[24px] px-[8px] gap-[8px]",
                    isSelected ? "bg-[#D8FFDA]" : "bg-white"
                  )}
                >
                  <Icon
                    size={24}
                    className={isSelected ? "text-[#2E7D32]" : "text-[#9E9E9E]"}
                  />
                  <span
                    className={cn(
                      "font-jakarta text-[11px] text-center leading-tight tracking-[-0.04em]",
                      isSelected ? "font-medium text-[#2E7D32]" : "text-[#9E9E9E]"
                    )}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* ── Right content ── */}
        <div className="flex-1 overflow-y-auto pt-[16px] px-[16px] pb-[140px]">
          {filteredSections.length > 0 ? (
            filteredSections.map((section) => (
              <div
                key={section.id}
                className="mb-[16px] bg-white rounded-[12px] overflow-hidden shadow-[0_0_1px_rgba(0,0,0,0.25)]"
              >
                {/* Section header */}
                <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-[#EAEAEA]">
                  <span className="font-jakarta text-[12px] font-bold text-[#151515] uppercase tracking-[-0.04em]">
                    {section.title}
                  </span>
                  <button
                    type="button"
                    onClick={handleSeeAll}
                    className="font-jakarta text-[12px] font-bold text-[#FDC500] underline tracking-[-0.04em]"
                  >
                    See all
                  </button>
                </div>

                {/* Items grid — 3 cols */}
                <div className="flex flex-wrap p-[12px]">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemPress(item)}
                      className="w-1/3 md:w-1/4 lg:w-1/6 flex flex-col items-center mb-[16px] px-[4px] hover:opacity-80 transition-opacity"
                    >
                      <div className="w-full aspect-square bg-white rounded-[12px] mb-[8px] overflow-hidden flex items-center justify-center p-[8px] shadow-[0_0_1px_rgba(0,0,0,0.25)]">
                        <div className="relative w-full h-full">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-contain"
                            sizes="80px"
                          />
                        </div>
                      </div>
                      <span className="font-jakarta text-[11px] text-center text-[#545454] font-medium leading-tight tracking-[-0.04em]">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <Package size={48} className="text-[#BDBDBD]" />
              <p className="mt-3 font-jakarta text-[13px] text-[#9B9B9B] tracking-[-0.04em]">No items available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
