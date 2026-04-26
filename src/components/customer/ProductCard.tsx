"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import { useSavedItemsStore } from "@/stores/savedItems.store";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { isSaved, toggleSaved } = useSavedItemsStore();
  const wishlisted = isSaved(product.id);

  const imageUri = product.imageUrls?.[0] ?? product.images?.[0] ?? null;
  const rating = product.rating ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success("Added to cart");
  };

  return (
    <div className={cn("w-[170px] shrink-0 rounded-[12px] border border-[#EAEAEA] bg-white overflow-hidden md:w-full md:hover:shadow-md md:hover:scale-[1.02] md:transition-all md:duration-200", className)}>
      {/* Image area */}
      <Link href={ROUTES.PRODUCT(product.id)} className="relative block w-full h-[137px] bg-[#F7FFF8] overflow-hidden">
        {imageUri ? (
          <Image
            src={imageUri}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ShoppingBag size={32} className="text-[#9B9B9B]" />
          </div>
        )}

        {/* Wishlist button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSaved(product.id);
          }}
          className={cn(
            "absolute right-[8px] top-[8px] h-[24px] w-[24px] items-center justify-center rounded-full flex",
            wishlisted ? "bg-[#D8FFDA]" : "bg-white"
          )}
          aria-label={wishlisted ? "Remove from saved" : "Save item"}
        >
          <Heart
            size={16}
            className={cn(wishlisted ? "fill-[#2E7D32] text-[#2E7D32]" : "text-[#151515]")}
          />
        </button>
      </Link>

      {/* Content + button — uniform 6px gap between all elements */}
      <div className="px-[12px] py-[8px] flex flex-col gap-[6px]">
        <Link href={ROUTES.PRODUCT(product.id)} className="flex flex-col gap-[6px]">
          <p className="font-jakarta text-[12px] text-[#545454] truncate leading-[1.26] tracking-[-0.04em]">
            {product.name}
          </p>
          <p className="font-jakarta text-[12px] font-bold text-[#151515] leading-[1.26] tracking-[-0.04em]">
            {formatNaira(Number(product.price))}
          </p>
          <div className="flex items-center gap-[2px]">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={13}
                className={cn(
                  s <= rating ? "fill-[#FDC500] text-[#FDC500]" : "fill-transparent text-[#FDC500]"
                )}
              />
            ))}
            <span className="ml-[4px] font-jakarta text-[12px] text-[#9B9B9B] tracking-[-0.04em]">({reviewCount})</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full h-[30px] flex items-center justify-center rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white hover:bg-[#1D5620] active:bg-[#1D5620] transition-colors tracking-[-0.04em]"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
