"use client";

import Link from "next/link";
import { ShoppingBag, BookOpen, Smartphone, UtensilsCrossed, Watch, Grid2X2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const categoryIconMap: Record<string, React.ElementType> = {
  clothing: ShoppingBag,
  fashion: ShoppingBag,
  stationery: BookOpen,
  books: BookOpen,
  electronics: Smartphone,
  gadgets: Smartphone,
  food: UtensilsCrossed,
  accessories: Watch,
};

function getCategoryIcon(name: string): React.ElementType {
  const key = name.toLowerCase();
  for (const [k, Icon] of Object.entries(categoryIconMap)) {
    if (key.includes(k)) return Icon;
  }
  return Grid2X2;
}

interface CategoryChipProps {
  category: Category;
  isActive?: boolean;
}

export default function CategoryChip({ category, isActive = false }: CategoryChipProps) {
  const Icon = getCategoryIcon(category.name);

  return (
    <Link
      href={`/products?categoryId=${category.id}&title=${encodeURIComponent(category.name)}`}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap shrink-0 transition-colors mr-3",
        isActive ? "bg-primary text-white" : "bg-[#e8f5e9] text-[#40a645]"
      )}
    >
      <Icon size={16} className={isActive ? "text-white" : "text-primary"} />
      <span className="text-[15px] font-medium">{category.name}</span>
    </Link>
  );
}
