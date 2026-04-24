"use client";

import Link from "next/link";
import { Bell, Store, MessageSquare, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "New Vendor Application",
    message: "Fresh Provisions has applied to sell on Crawford University campus.",
    type: "vendor",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    link: "/admin/vendors",
  },
  {
    id: "n2",
    title: "New Dispute Raised",
    message: "A customer raised a dispute on Order #12345678. Vendor has 48 hours to respond.",
    type: "dispute",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    link: "/admin/disputes",
  },
  {
    id: "n3",
    title: "Vendor Response Submitted",
    message: "Fresh Provisions responded to dispute on Order #12345678. Your review is required within 48 hours.",
    type: "dispute",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    link: "/admin/disputes",
  },
  {
    id: "n4",
    title: "New Vendor Application",
    message: "Campus Gadgets has applied to sell on Crawford University campus.",
    type: "vendor",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    link: "/admin/vendors",
  },
  {
    id: "n5",
    title: "Dispute Resolution Overdue",
    message: "You have not resolved the dispute on Order #87654321. Super admin has been notified.",
    type: "urgent",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    link: "/admin/disputes",
  },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifIcon({ type }: { type: string }) {
  const config = {
    vendor:  { Icon: Store,          bg: "bg-[#D8FFDA]", color: "text-[#2E7D32]" },
    dispute: { Icon: MessageSquare,  bg: "bg-[#FFEBEE]", color: "text-[#E53935]" },
    urgent:  { Icon: Clock,          bg: "bg-[#FFF3E0]", color: "text-[#FF9800]" },
  }[type] ?? { Icon: Bell, bg: "bg-[#F7FFF8]", color: "text-[#9B9B9B]" };

  return (
    <div className={cn("w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0", config.bg)}>
      <config.Icon size={18} className={config.color} />
    </div>
  );
}

export default function AdminNotificationsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isMock = user?.id === "mock-admin-001";

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data } = await apiClient.get("/notifications");
      return data?.data ?? data ?? [];
    },
    enabled: !isMock,
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      if (isMock) return;
      await apiClient.post("/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("All notifications marked as read.");
    },
  });

  const markOneMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isMock) return;
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const items = isMock ? MOCK_NOTIFICATIONS : (notifications ?? []);
  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <AdminLayout campusName="Crawford University">
      {/* Header */}
      <div className="flex items-center justify-between mb-[24px]">
        <div>
          <h1 className="font-satoshi font-bold text-[20px] md:text-[22px] text-[#151515]">Notifications</h1>
          {unreadCount > 0 && (
            <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="font-jakarta text-[12px] font-semibold text-[#2E7D32] hover:underline disabled:opacity-50">
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-[10px]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px] h-[72px] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] flex flex-col items-center justify-center py-[60px] gap-[12px]">
          <div className="w-[52px] h-[52px] rounded-full bg-[#F7FFF8] flex items-center justify-center">
            <Bell size={24} className="text-[#C2C2C2]" />
          </div>
          <p className="font-jakarta text-[14px] text-[#9B9B9B]">You don&apos;t have any notifications.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[8px]">
          {items.map((notif) => (
            <div
              key={notif.id}
              onClick={() => { if (!notif.isRead) markOneMutation.mutate(notif.id); }}
              className={cn(
                "flex items-start gap-[14px] bg-white rounded-[12px] border p-[16px] transition-colors",
                notif.link ? "cursor-pointer hover:bg-[#F7FFF8]" : "",
                !notif.isRead
                  ? notif.type === "urgent" ? "border-l-[3px] border-l-[#FF9800] border-[#EAEAEA]"
                    : notif.type === "dispute" ? "border-l-[3px] border-l-[#E53935] border-[#EAEAEA]"
                    : "border-l-[3px] border-l-[#2E7D32] border-[#EAEAEA]"
                  : "border-[#EAEAEA]"
              )}
            >
              <NotifIcon type={notif.type} />

              <div className="flex-1 min-w-0">
                {notif.link ? (
                  <Link href={notif.link} className={cn("font-jakarta text-[13px] tracking-[-0.04em] hover:underline",
                    notif.isRead ? "font-medium text-[#545454]" : "font-bold text-[#151515]"
                  )}>
                    {notif.title}
                  </Link>
                ) : (
                  <p className={cn("font-jakarta text-[13px] tracking-[-0.04em]",
                    notif.isRead ? "font-medium text-[#545454]" : "font-bold text-[#151515]"
                  )}>
                    {notif.title}
                  </p>
                )}
                <p className="font-jakarta text-[12px] text-[#9B9B9B] leading-[1.5] mt-[2px]">{notif.message}</p>
                <p className="font-jakarta text-[11px] text-[#C2C2C2] mt-[6px]">{timeAgo(notif.createdAt)}</p>
              </div>

              {!notif.isRead && (
                <div className={cn("w-[8px] h-[8px] rounded-full shrink-0 mt-[4px]",
                  notif.type === "urgent" ? "bg-[#FF9800]" : notif.type === "dispute" ? "bg-[#E53935]" : "bg-[#2E7D32]"
                )} />
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
