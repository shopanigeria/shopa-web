"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();

  const { data: product, isLoading, isError } = useProduct(id);
  const { data: reviews } = useProductReviews(id);
  const addItem = useCartStore((s) => s.addItem);
  const { isSaved, toggleSaved } = useSavedItemsStore();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");

  useEffect(() => {
    if (searchParams.get("review") === "true") setActiveTab("reviews");
  }, [searchParams]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = async () => {
    if (!reviewRating) { toast.error("Please select a star rating."); return; }
    if (!reviewComment.trim()) { toast.error("Please write a comment."); return; }
    setSubmittingReview(true);
    try {
      await apiClient.post("/reviews", { productId: id, rating: reviewRating, comment: reviewComment.trim() });
      toast.success("Review submitted!");
      setReviewRating(0);
      setReviewComment("");
      setShowReviewModal(false);
    } catch {
      toast.error("Failed to submit review. Make sure you have a delivered order for this product.");
    } finally {
      setSubmittingReview(false);
    }
  };

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

  const imageUri = product.imageUrls?.[0] ?? product.images?.[0] ?? null;
  const price = Number(product.price);
  const vendorName = product.vendor?.storeName ?? "Unknown Store";
  const description = product.description ?? "No description available.";
  const availableStock = Math.max(0, product.stock ?? 0);
  const isPreorder = product.saleType === "PREORDER";
  const maxPreorderDays = product.maxPreorderDays ?? product.vendor?.maxPreorderDays ?? null;
  const canAddToCart = (product.isAvailable ?? product.isActive ?? true) && (isPreorder || availableStock > 0);
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
      <div className="flex items-center justify-between px-[16px] sm:px-[24px] pt-[36px] xs:pt-[48px] md:pt-[24px] pb-[12px]">
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
        <div className="h-[320px] md:h-[480px] md:w-[440px] md:shrink-0 w-full bg-white md:rounded-[16px] overflow-hidden">
          {imageUri ? (
            <div className="relative h-full w-full">
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
            <div className="flex h-full w-full items-center justify-center bg-[#EAEAEA]">
              <ShoppingBag size={64} className="text-[#9B9B9B]" />
            </div>
          )}
        </div>

        {/* ── White details card ── */}
        <div className="md:mt-0 md:flex-1 rounded-t-[30px] md:rounded-[16px] bg-white pb-[160px] md:pb-[32px] shadow-[0px_-4px_12px_rgba(0,0,0,0.08)] md:shadow-none md:border md:border-[#EAEAEA]">
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

              {/* Stock info — only show count if below 10 or out of stock */}
              {!isPreorder && (
                <div className="mt-[16px] flex items-center gap-[8px]">
                  <div className={cn("w-[8px] h-[8px] rounded-full", canAddToCart ? "bg-[#2E7D32]" : "bg-red-500")} />
                  <span className="font-jakarta text-[14px] text-[#9B9B9B] leading-[1.26] tracking-[-0.04em]">
                    {!canAddToCart
                      ? "Out of stock"
                      : availableStock < 10
                      ? `Only ${availableStock} left in stock!`
                      : "In stock"}
                  </span>
                </div>
              )}

              {/* Preorder disclaimer */}
              {isPreorder && (
                <div className="mt-[16px] rounded-[8px] bg-[#FFF8E1] border border-[#FDC500] px-[14px] py-[12px]">
                  <p className="font-jakarta text-[12px] font-bold text-[#CD9F00] mb-[4px] tracking-[-0.04em]">
                    Pre-order Item
                  </p>
                  <p className="font-jakarta text-[12px] text-[#767676] leading-[1.6] tracking-[-0.04em]">
                    This item is available on pre-order.{" "}
                    {maxPreorderDays
                      ? `Your order will be ready within ${maxPreorderDays} day${maxPreorderDays === 1 ? "" : "s"} of purchase.`
                      : "The vendor will confirm the delivery timeframe after your order."}
                  </p>
                </div>
              )}

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
              {/* Add Review button */}
              <div className="flex justify-end mb-[16px]">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="flex items-center gap-[6px] bg-[#D8FFDA] rounded-[8px] px-[12px] py-[7px] font-jakarta text-[12px] font-semibold text-[#2E7D32] tracking-[-0.04em]"
                >
                  <span className="text-[16px] leading-none">+</span>
                  Add Review
                </button>
              </div>

              {/* Existing reviews */}
              {reviewList.length === 0 ? (
                <p className="font-jakarta text-[14px] text-[#9B9B9B] text-center py-4 leading-[2]">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                reviewList.map((review) => (
                  <div key={review.id} className="mb-[24px]">
                    <div className="flex items-center justify-between mb-[6px]">
                      <p className="font-jakarta font-semibold text-[14px] text-[#151515] leading-[1.26] tracking-[-0.04em]">
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
                        <Star key={s} size={14}
                          className={cn(s <= review.rating ? "fill-[#FDC500] text-[#FDC500]" : "fill-transparent text-[#FDC500]")}
                        />
                      ))}
                    </div>
                    <p className="font-jakarta text-[14px] text-[#151515] leading-[1.8] tracking-[-0.04em]">
                      {review.comment ?? ""}
                    </p>
                    {review.id !== reviewList[reviewList.length - 1].id && (
                      <div className="border-b border-[#EAEAEA] mt-[20px]" />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Review Modal ── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowReviewModal(false)}
          />
          {/* Sheet */}
          <div className="relative z-10 w-full max-w-[480px] bg-white rounded-t-[24px] md:rounded-[16px] px-[16px] sm:px-[24px] pt-[24px] pb-[40px]">
            {/* Handle */}
            <div className="w-[40px] h-[4px] bg-[#EAEAEA] rounded-full mx-auto mb-[20px] md:hidden" />

            <div className="flex items-center justify-between mb-[20px]">
              <p className="font-satoshi font-bold text-[18px] text-[#151515]">Write a Review</p>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="w-[32px] h-[32px] rounded-full bg-[#EAEAEA] flex items-center justify-center hover:bg-[#D8FFDA] transition-colors"
                aria-label="Close"
              >
                <span className="font-jakarta text-[16px] leading-none text-[#545454]">✕</span>
              </button>
            </div>

            {/* Star picker */}
            <p className="font-jakarta text-[13px] font-medium text-[#333333] mb-[10px] tracking-[-0.04em]">
              Rating
            </p>
            <div className="flex items-center gap-[8px] mb-[20px]">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${s} star`}
                  className="focus:outline-none"
                >
                  <Star
                    size={32}
                    className={cn(
                      "transition-colors",
                      s <= (hoverRating || reviewRating)
                        ? "fill-[#FDC500] text-[#FDC500]"
                        : "fill-transparent text-[#EAEAEA]"
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <p className="font-jakarta text-[13px] font-medium text-[#333333] mb-[8px] tracking-[-0.04em]">
              Comment
            </p>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              className="w-full bg-[#EAEAEA] rounded-[8px] px-[14px] py-[12px] font-jakarta text-[14px] text-[#151515] placeholder-[#C2C2C2] tracking-[-0.04em] resize-none focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            />

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white mt-[20px] disabled:opacity-50 hover:bg-[#1D5620] transition-colors flex items-center justify-center"
            >
              {submittingReview ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Sticky bottom bar — mobile only ── */}
      <div className="md:hidden fixed bottom-[48px] left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="w-full px-[16px] sm:px-[24px] pointer-events-auto">
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
