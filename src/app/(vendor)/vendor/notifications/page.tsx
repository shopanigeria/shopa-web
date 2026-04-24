"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "NEW ORDER #12345678 RECEIVED!",
    message: "A new order has been placed.",
    type: "order",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "n2",
    title: "NEW DISPUTE #87654321 RAISED!",
    message: "A dispute has been opened on your order.",
    type: "dispute",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "n3",
    title: "NEW ORDER #11223344 RECEIVED!",
    message: "A new order has been placed.",
    type: "order",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "n4",
    title: "ORDER #99887766 DELIVERED!",
    message: "Your order has been marked as delivered.",
    type: "order",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);

  if (diffHrs < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return `${mins}m ago`;
  }
  if (diffHrs < 24) {
    return date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
  }
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

export default function VendorNotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isMock = user?.id === "mock-vendor-001";

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["vendor-notifications"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications");
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !isMock,
  });

  const items = isMock ? MOCK_NOTIFICATIONS : (notifications ?? []);

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      {/* Mobile header */}
      <div className="md:hidden bg-[#2E7D32] rounded-b-[12px] h-[90px] flex items-center px-[20px] gap-[12px]">
        <button type="button" aria-label="Go back" onClick={() => router.back()} className="text-white">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <span className="font-jakarta text-[16px] font-semibold text-white leading-[1.26] tracking-[-0.04em]">
          Notifications
        </span>
      </div>
      {/* Desktop top bar */}
      <div className="hidden md:flex items-center gap-[12px] px-[32px] py-[20px] border-b border-[#EAEAEA] bg-white">
        <button type="button" aria-label="Go back" onClick={() => router.back()} className="text-[#2E7D32] hover:opacity-70 transition-opacity">
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="font-satoshi font-bold text-[20px] text-[#151515]">Notifications</h1>
      </div>

      {/* Content */}
      <div className="px-[20px] md:px-[32px] lg:px-[40px] pt-[20px] pb-[24px]">
        {isLoading ? (
          <div className="flex flex-col gap-[12px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[8px] border border-[#EAEAEA] p-[16px] flex items-center gap-[12px] animate-pulse">
                <div className="w-[40px] h-[40px] rounded-full bg-[#EAEAEA] flex-shrink-0" />
                <div className="flex-1 space-y-[6px]">
                  <div className="h-[12px] bg-[#EAEAEA] rounded w-3/4" />
                  <div className="h-[10px] bg-[#EAEAEA] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="font-jakarta text-[14px] font-medium text-[#9B9B9B] tracking-[-0.04em]">
              You don&apos;t have any notifications.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[12px]">
            {items.map((notif) => {
              const isDispute = notif.type === "dispute";
              return (
                <div
                  key={notif.id}
                  className={cn(
                    "bg-white rounded-[8px] border border-[#EAEAEA] p-[16px] flex items-center gap-[14px]",
                    !notif.isRead && "border-l-[3px]",
                    !notif.isRead && isDispute ? "border-l-[#E53935]" : !notif.isRead ? "border-l-[#2E7D32]" : ""
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0",
                      isDispute ? "bg-[#FFEBEE]" : "bg-[#D8FFDA]"
                    )}
                  >
                    <Bell
                      size={18}
                      className={isDispute ? "text-[#E53935]" : "text-[#2E7D32]"}
                      strokeWidth={2}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-jakarta text-[12px] font-bold leading-[1.26] tracking-[-0.04em] uppercase",
                        isDispute ? "text-[#E53935]" : "text-[#2E7D32]"
                      )}
                    >
                      {notif.title}
                    </p>
                    <p className="font-jakarta text-[11px] font-normal text-[#9B9B9B] leading-[1.26] mt-[4px]">
                      {formatTime(notif.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div
                      className={cn(
                        "w-[8px] h-[8px] rounded-full flex-shrink-0",
                        isDispute ? "bg-[#E53935]" : "bg-[#2E7D32]"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
