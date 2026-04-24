"use client";

import { University, Store, GraduationCap, ShoppingBag, DollarSign, Wallet, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatNaira } from "@/lib/utils";

interface PlatformStats {
  totalUniversities: number;
  totalVendors: number;
  totalStudents: number;
  totalOrders: number;
  totalRevenue: number;
  platformFees: number;
  totalWithdrawals: number;
  pendingDeletionRequests: number;
  pendingWithdrawals: number;
  escalatedDisputes: number;
}

interface RecentActivity {
  id: string;
  type: "order" | "dispute" | "vendor";
  description: string;
  timestamp: string;
  status?: string;
}

const MOCK_STATS: PlatformStats = {
  totalUniversities: 1, totalVendors: 24, totalStudents: 312,
  totalOrders: 1284, totalRevenue: 4200000, platformFees: 315000,
  totalWithdrawals: 890000, pendingDeletionRequests: 2, pendingWithdrawals: 8, escalatedDisputes: 3,
};
const MOCK_ACTIVITY: RecentActivity[] = [
  { id: "a1", type: "order", description: "New order #AB123456 — Primark Shirt (×2)", timestamp: new Date().toISOString(), status: "PENDING" },
  { id: "a2", type: "vendor", description: "New vendor application — Campus Gadgets", timestamp: new Date().toISOString(), status: "PENDING" },
  { id: "a3", type: "dispute", description: "Dispute raised on order #CD789012", timestamp: new Date().toISOString(), status: "OPEN" },
  { id: "a4", type: "order", description: "Order #EF345678 marked as delivered", timestamp: new Date().toISOString(), status: "DELIVERED" },
  { id: "a5", type: "dispute", description: "Dispute #GH901234 escalated", timestamp: new Date().toISOString(), status: "ESCALATED" },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SuperAdminDashboardPage() {
  const { user } = useAuthStore();
  const isMock = user?.id === "mock-superadmin-001";
  const { data: analytics } = useQuery<PlatformStats>({
    queryKey: ["superadmin-analytics"],
    queryFn: async () => { const { data } = await apiClient.get("/analytics/admin"); return data?.data ?? data; },
    enabled: !isMock,
  });

  const stats = analytics ?? MOCK_STATS;

  return (
    <SuperAdminLayout>
      <div className="mb-[28px]">
        <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">Platform Overview</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">Shopa — all universities</p>
      </div>

      {/* Pending actions banner */}
      {(stats.pendingDeletionRequests > 0 || stats.pendingWithdrawals > 0 || stats.escalatedDisputes > 0) && (
        <div className="bg-[#FFF3E0] border border-[#FFB300] rounded-[12px] p-[16px] mb-[24px] flex items-center gap-[12px]">
          <AlertTriangle size={20} className="text-[#FF9800] shrink-0" />
          <div className="flex gap-[20px] flex-wrap">
            {stats.pendingDeletionRequests > 0 && (
              <a href="/superadmin/vendors/deletion-requests" className="font-jakarta text-[13px] font-semibold text-[#FF9800] hover:underline">
                {stats.pendingDeletionRequests} deletion request{stats.pendingDeletionRequests > 1 ? "s" : ""} pending
              </a>
            )}
            {stats.pendingWithdrawals > 0 && (
              <a href="/superadmin/withdrawals" className="font-jakarta text-[13px] font-semibold text-[#FF9800] hover:underline">
                {stats.pendingWithdrawals} withdrawal{stats.pendingWithdrawals > 1 ? "s" : ""} pending
              </a>
            )}
            {stats.escalatedDisputes > 0 && (
              <a href="/superadmin/disputes" className="font-jakarta text-[13px] font-semibold text-[#FF9800] hover:underline">
                {stats.escalatedDisputes} escalated dispute{stats.escalatedDisputes > 1 ? "s" : ""}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[32px]">
        <StatsCard label="Universities" value={stats.totalUniversities} icon={University} iconBg="bg-[#E3F2FD]" iconColor="text-[#1565C0]" />
        <StatsCard label="Total Vendors" value={stats.totalVendors} icon={Store} iconBg="bg-[#D8FFDA]" iconColor="text-[#2E7D32]" />
        <StatsCard label="Total Students" value={stats.totalStudents} icon={GraduationCap} iconBg="bg-[#F3E5F5]" iconColor="text-[#7B1FA2]" />
        <StatsCard label="Total Orders" value={stats.totalOrders} icon={ShoppingBag} iconBg="bg-[#FFF3E0]" iconColor="text-[#FF9800]" />
        <StatsCard label="Total Revenue" value={formatNaira(stats.totalRevenue)} icon={DollarSign} iconBg="bg-[#D8FFDA]" iconColor="text-[#2E7D32]" />
        <StatsCard label="Platform Fees (7.5%)" value={formatNaira(stats.platformFees)} icon={DollarSign} iconBg="bg-[#FFF9C4]" iconColor="text-[#F9A825]" />
        <StatsCard label="Withdrawals Paid" value={formatNaira(stats.totalWithdrawals)} icon={Wallet} iconBg="bg-[#FFEBEE]" iconColor="text-[#E53935]" />
        <StatsCard label="Net Revenue" value={formatNaira(stats.platformFees - stats.totalWithdrawals)} icon={DollarSign} iconBg="bg-[#E8F5E9]" iconColor="text-[#1B5E20]" />
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden">
        <div className="px-[24px] py-[16px] border-b border-[#EAEAEA]">
          <p className="font-satoshi font-bold text-[15px] text-[#151515]">Recent Activity</p>
        </div>
        <div className="divide-y divide-[#EAEAEA]">
          {MOCK_ACTIVITY.map((item) => (
            <div key={item.id} className="px-[24px] py-[14px] flex items-center justify-between gap-[12px]">
              <div className="flex items-center gap-[12px]">
                <div className={`w-[8px] h-[8px] rounded-full shrink-0 ${
                  item.type === "order" ? "bg-[#2E7D32]" : item.type === "dispute" ? "bg-[#E53935]" : "bg-[#FF9800]"
                }`} />
                <p className="font-jakarta text-[13px] text-[#333333]">{item.description}</p>
              </div>
              <div className="flex items-center gap-[10px] shrink-0">
                {item.status && <StatusBadge status={item.status} />}
                <span className="font-jakarta text-[11px] text-[#9B9B9B]">{timeAgo(item.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
