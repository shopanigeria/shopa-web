"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, Minus, Plus } from "lucide-react";
import ScreenHeader from "@/components/layout/ScreenHeader";
import BackButton from "@/components/layout/BackButton";
import { useSavedItemsStore } from "@/stores/savedItems.store";
import { useCartStore } from "@/stores/cart.store";
import { productsService } from "@/lib/api/services/products.service";
import { formatNaira } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import type { Product } from "@/types";

export default function SavedItemsPage() {
  const { savedIds, removeSaved } = useSavedItemsStore();
  const addItem = useCartStore((s) => s.addItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (savedIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.allSettled(savedIds.map((id) => productsService.getById(id)))
      .then((results) => {
        const loaded = results
          .filter((r): r is PromiseFulfilledResult<Product> => r.status === "fulfilled")
          .map((r) => r.value);
        setProducts(loaded);
        setQuantities((prev) => {
          const next = { ...prev };
          loaded.forEach((p) => { if (!next[p.id]) next[p.id] = 1; });
          return next;
        });
      })
      .finally(() => setLoading(false));
  }, [savedIds]);

  const handleAddToCart = (product: Product) => {
    const qty = quantities[product.id] ?? 1;
    addItem(product, qty);
    toast.success("Added to cart");
  };

  const changeQty = (id: string, delta: number) => {
    setQuantities((q) => ({ ...q, [id]: Math.max(1, (q[id] ?? 1) + delta) }));
  };

  return (
    <div className="min-h-screen bg-[#F7FFF8] md:max-w-[1280px] md:mx-auto">
      <ScreenHeader title="Saved Items" showBack />
      <div className="md:px-6 lg:px-8 md:pt-[20px]"><BackButton label="Saved Items" /></div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-[#2E7D32] border-t-transparent animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-[24px]">
          <ShoppingBag size={48} className="text-[#9B9B9B] mb-[16px]" />
          <p className="font-jakarta text-[16px] font-medium text-[#9B9B9B] text-center tracking-[-0.04em]">
            No current saved items
          </p>
          <Link
            href={ROUTES.HOME}
            className="mt-[16px] bg-[#2E7D32] rounded-[8px] px-[24px] py-[12px]"
          >
            <span className="font-jakarta text-[14px] font-semibold text-white tracking-[-0.04em]">Start Shopping</span>
          </Link>
        </div>
      ) : (
        <div className="px-[24px] md:px-6 lg:px-8 pt-[24px] pb-[100px] md:pb-[40px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {products.map((item) => {
            const img = item.imageUrls?.[0];
            const qty = quantities[item.id] ?? 1;
            return (
              <div
                key={item.id}
                className="relative bg-white border border-[#EAEAEA] rounded-[8px] p-[16px]"
              >
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeSaved(item.id)}
                  className="absolute top-[12px] right-[12px] p-[4px]"
                  aria-label="Remove from saved"
                >
                  <X size={18} className="text-[#9B9B9B]" />
                </button>

                <div className="flex">
                  {/* Image */}
                  <Link href={ROUTES.PRODUCT(item.id)} className="w-[100px] h-[100px] shrink-0 mr-[16px]">
                    {img ? (
                      <div className="relative w-full h-full rounded-[8px] overflow-hidden">
                        <Image src={img} alt={item.name} fill className="object-cover" sizes="100px" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-[#EAEAEA] rounded-[8px] flex items-center justify-center">
                        <ShoppingBag size={28} className="text-[#9B9B9B]" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1">
                    <p className="font-jakarta font-bold text-[14px] text-[#333333] mb-[4px] leading-tight line-clamp-2 tracking-[-0.04em]">
                      {item.name}
                    </p>
                    <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[8px] tracking-[-0.04em]">
                      {item.vendor?.storeName ?? ""}
                    </p>

                    <div className="flex items-center justify-between mt-[8px]">
                      <span className="font-jakarta font-bold text-[16px] text-[#2E7D32] tracking-[-0.04em]">
                        {formatNaira(Number(item.price) * qty)}
                      </span>
                      {/* Quantity stepper */}
                      <div className="flex items-center gap-[8px]">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => changeQty(item.id, -1)}
                          className="w-[28px] h-[28px] rounded-[6px] border border-[#EAEAEA] flex items-center justify-center"
                        >
                          <Minus size={14} className="text-[#545454]" />
                        </button>
                        <span className="font-jakarta text-[14px] font-medium text-[#333333] w-[20px] text-center tracking-[-0.04em]">
                          {qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => changeQty(item.id, 1)}
                          className="w-[28px] h-[28px] rounded-[6px] border border-[#EAEAEA] flex items-center justify-center"
                        >
                          <Plus size={14} className="text-[#545454]" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className="mt-[12px] w-full bg-[#2E7D32] rounded-[8px] py-[8px] font-jakarta text-[14px] font-semibold text-white hover:bg-[#1D5620] transition-colors tracking-[-0.04em]"
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
