"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, ClipboardList, User, Bike, Check } from "lucide-react";
import ScreenHeader from "@/components/layout/ScreenHeader";
import BackButton from "@/components/layout/BackButton";
import { useOrder } from "@/hooks/useOrders";
import { formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { Order } from "@/types";

// DD-MM-YYYY, H:MMam/pm  (no zero-padding on hour, no space before am/pm)
function formatDateTime(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${dd}-${mm}-${yyyy}, ${hours}:${minutes}${ampm}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Expected delivery = confirmation time + 3 days
function expectedDeliveryText(confirmedAt: string) {
  const d = new Date(confirmedAt);
  d.setDate(d.getDate() + 3);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `On or before ${dd}-${mm}-${yyyy}, ${hours}:${minutes}${ampm}`;
}

type Step = {
  label: string;
  time?: string;
  completed: boolean;
  active?: boolean;
  rejected?: boolean;
  Icon: React.ElementType;
};

function buildSteps(order: Order): Step[] {
  const status = order.status as string;
  const placedTime = formatDateTime(order.createdAt);
  const statusOrder = ["PENDING", "PAID", "CONFIRMED", "SHIPPED", "DELIVERED", "COMPLETED"];
  const reached = (s: string) => statusOrder.indexOf(status) >= statusOrder.indexOf(s);

  // Confirmed time: use updatedAt when status has passed CONFIRMED
  const confirmedTime = reached("CONFIRMED") ? formatDateTime(order.updatedAt) : undefined;
  // Expected delivery time derived from when order was confirmed (updatedAt at that point)
  const expectedText = reached("CONFIRMED") ? expectedDeliveryText(order.updatedAt) : undefined;

  if (status === "CANCELLED") {
    return [
      { label: "Pending Confirmation", time: placedTime, completed: true, Icon: ClipboardList },
      { label: "Order Rejected", time: formatDateTime(order.updatedAt), completed: true, rejected: true, Icon: User },
      { label: "Expected Delivery", completed: false, Icon: Bike },
      { label: "Delivered", completed: false, Icon: Check },
    ];
  }

  return [
    { label: "Pending Confirmation", time: placedTime, completed: true, Icon: ClipboardList },
    {
      label: "Order Confirmed",
      time: confirmedTime,
      completed: reached("CONFIRMED"),
      active: status === "PAID",
      Icon: User,
    },
    {
      label: "Expected Delivery",
      time: reached("CONFIRMED") ? expectedText : undefined,
      completed: reached("SHIPPED") || reached("DELIVERED") || reached("COMPLETED"),
      active: status === "CONFIRMED",
      Icon: Bike,
    },
    {
      label: "Delivered",
      time: reached("DELIVERED") || reached("COMPLETED") ? formatDateTime(order.updatedAt) : undefined,
      completed: reached("DELIVERED") || reached("COMPLETED"),
      active: status === "SHIPPED",
      Icon: Check,
    },
  ];
}

function OrderTimeline({ steps }: { steps: Step[] }) {
  return (
    <div className="py-[24px]">
      {steps.map((step, i) => {
        const isActive = step.completed || step.active;
        const isLast = i === steps.length - 1;
        const Icon = step.Icon;

        const iconColorClass = step.rejected
          ? "text-red-500"
          : isActive
          ? "text-[#2E7D32]"
          : "text-[#9B9B9B]";

        const labelColorClass = step.rejected
          ? "text-red-500"
          : isActive
          ? "text-[#2E7D32]"
          : "text-[#9B9B9B]";

        const bottomLineClass = step.completed ? (step.rejected ? "bg-red-500" : "bg-[#2E7D32]") : "bg-[#EAEAEA]";

        return (
          <div key={i} className="flex flex-col">
            {/* Icon + text row */}
            <div className="flex items-center gap-[16px]">
              {/* icon */}
              <div className="w-[32px] flex items-center justify-center shrink-0">
                <Icon size={32} className={iconColorClass} strokeWidth={1.5} />
              </div>
              {/* Content */}
              <div className="flex flex-col">
                <span className={cn("font-jakarta font-bold text-[14px] leading-[1.26] tracking-[-0.04em]", labelColorClass)}>
                  {step.label}
                </span>
                {step.time && (
                  <span className="font-jakarta font-semibold text-[12px] text-[#9B9B9B] mt-[4px] leading-[1.26] tracking-[-0.04em]">
                    {step.time}
                  </span>
                )}
              </div>
            </div>
            {/* Connector line below icon */}
            {!isLast && (
              <div className="flex">
                <div className="w-[32px] flex justify-center shrink-0">
                  <div className={cn("w-[2px] h-[28px]", bottomLineClass)} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading, isError } = useOrder(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7FFF8]">
        <ScreenHeader title="Order History" showBack />
        <div className="md:px-6 lg:px-8 md:pt-[20px]"><BackButton label="Order History" /></div>
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-[#2E7D32] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-[#F7FFF8]">
        <ScreenHeader title="Order History" showBack />
        <div className="md:px-6 lg:px-8 md:pt-[20px]"><BackButton label="Order History" /></div>
        <div className="flex items-center justify-center py-20 px-[24px]">
          <p className="font-jakarta text-[14px] text-[#9B9B9B] text-center">
            {isError ? "Failed to load order details." : "Order not found."}
          </p>
        </div>
      </div>
    );
  }

  const steps = buildSteps(order);
  const subtotal = parseFloat(order.totalAmount);
  const serviceFee = Math.round(subtotal * 0.075);
  const total = subtotal + serviceFee;
  const isCompleted = order.status === "COMPLETED" || order.status === "DELIVERED";

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <ScreenHeader title="Order History" showBack />

      {/* Scrollable content — padded to clear the fixed price card */}
      <div className="pb-[160px]">
        {/* Order header */}
        <div className="px-[24px] pt-[24px] pb-[8px]">
          <h1 className="font-satoshi text-[18px] font-bold text-[#151515] tracking-[-0.04em] mb-[4px]" >
            Order #{order.orderNumber?.slice(-8).toUpperCase() ?? order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Timeline */}
        <div className="px-[24px]">
          <OrderTimeline steps={steps} />
        </div>

        {/* Order items */}
        <div className="px-[24px] mb-[24px]">
          <h2 className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em] mb-[10px]">Order Details</h2>
          {order.orderItems.map((item, idx) => {
            const img = item.product.images?.[0] ?? item.product.imageUrls?.[0];
            return (
              <div key={idx} className="flex items-center mb-[16px]">
                <div className="w-[64px] h-[64px] bg-[#EAEAEA] rounded-[8px] overflow-hidden flex items-center justify-center mr-[16px] shrink-0">
                  {img ? (
                    <div className="relative w-full h-full">
                      <Image src={img} alt={item.product.name} fill className="object-cover" sizes="64px" />
                    </div>
                  ) : (
                    <ShoppingBag size={24} className="text-[#9B9B9B]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-jakarta font-regular text-[14px] text-[#333333] mb-[4px] tracking-[-0.04em]">
                    <span className="font-bold">{item.quantity}x</span> {item.product.name}
                  </p>
                  <p className="font-jakarta font-bold text-[14px] text-[#151515] tracking-[-0.04em]">
                    {formatNaira(parseFloat(item.price) * item.quantity)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery details */}
        <div className="px-[24px] mb-[24px]">
          <h2 className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em] mb-[10px]">Delivery Details</h2>
          {order.deliveryAddress ? (
            <p className="font-jakarta text-[14px] text-[#333333] tracking-[-0.04em]">{order.deliveryAddress}</p>
          ) : (
            <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">No delivery address provided</p>
          )}
          {order.deliveryMethod && (
            <p className="font-jakarta text-[14px] text-[#9B9B9B] mt-[4px] capitalize tracking-[-0.04em]">{order.deliveryMethod}</p>
          )}
        </div>

        {/* Dispute button for completed orders */}
        {isCompleted && (
          <div className="px-[24px] mb-[24px]">
            <button
              type="button"
              onClick={() => router.push(ROUTES.DISPUTES_NEW)}
              className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white hover:bg-[#1D5620] transition-colors tracking-[-0.04em]"
            >
              Raise Order Dispute
            </button>
            <p className="mt-[12px] font-jakarta text-[12px] text-[#9B9B9B] text-center leading-[1.5] tracking-[-0.04em]">
              Please note that orders can only be disputed within 24 hours of receiving order.
            </p>
          </div>
        )}

      </div>

      {/* Fixed price summary card — no bottom nav offset */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-20">
        <div className="mx-0 bg-white rounded-t-[24px] shadow-[0px_-1px_1px_rgba(0,0,0,0.1)] px-[24px] pt-[20px] pb-[32px]">
          <div className="flex items-center justify-between mb-[10px]">
            <span className="font-jakarta text-[14px] text-[#333333] tracking-[-0.04em]">Subtotal</span>
            <span className="font-jakarta text-[14px] font-bold text-[#333333] tracking-[-0.04em]">{formatNaira(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between mb-[10px]">
            <span className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">Service fee (7.5%)</span>
            <span className="font-jakarta text-[14px] font-bold text-[#333333] tracking-[-0.04em]">{formatNaira(serviceFee)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-jakarta text-[14px] font-bold text-[#333333] tracking-[-0.04em]">TOTAL</span>
            <span className="font-jakarta text-[14px] font-bold text-[#333333] tracking-[-0.04em]">{formatNaira(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
