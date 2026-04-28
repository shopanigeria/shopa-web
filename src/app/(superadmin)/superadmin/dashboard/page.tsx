"use client";

import { University, Store, GraduationCap, ShoppingBag, DollarSign, Wallet, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { formatNaira } from "@/lib/utils";

interface AnalyticsData {
  totalVendors?: number;
  totalStudents?: number;
  totalOrders?: number;
  totalRevenue?: number;
  platformFees?: number;
  totalWithdrawals?: number;
}

function SkeletonCard() {
  return <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px] h-[96px] animate-pulse" />;
}

export default function SuperAdminDashboardPage() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["superadmin-analytics"],
    queryFn: async () => {
      const { data } = await apiClient.get("/analytics/admin");
      return data?.data ?? data ?? {};
    },
  });

  const { data: pendingVendors, isLoading: pvLoading } = useQuery<unknown[]>({
    queryKey: ["superadmin-pending-vendors"],
    queryFn: async () => {
      const { data } = await apiClient.get("/vendors/admin/pending");
      return data?.data ?? data ?? [];
    },
  });

  const { data: pendingWithdrawals, isLoading: pwLoading } = useQuery<unknown[]>({
    queryKey: ["superadmin-pending-withdrawals"],
    queryFn: async () => {
      const { data } = await apiClient.get("/vendors/admin/withdrawals", { params: { status: "PENDING" } });
      return data?.data ?? data ?? [];
    },
  });

  const { data: openDisputes, isLoading: odLoading } = useQuery<unknown[]>({
    queryKey: ["superadmin-open-disputes"],
    queryFn: async () => {
      const { data } = await apiClient.get("/disputes", { params: { status: "OPEN" } });
      return data?.data ?? data ?? [];
    },
  });

  const { data: campuses, isLoading: campusesLoading } = useQuery<unknown[]>({
    queryKey: ["superadmin-campuses"],
    queryFn: async () => {
      const { data } = await apiClient.get("/campuses");
      return Array.isArray(data) ? data : (data?.data ?? []);
    },
  });

  const statsLoading = analyticsLoading || pvLoading || pwLoading || odLoading || campusesLoading;

  const totalUniversities   = campuses?.length                ?? 0;
  const totalVendors        = analytics?.totalVendors         ?? 0;
  const totalStudents       = analytics?.totalStudents        ?? 0;
  const totalOrders         = analytics?.totalOrders          ?? 0;
  const totalRevenue        = analytics?.totalRevenue         ?? 0;
  const platformFees        = analytics?.platformFees         ?? 0;
  const totalWithdrawals    = analytics?.totalWithdrawals     ?? 0;
  const pendingVendorCount  = pendingVendors?.length          ?? 0;
  const pendingWithdrawCount = pendingWithdrawals?.length     ?? 0;
  const openDisputeCount    = openDisputes?.length            ?? 0;

  const showBanner = pendingVendorCount > 0 || pendingWithdrawCount > 0 || openDisputeCount > 0;

  return (
    <SuperAdminLayout>
      <div className="mb-[28px]">
        <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">Platform Overview</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">Shopa — all universities</p>
      </div>

      {/* Pending actions banner */}
      {!statsLoading && showBanner && (
        <div className="bg-[#FFF3E0] border border-[#FFB300] rounded-[12px] p-[16px] mb-[24px] flex items-center gap-[12px]">
          <AlertTriangle size={20} className="text-[#FF9800] shrink-0" />
          <div className="flex gap-[20px] flex-wrap">
            {pendingVendorCount > 0 && (
              <a href="/superadmin/vendors" className="font-jakarta text-[13px] font-semibold text-[#FF9800] hover:underline">
                {pendingVendorCount} vendor application{pendingVendorCount !== 1 ? "s" : ""} pending
              </a>
            )}
            {pendingWithdrawCount > 0 && (
              <a href="/superadmin/withdrawals" className="font-jakarta text-[13px] font-semibold text-[#FF9800] hover:underline">
                {pendingWithdrawCount} withdrawal{pendingWithdrawCount !== 1 ? "s" : ""} pending
              </a>
            )}
            {openDisputeCount > 0 && (
              <a href="/superadmin/disputes" className="font-jakarta text-[13px] font-semibold text-[#FF9800] hover:underline">
                {openDisputeCount} open dispute{openDisputeCount !== 1 ? "s" : ""}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Stats grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[32px]">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[32px]">
          <StatsCard label="Universities"        value={totalUniversities}           icon={University}    iconBg="bg-[#E3F2FD]" iconColor="text-[#1565C0]" />
          <StatsCard label="Total Vendors"       value={totalVendors}                icon={Store}         iconBg="bg-[#D8FFDA]" iconColor="text-[#2E7D32]" />
          <StatsCard label="Total Students"      value={totalStudents}               icon={GraduationCap} iconBg="bg-[#F3E5F5]" iconColor="text-[#7B1FA2]" />
          <StatsCard label="Total Orders"        value={totalOrders}                 icon={ShoppingBag}   iconBg="bg-[#FFF3E0]" iconColor="text-[#FF9800]" />
          <StatsCard label="Total Revenue"       value={formatNaira(totalRevenue)}   icon={DollarSign}    iconBg="bg-[#D8FFDA]" iconColor="text-[#2E7D32]" />
          <StatsCard label="Platform Fees (7.5%)" value={formatNaira(platformFees)} icon={DollarSign}    iconBg="bg-[#FFF9C4]" iconColor="text-[#F9A825]" />
          <StatsCard label="Withdrawals Paid"    value={formatNaira(totalWithdrawals)} icon={Wallet}      iconBg="bg-[#FFEBEE]" iconColor="text-[#E53935]" />
          <StatsCard label="Net Revenue"         value={formatNaira(platformFees - totalWithdrawals)} icon={DollarSign} iconBg="bg-[#E8F5E9]" iconColor="text-[#1B5E20]" />
        </div>
      )}

      {/* Pending vendor applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px] mb-[16px]">
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
          <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[4px]">Pending Vendor Apps</p>
          <p className="font-satoshi font-bold text-[28px] text-[#FF9800]">
            {pvLoading ? "—" : pendingVendorCount}
          </p>
          <a href="/superadmin/vendors" className="font-jakarta text-[12px] text-[#2E7D32] font-semibold hover:underline mt-[4px] block">
            Review applications →
          </a>
        </div>
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
          <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[4px]">Pending Withdrawals</p>
          <p className="font-satoshi font-bold text-[28px] text-[#E53935]">
            {pwLoading ? "—" : pendingWithdrawCount}
          </p>
          <a href="/superadmin/withdrawals" className="font-jakarta text-[12px] text-[#2E7D32] font-semibold hover:underline mt-[4px] block">
            Process withdrawals →
          </a>
        </div>
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
          <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[4px]">Open Disputes</p>
          <p className="font-satoshi font-bold text-[28px] text-[#E53935]">
            {odLoading ? "—" : openDisputeCount}
          </p>
          <a href="/superadmin/disputes" className="font-jakarta text-[12px] text-[#2E7D32] font-semibold hover:underline mt-[4px] block">
            View disputes →
          </a>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
