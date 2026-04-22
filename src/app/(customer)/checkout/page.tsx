"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Check } from "lucide-react";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { useCartStore } from "@/stores/cart.store";
import { ordersService } from "@/lib/api/services/orders.service";
import { calculateServiceFee } from "@/lib/utils";
import { formatNaira } from "@/lib/utils";
import { toast } from "sonner";

type DeliveryType = "pickup" | "delivery";

const PICKUP_LOCATIONS = [
  { id: "loc-1", name: "Main Gate" },
  { id: "loc-2", name: "Library Front" },
  { id: "loc-3", name: "Student Union" },
];

function RadioOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex items-center gap-[12px] py-[12px]"
    >
      <div className="w-[18px] h-[18px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center shrink-0">
        {selected && <div className="w-[8px] h-[8px] rounded-full bg-[#2E7D32]" />}
      </div>
      <span className="font-jakarta text-[14px] font-medium text-[#333333] leading-[1.26] tracking-[-0.04em]">
        {label}
      </span>
    </button>
  );
}

function CheckboxOption({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-[10px] py-[8px]"
    >
      <div className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center shrink-0 ${checked ? "border-[#2E7D32] bg-[#2E7D32]" : "border-[#9B9B9B]"}`}>
        {checked && <Check size={12} className="text-white" />}
      </div>
      <span className="font-jakarta text-[13px] text-[#545454] leading-[1.26] tracking-[-0.04em]">{label}</span>
    </button>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const subtotal = Number(searchParams.get("subtotal") ?? 0);

  const { items, clearCart } = useCartStore();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [address, setAddress] = useState("");
  const [saveInfo, setSaveInfo] = useState(false);
  const [hasSavedInfo, setHasSavedInfo] = useState(false);
  const [useAnother, setUseAnother] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load saved delivery address from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("shopa-delivery-address");
    if (saved) {
      setAddress(saved);
      setHasSavedInfo(true);
    }
  }, []);

  useEffect(() => {
    if (useAnother) {
      setAddress("");
      setHasSavedInfo(false);
      localStorage.removeItem("shopa-delivery-address");
    }
  }, [useAnother]);

  const fee = useMemo(() => calculateServiceFee(subtotal), [subtotal]);
  const total = useMemo(() => subtotal + fee, [subtotal, fee]);

  const handleMakePayment = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (deliveryType === "delivery" && !address.trim()) {
      toast.error("Please enter a delivery address.");
      return;
    }

    if (deliveryType === "pickup" && !selectedPickup) {
      toast.error("Please select a pickup location.");
      return;
    }

    // Enforce single vendor
    const vendorIdSet: string[] = [];
    items.forEach((i) => { const vid = i.product.vendor?.id; if (vid && !vendorIdSet.includes(vid)) vendorIdSet.push(vid); });
    const vendorIds = vendorIdSet;
    if (vendorIds.length > 1) {
      toast.error("Your cart has items from multiple vendors. Please checkout one vendor at a time.");
      return;
    }

    setIsProcessing(true);

    try {
      if (deliveryType === "delivery" && saveInfo && address.trim()) {
        localStorage.setItem("shopa-delivery-address", address.trim());
        setHasSavedInfo(true);
      }

      const orderItems = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      const pickupLoc = PICKUP_LOCATIONS.find((l) => l.id === selectedPickup);

      const order = await ordersService.create({
        items: orderItems,
        deliveryAddress: deliveryType === "delivery" ? address.trim() : undefined,
        deliveryMethod: deliveryType,
        notes: deliveryType === "pickup" && pickupLoc ? `Pickup location: ${pickupLoc.name}` : undefined,
      });

      const payment = await ordersService.initiatePayment(order.id);

      // Redirect to Paystack — it will redirect back to our success page
      clearCart();
      window.location.href = payment.authorizationUrl;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        "Failed to process payment";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <ScreenHeader title="Checkout" showBack />

      <div className="flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
        <div className="flex-1 px-[24px] pt-[24px] pb-[24px] overflow-y-auto">

          {/* Delivery Type */}
          <div className="mb-[24px]">
            <p className="mb-[8px] font-jakarta text-[14px] font-medium text-[#333333] leading-[1.26] tracking-[-0.04em]">
              Select Delivery Type <span className="text-[#FDC500]">*</span>
            </p>
            <RadioOption label="Pickup" selected={deliveryType === "pickup"} onPress={() => setDeliveryType("pickup")} />
            <RadioOption label="Delivery" selected={deliveryType === "delivery"} onPress={() => setDeliveryType("delivery")} />
          </div>

          {/* Delivery fields */}
          {deliveryType === "delivery" ? (
            <div className="mb-[24px]">
              <p className="mb-[8px] font-jakarta text-[14px] font-medium text-[#333333] leading-[1.26] tracking-[-0.04em]">
                Enter delivery address <span className="text-[#FDC500]">*</span>
              </p>
              <textarea
                className="w-full rounded-[8px] border border-[#EAEAEA] bg-white px-[12px] py-[12px] font-jakarta text-[14px] text-[#333333] placeholder:text-[#C2C2C2] min-h-[100px] resize-none focus:outline-none focus:border-[#2E7D32]"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={hasSavedInfo ? undefined : "Enter your delivery address within your school..."}
              />
              {hasSavedInfo ? (
                <CheckboxOption label="Use another delivery address" checked={useAnother} onToggle={() => setUseAnother((v) => !v)} />
              ) : (
                <CheckboxOption label="Save delivery info" checked={saveInfo} onToggle={() => setSaveInfo((v) => !v)} />
              )}
              <p className="mt-[8px] font-jakarta text-[12px] text-[#9B9B9B] leading-[1.5] tracking-[-0.04em]">
                Please note that your delivery will take between 24-72 hours after order confirmation
              </p>
            </div>
          ) : (
            <div className="mb-[24px]">
              <p className="mb-[8px] font-jakarta text-[14px] font-medium text-[#333333] leading-[1.26] tracking-[-0.04em]">
                Select Pickup Location <span className="text-[#FDC500]">*</span>
              </p>
              {PICKUP_LOCATIONS.map((loc) => (
                <RadioOption
                  key={loc.id}
                  label={loc.name}
                  selected={selectedPickup === loc.id}
                  onPress={() => setSelectedPickup(loc.id)}
                />
              ))}
              <p className="mt-[8px] font-jakarta text-[12px] text-[#9B9B9B] leading-[1.5] tracking-[-0.04em]">
                Please note that your delivery will take between 24-72 hours after order confirmation
              </p>
            </div>
          )}

          {/* Payment Method */}
          <div className="mb-[24px]">
            <p className="mb-[8px] font-jakarta text-[14px] font-medium text-[#333333] leading-[1.26] tracking-[-0.04em]">
              Choose Payment Method <span className="text-[#FDC500]">*</span>
            </p>
            <RadioOption label="Transfer" selected onPress={() => {}} />
          </div>
        </div>

        {/* Price summary + CTA */}
        <div className="px-[24px] pt-[16px] pb-[100px] bg-[#F7FFF8]">
          <div className="mb-[16px]">
            <div className="flex items-center justify-between mb-[10px]">
              <span className="font-jakarta text-[12px] text-[#333333] tracking-[-0.04em]">Subtotal</span>
              <span className="font-jakarta text-[12px] font-bold text-[#333333] tracking-[-0.04em]">{formatNaira(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between mb-[10px]">
              <span className="font-jakarta text-[12px] text-[#9B9B9B] tracking-[-0.04em]">Service fee (7.5%)</span>
              <span className="font-jakarta text-[12px] font-bold text-[#333333] tracking-[-0.04em]">{formatNaira(fee)}</span>
            </div>
            <div className="flex items-center justify-between mb-[10px]">
              <span className="font-jakarta text-[12px] font-bold text-[#333333] tracking-[-0.04em]">TOTAL</span>
              <span className="font-jakarta text-[12px] font-bold text-[#333333] tracking-[-0.04em]">{formatNaira(total)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMakePayment}
            disabled={isProcessing}
            className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1D5620] transition-colors tracking-[-0.04em]"
          >
            {isProcessing ? "Processing..." : "Make Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
