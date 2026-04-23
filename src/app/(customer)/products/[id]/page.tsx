"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Heart, Minus, Plus, Star, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useProduct } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/cart.store";
import { useSavedItemsStore } from "@/stores/savedItems.store";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import type { Review } from "@/types";

function useProductReviews(productId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.REVIEWS(productId),
    queryFn: async () => {
      const { data } = await apiClient.get<Review[]>(`/reviews/product/${productId}`);
      return data;
    },
    enabled: !!productId,
  });
}

function isClothingCategory(categoryName: string): boolean {
  return /\b(cloth|fashion|shirt|dress|tops|skirt|trouser|jean|shorts|blouse|gown|wear)\b/i.test(categoryName);
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: product, isLoading, isError } = useProduct(id);
  const { data: reviews } = useProductReviews(id);
  const addItem = useCartStore((s) => s.addItem);
  const { isSaved, toggleSaved } = useSavedItemsStore();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const wishlisted = isSaved(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7FFF8]">
        <div className="h-10 w-10 rounded-full border-4 border-[#2E7D32] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7FFF8] px-6">
        <ShoppingBag size={48} className="text-[#9B9B9B]" />
        <p className="mt-4 font-jakarta text-[14px] text-[#9B9B9B] text-center">
          {isError ? "Failed to load product" : "Product not found"}
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 rounded-[8px] bg-[#2E7D32] px-6 py-3"
        >
          <span className="font-jakarta text-[14px] font-semibold text-white">Go Back</span>
        </button>
      </div>
    );
  }

  const imageUri = product.imageUrls?.[0] ?? null;
  const price = Number(product.price);
  const vendorName = product.vendor?.storeName ?? "Unknown Store";
  const description = product.description ?? "No description available.";
  const availableStock = Math.max(0, product.stock ?? 0);
  const canAddToCart = product.isAvailable && availableStock > 0;
  const reviewList = reviews ?? [];
  const reviewCount = reviewList.length;
  const avgRating =
    reviewCount > 0
      ? Math.round(reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewCount)
      : product.rating ?? 0;

  const showSizeSelector = !!product.category?.name && isClothingCategory(product.category.name);

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addItem(product, quantity);
    toast.success("Added to cart");
    router.push("/cart");
  };

  return (
    <div className="bg-[#F7FFF8] min-h-screen md:max-w-[1280px] md:mx-auto">

      {/* ── Header row: back + wishlist (mobile only full, md+ inline) ── */}
      <div className="flex items-center justify-between px-[24px] pt-[48px] md:pt-[24px] pb-[12px]">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-[40px] h-[40px] rounded-full bg-[#D8FFDA] flex items-center justify-center hover:bg-[#c4f5c7] transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft size={24} className="text-[#151515]" />
        </button>
        <button
          type="button"
          onClick={() => toggleSaved(id)}
          className={cn(
            "w-[40px] h-[40px] rounded-full flex items-center justify-center shadow-[0px_2px_4px_rgba(0,0,0,0.1)] hover:opacity-80 transition-opacity",
            wishlisted ? "bg-[#D8FFDA]" : "bg-white"
          )}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={20}
            className={cn(wishlisted ? "fill-[#2E7D32] text-[#2E7D32]" : "text-[#151515]")}
          />
        </button>
      </div>

      {/* ── Two-column on md+, stacked on mobile ── */}
      <div className="md:flex md:gap-[40px] md:px-6 lg:px-8 md:pb-[60px]">

        {/* ── Product image ── */}
        <div className="h-[280px] md:h-[480px] md:w-[440px] md:shrink-0 w-full px-[24px] md:px-0 bg-[#F7FFF8]">
          {imageUri ? (
            <div className="relative h-full w-full rounded-[16px] overflow-hidden">
              <Image
                src={imageUri}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 390px, 440px"
                priority
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingBag size={64} className="text-[#9B9B9B]" />
            </div>
          )}
        </div>

        {/* ── White details card ── */}
        <div className="-mt-6 md:mt-0 md:flex-1 rounded-t-[30px] md:rounded-[16px] bg-white pb-[160px] md:pb-[32px] border-t border-[rgba(0,0,0,0.25)] md:border md:border-[#EAEAEA]">
          <div className="px-[24px] pt-[20px]">

            {/* Name + qty stepper */}
            <div className="relative pr-[112px] mb-[10px]">
              <p className="font-jakarta font-medium text-[18px] md:text-[20px] text-[#151515] leading-normal tracking-[-0.04em]">
                {product.name}
              </p>
              {/* Quantity stepper */}
              <div className="absolute top-0 right-0 flex items-center rounded-[8px] border border-[#2E7D32]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-[32px] h-[48px] flex items-center justify-center hover:bg-[#F7FFF8] transition-colors"
                  aria-label="Decrease"
                >
                  <Minus size={16} className="text-[#151515]" />
                </button>
                <div className="w-[32px] flex items-center justify-center border-x border-[#2E7D32] h-[48px]">
                  <span className="font-jakarta text-[14px] font-semibold text-[#151515]">
                    {quantity}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-[32px] h-[48px] flex items-center justify-center hover:bg-[#F7FFF8] transition-colors"
                  aria-label="Increase"
                >
                  <Plus size={16} className="text-[#151515]" />
                </button>
              </div>
            </div>

            {/* Vendor */}
            <p className="font-jakarta text-[12px] font-regular text-[#9B9B9B] mb-[10px] leading-normal tracking-[-0.04em]">
              Store:{" "}
              <span className="text-[#CD9F00] font-regular">{vendorName}</span>
            </p>

            {/* Price */}
            <p className="font-satoshi text-[20px] md:text-[24px] font-semibold text-[#151515] mb-[10px] leading-[1.2]">
              {formatNaira(price)}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-[4px] mb-[20px]">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  className={cn(
                    s <= avgRating
                      ? "fill-[#FDC500] text-[#FDC500]"
                      : "fill-transparent text-[#FDC500]"
                  )}
                />
              ))}
              <span className="font-jakarta text-[14px] text-[#9B9B9B] ml-[4px] tracking-[-0.04em]">
                ({reviewCount})
              </span>
            </div>

            {/* Size selector */}
            {showSizeSelector && (
              <div className="mb-[20px]">
                <p className="font-jakarta text-[12px] font-medium text-[#333333] mb-[8px] tracking-[-0.04em]">Size:</p>
                <div className="flex gap-[8px] flex-wrap">
                  {["XS", "S", "M", "L", "XL"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-[40px] h-[40px] rounded-[8px] border font-jakarta text-[13px] font-medium hover:opacity-80 transition-opacity",
                        selectedSize === size
                          ? "border-[#2E7D32] text-[#2E7D32]"
                          : "border-[#EAEAEA] text-[#333333]"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-[px] mb-[4px]">
              {(["details", "reviews"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-[8px] px-[12px] py-[8px] font-jakarta text-[14px] leading-[1.26] tracking-[-0.04em] transition-colors",
                    activeTab === tab
                      ? "bg-[#D8FFDA] font-semibold text-[#2E7D32]"
                      : "bg-transparent text-[#9B9B9B] hover:text-[#545454]"
                  )}
                >
                  {tab === "reviews" ? "Reviews" : "Details"}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === "details" ? (
            <div className="px-[24px] py-[8px]">
              <p className="font-jakarta text-[14px] text-[#151515] leading-[1.8] tracking-[-0.04em]">
                {showFullDescription ? description : description.slice(0, 200)}
                {description.length > 200 && !showFullDescription && (
                  <>
                    {"....... "}
                    <button
                      type="button"
                      onClick={() => setShowFullDescription(true)}
                      className="font-jakarta text-[14px] font-regular text-[#2E7D32] inline hover:underline"
                    >
                      Show more
                    </button>
                  </>
                )}
                {showFullDescription && description.length > 200 && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => setShowFullDescription(false)}
                      className="font-jakarta text-[14px] font-regular text-[#2E7D32] inline hover:underline"
                    >
                      Show less
                    </button>
                  </>
                )}
              </p>

              {/* Stock info */}
              <div className="mt-[16px] flex items-center gap-[8px]">
                <div
                  className={cn(
                    "w-[8px] h-[8px] rounded-full",
                    canAddToCart ? "bg-[#2E7D32]" : "bg-red-500"
                  )}
                />
                <span className="font-jakarta text-[14px] text-[#9B9B9B] leading-[1.26] tracking-[-0.04em]">
                  {canAddToCart ? `${availableStock} in stock` : "Out of stock"}
                </span>
              </div>

              {/* Add to cart — inline on desktop */}
              <div className="hidden md:flex items-center justify-between mt-[32px] pt-[20px] border-t border-[#EAEAEA]">
                <div>
                  <p className="font-jakarta text-[12px] text-[#9B9B9B] leading-[1.26] tracking-[-0.04em]">Total Price</p>
                  <p className="font-jakarta text-[20px] font-bold text-[#151515] leading-none mt-[2px]">
                    {formatNaira(price * quantity)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className="h-[53px] w-[200px] rounded-[8px] bg-[#2E7D32] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1D5620] transition-colors"
                >
                  <span className="font-jakarta text-[14px] font-semibold text-white tracking-[-0.04em]">
                    Add to cart
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="px-[24px] py-[12px]">
              {reviewList.length === 0 ? (
                <p className="font-jakarta text-[14px] text-[#9B9B9B] text-center py-8 leading-[2]">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                reviewList.map((review) => (
                  <div key={review.id} className="mb-[24px]">
                    <div className="flex items-center justify-between mb-[6px]">
                      <p className="font-jakarta font-regular text-[16px] text-[#151515] leading-[1.26] tracking-[-0.04em]">
                        {review.reviewer?.firstName ?? "Anonymous"}{" "}
                        {review.reviewer?.lastName ?? ""}
                      </p>
                      <p className="font-jakarta text-[12px] text-[#9B9B9B] leading-[1.26] tracking-[-0.04em]">
                        {(() => {
                          const d = new Date(review.createdAt);
                          const day = d.getDate();
                          const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
                          return `${day}${suffix} ${d.toLocaleDateString("en-NG", { month: "short" })}, ${d.getFullYear()}`;
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center gap-[2px] mb-[6px]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          className={cn(
                            s <= review.rating
                              ? "fill-[#FDC500] text-[#FDC500]"
                              : "fill-transparent text-[#FDC500]"
                          )}
                        />
                      ))}
                    </div>
                    <p className="font-jakarta text-[14px] text-[#151515] leading-[1.8] tracking-[-0.04em]">
                      {review.comment ?? ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky bottom bar — mobile only ── */}
      <div className="md:hidden fixed bottom-[88px] left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="w-full max-w-[390px] px-[24px] pointer-events-auto">
          <div className="bg-white rounded-[16px] shadow-[0px_-2px_12px_rgba(0,0,0,0.08)] px-[20px] py-[14px] flex items-center justify-between">
            <div>
              <p className="font-jakarta text-[12px] text-[#9B9B9B] leading-[1.26] tracking-[-0.04em]">
                Total Price
              </p>
              <p className="font-jakarta text-[20px] font-bold text-[#151515] leading-none mt-[2px]">
                {formatNaira(price * quantity)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="h-[53px] w-[180px] rounded-[8px] bg-[#2E7D32] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1D5620] active:bg-[#1D5620] transition-colors"
            >
              <span className="font-jakarta text-[14px] font-semibold text-white">
                Add to cart
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
