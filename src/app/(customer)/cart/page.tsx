"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, X, Minus, Plus, ImageIcon } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { formatNaira, calculateServiceFee } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const subTotal = subtotal();
  const fee = calculateServiceFee(subTotal);
  const total = subTotal + fee;

  return (
    <div className="flex-1 bg-[#F7FFF8] min-h-screen">
      <ScreenHeader title="Cart" />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20 md:max-w-[1280px] md:mx-auto">
          <ShoppingCart size={64} className="text-[#9B9B9B]" />
          <p className="mt-4 font-jakarta text-[18px] text-[#9B9B9B] text-center tracking-[-0.04em]">
            Your cart is empty
          </p>
          <Link
            href={ROUTES.HOME}
            className="mt-6 rounded-[8px] bg-[#2E7D32] px-8 py-3 hover:bg-[#1D5620] transition-colors"
          >
            <span className="font-jakarta text-[14px] font-semibold text-white tracking-[-0.04em]">Start Shopping</span>
          </Link>
        </div>
      ) : (
        <div className="md:max-w-[1280px] md:mx-auto md:px-6 lg:px-8 md:pt-[24px] md:pb-[40px]">
          {/* Desktop: 2-col layout */}
          <div className="md:flex md:gap-[32px] md:items-start">

            {/* Cart items list */}
            <div className="md:flex-1 px-[16px] md:px-0 pt-[24px] md:pt-0 pb-[180px] md:pb-0">
              {items.map((item) => {
                const imageUri = item.product.imageUrls?.[0] ?? null;
                return (
                  <div
                    key={item.productId}
                    className="mb-[16px] flex flex-row overflow-hidden rounded-[12px] bg-[#F7FFF8] border border-[#EAEAEA] p-[12px] md:hover:shadow-sm md:transition-shadow"
                  >
                    {/* Product Image */}
                    <div className="h-[96px] w-[96px] md:h-[110px] md:w-[110px] shrink-0 overflow-hidden rounded-[8px] bg-white flex items-center justify-center">
                      {imageUri ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={imageUri}
                            alt={item.product.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 96px, 110px"
                          />
                        </div>
                      ) : (
                        <ImageIcon size={24} className="text-[#9B9B9B]" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="ml-[12px] flex flex-1 flex-col justify-between py-[4px]">
                      <div>
                        <div className="flex flex-row items-start justify-between">
                          <p className="flex-1 mr-2 font-jakarta text-[14px] font-medium text-[#333333] leading-[1.4] tracking-[-0.04em]">
                            {item.product.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="p-1 hover:opacity-70 transition-opacity"
                            aria-label="Remove item"
                          >
                            <X size={18} className="text-[#9B9B9B]" />
                          </button>
                        </div>
                        <p className="mt-[4px] font-jakarta text-[12px] text-[#9B9B9B] tracking-[-0.04em]">
                          {(item.product as { vendor?: { storeName?: string } }).vendor?.storeName ?? ""}
                        </p>
                      </div>

                      <div className="mt-[16px] flex flex-row items-center justify-between">
                        <p className="font-jakarta text-[16px] font-bold text-[#2E7D32] tracking-[-0.04em]">
                          {formatNaira(Number(item.product.price))}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex flex-row items-center gap-[12px]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="h-[28px] w-[28px] flex items-center justify-center rounded-[8px] bg-[#F7FFF8] border border-[#EAEAEA] hover:border-[#2E7D32] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} className="text-[#9B9B9B]" />
                          </button>
                          <span className="w-[16px] text-center font-jakarta text-[14px] font-medium text-[#333333] tracking-[-0.04em]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="h-[28px] w-[28px] flex items-center justify-center rounded-[8px] border border-[#EAEAEA] hover:border-[#2E7D32] transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} className="text-[#9B9B9B]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order summary — desktop sidebar / mobile sticky footer */}
            {/* Desktop order summary */}
            <div className="hidden md:block md:w-[320px] lg:w-[360px] shrink-0">
              <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[24px] sticky top-[80px]">
                <h2 className="font-jakarta text-[16px] font-semibold text-[#151515] mb-[20px] tracking-[-0.04em]">
                  Order Summary
                </h2>
                <div className="flex items-center justify-between mb-[12px]">
                  <span className="font-jakarta text-[14px] text-[#333333] tracking-[-0.04em]">Subtotal</span>
                  <span className="font-jakarta text-[14px] font-bold text-[#333333] tracking-[-0.04em]">{formatNaira(subTotal)}</span>
                </div>
                <div className="flex items-center justify-between mb-[20px]">
                  <span className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">Service fee (7.5%)</span>
                  <span className="font-jakarta text-[14px] font-bold text-[#333333] tracking-[-0.04em]">{formatNaira(fee)}</span>
                </div>
                <div className="flex items-center justify-between pt-[16px] border-t border-[#EAEAEA] mb-[24px]">
                  <span className="font-jakarta text-[14px] font-bold text-[#151515] tracking-[-0.04em]">TOTAL</span>
                  <span className="font-jakarta text-[16px] font-bold text-[#151515] tracking-[-0.04em]">{formatNaira(total)}</span>
                </div>
                <Link
                  href={`${ROUTES.CHECKOUT}?subtotal=${subTotal}`}
                  className="flex items-center justify-center rounded-[8px] bg-[#2E7D32] h-[53px] hover:bg-[#1D5620] transition-colors"
                >
                  <span className="font-jakarta text-[14px] font-semibold text-white tracking-[-0.04em]">
                    Continue to Checkout
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile sticky footer */}
          <div className="md:hidden fixed bottom-[88px] left-1/2 -translate-x-1/2 w-full max-w-[390px] px-[24px] bg-transparent z-20">
            <div className="flex flex-row items-center gap-[16px]">
              <div className="w-[40%]">
                <p className="font-jakarta text-[12px] text-[#9B9B9B] tracking-[-0.04em]">Sub Total:</p>
                <p className="mt-[4px] font-satoshi text-[20px] font-bold text-[#151515] tracking-[-0.04em]">
                  {formatNaira(subTotal)}
                </p>
              </div>
              <Link
                href={`${ROUTES.CHECKOUT}?subtotal=${subTotal}`}
                className="flex-1 flex items-center justify-center rounded-[8px] bg-[#2E7D32] h-[53px] hover:bg-[#1D5620] transition-colors"
              >
                <span className="font-jakarta text-[14px] font-semibold text-white tracking-[-0.04em]">
                  Continue to Checkout
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
