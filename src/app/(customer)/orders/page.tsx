"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, SlidersHorizontal } from "lucide-react";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { useOrders } from "@/hooks/useOrders";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

type SortOption = "Most recent" | "Oldest";
type FilterOption = "All" | "Completed" | "Ongoing" | "Canceled";

function mapStatus(status: string): Exclude<FilterOption, "All"> {
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Canceled";
  return "Ongoing";
}

function StatusBadge({ uiStatus }: { uiStatus: string }) {
  const colors: Record<string, string> = {
    Completed: "bg-[#D8FFDA] text-[#2E7D32]",
    Canceled: "bg-red-100 text-red-500",
    Ongoing: "bg-yellow-100 text-yellow-600",
  };
  return (
    <span className={cn("px-[10px] py-[4px] rounded-full font-jakarta text-[12px] font-bold tracking-[-0.04em]", colors[uiStatus] ?? colors.Ongoing)}>
      {uiStatus}
    </span>
  );
}

export default function OrdersPage() {
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOption>("Most recent");
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("All");

  const { data: orders, isLoading, isError, refetch } = useOrders();

  const displayed = (orders ?? [])
    .map((o: Order) => ({ ...o, uiStatus: mapStatus(o.status) }))
    .filter((o) => selectedFilter === "All" || o.uiStatus === selectedFilter)
    .sort((a, b) =>
      selectedSort === "Most recent"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  const closeDropdowns = () => {
    setShowSort(false);
    setShowFilter(false);
  };

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <ScreenHeader title="Order History" showBack />

      {/* Toolbar */}
      <div className="relative px-[24px] py-[16px] flex gap-[12px] z-10">
        <button
          type="button"
          onClick={() => { setShowSort((v) => !v); setShowFilter(false); }}
          className="flex items-center gap-[8px] bg-[#D8FFDA] px-[14px] py-[8px] rounded-[8px]"
        >
          <ArrowUpDown size={16} className="text-[#2E7D32]" />
          <span className="font-jakarta text-[13px] font-bold text-[#2E7D32] tracking-[-0.04em]">SORT BY</span>
        </button>
        <button
          type="button"
          onClick={() => { setShowFilter((v) => !v); setShowSort(false); }}
          className="flex items-center gap-[8px] bg-[#D8FFDA] px-[14px] py-[8px] rounded-[8px]"
        >
          <SlidersHorizontal size={16} className="text-[#2E7D32]" />
          <span className="font-jakarta text-[13px] font-bold text-[#2E7D32] tracking-[-0.04em]">FILTER BY</span>
        </button>

        {/* Sort dropdown */}
        {showSort && (
          <div className="absolute top-[60px] left-[24px] z-20 bg-white border border-[#EAEAEA] rounded-[12px] py-[8px] shadow-md w-[160px]">
            {(["Most recent", "Oldest"] as SortOption[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { setSelectedSort(opt); setShowSort(false); }}
                className="w-full flex items-center gap-[10px] px-[16px] py-[10px] text-left"
              >
                <div className="w-[16px] h-[16px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center shrink-0">
                  {selectedSort === opt && <div className="w-[8px] h-[8px] rounded-full bg-[#2E7D32]" />}
                </div>
                <span className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">{opt}</span>
              </button>
            ))}
          </div>
        )}

        {/* Filter dropdown */}
        {showFilter && (
          <div className="absolute top-[60px] left-[130px] z-20 bg-white border border-[#EAEAEA] rounded-[12px] py-[8px] shadow-md w-[160px]">
            {(["All", "Completed", "Ongoing", "Canceled"] as FilterOption[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { setSelectedFilter(opt); setShowFilter(false); }}
                className="w-full flex items-center gap-[10px] px-[16px] py-[10px] text-left"
              >
                <div className="w-[16px] h-[16px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center shrink-0">
                  {selectedFilter === opt && <div className="w-[8px] h-[8px] rounded-full bg-[#2E7D32]" />}
                </div>
                <span className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">{opt}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overlay to close dropdowns */}
      {(showSort || showFilter) && (
        <div className="fixed inset-0 z-0" onClick={closeDropdowns} />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-[#2E7D32] border-t-transparent animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 px-[24px]">
          <p className="font-jakarta text-[14px] text-[#9B9B9B] text-center mb-[12px] tracking-[-0.04em]">
            Failed to load orders
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="bg-[#2E7D32] rounded-[8px] px-[20px] py-[10px]"
          >
            <span className="font-jakarta text-[14px] font-semibold text-white tracking-[-0.04em]">Try Again</span>
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">No orders to display</p>
        </div>
      ) : (
        <div className="px-[24px] pb-[100px]">
          {displayed.map((order) => (
            <div key={order.id} className="bg-white px-[16px] py-[20px] rounded-[8px] mb-[10px] border border-[#EAEAEA]">
              <div className="flex items-center justify-between mb-[10px]">
                <span className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em]">
                  Order #{order.orderNumber?.slice(-8).toUpperCase() ?? order.id.slice(-8).toUpperCase()}
                </span>
                <StatusBadge uiStatus={order.uiStatus} />
              </div>
              <p className="font-jakarta text-[12px] text-[#9B9B9B] font-medium mb-[10px] tracking-[-0.04em]">
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <Link
                href={ROUTES.ORDER(order.id)}
                className="font-jakarta text-[12px] font-regular text-[#FDC500] underline tracking-[-0.04em]"
              >
                View Order Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
