"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { DollarSign, TrendingUp, Wallet, BarChart2 } from "lucide-react";
import { formatNaira } from "@/lib/utils";

interface AnalyticsData {
  totalRevenue: number;
  platformFees: number;
  totalWithdrawals: number;
  netRevenue: number;
  totalOrders: number;
  completedOrders: number;
  byUniversity: { name: string; revenue: number; orders: number; vendors: number }[];
  topVendors: { storeName: string; revenue: number; orders: number }[];
  topCategories: { name: string; revenue: number; count: number }[];
}

const MOCK_ANALYTICS: AnalyticsData = {
  totalRevenue: 4200000,
  platformFees: 315000,
  totalWithdrawals: 890000,
  netRevenue: 315000 - 890000 + 4200000,
  totalOrders: 1284,
  completedOrders: 1050,
  byUniversity: [
    { name: "Crawford University", revenue: 4200000, orders: 1284, vendors: 24 },
  ],
  topVendors: [
    { storeName: "Fresh Provisions", revenue: 850000, orders: 210 },
    { storeName: "Campus Gadgets", revenue: 720000, orders: 180 },
    { storeName: "Style Hub", revenue: 630000, orders: 158 },
    { storeName: "BookNook", revenue: 540000, orders: 135 },
    { storeName: "Campus Bites", revenue: 480000, orders: 120 },
  ],
  topCategories: [
    { name: "Provisions", revenue: 1200000, count: 420 },
    { name: "Clothing & Accessories", revenue: 980000, count: 310 },
    { name: "Gadgets & Accessories", revenue: 850000, count: 280 },
    { name: "Stationery", revenue: 620000, count: 190 },
    { name: "Body care & Beauty", revenue: 450000, count: 140 },
  ],
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full h-[8px] bg-[#EAEAEA] rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["superadmin-analytics-full"],
    queryFn: async () => { const { data } = await apiClient.get("/analytics/admin"); return data?.data ?? data; },
  });

  const a = analytics ?? MOCK_ANALYTICS;
  const maxVendorRev = Math.max(...a.topVendors.map((v) => v.revenue));
  const maxCatRev = Math.max(...a.topCategories.map((c) => c.revenue));

  return (
    <SuperAdminLayout>
      <div className="mb-[28px]">
        <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">Financial Analytics</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">Platform-wide financial overview</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[32px]">
        <StatsCard label="Total Revenue" value={formatNaira(a.totalRevenue)} icon={DollarSign} iconBg="bg-[#D8FFDA]" iconColor="text-[#2E7D32]" />
        <StatsCard label="Platform Fees (7.5%)" value={formatNaira(a.platformFees)} icon={TrendingUp} iconBg="bg-[#FFF9C4]" iconColor="text-[#F9A825]" />
        <StatsCard label="Withdrawals Paid" value={formatNaira(a.totalWithdrawals)} icon={Wallet} iconBg="bg-[#FFEBEE]" iconColor="text-[#E53935]" />
        <StatsCard label="Net Platform Revenue" value={formatNaira(a.platformFees)} icon={BarChart2} iconBg="bg-[#E8F5E9]" iconColor="text-[#1B5E20]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mb-[24px]">
        {/* Top vendors */}
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[24px]">
          <p className="font-satoshi font-bold text-[15px] text-[#151515] mb-[20px]">Top Performing Vendors</p>
          <div className="flex flex-col gap-[16px]">
            {a.topVendors.map((v, i) => (
              <div key={v.storeName}>
                <div className="flex items-center justify-between mb-[6px]">
                  <div className="flex items-center gap-[8px]">
                    <span className="font-jakarta text-[11px] font-bold text-[#9B9B9B] w-[16px]">#{i + 1}</span>
                    <span className="font-jakarta font-semibold text-[13px] text-[#151515]">{v.storeName}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-jakarta font-bold text-[13px] text-[#2E7D32]">{formatNaira(v.revenue)}</p>
                    <p className="font-jakarta text-[11px] text-[#9B9B9B]">{v.orders} orders</p>
                  </div>
                </div>
                <Bar value={v.revenue} max={maxVendorRev} color="bg-[#2E7D32]" />
              </div>
            ))}
          </div>
        </div>

        {/* Top categories */}
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[24px]">
          <p className="font-satoshi font-bold text-[15px] text-[#151515] mb-[20px]">Top Categories by Revenue</p>
          <div className="flex flex-col gap-[16px]">
            {a.topCategories.map((c, i) => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-[6px]">
                  <div className="flex items-center gap-[8px]">
                    <span className="font-jakarta text-[11px] font-bold text-[#9B9B9B] w-[16px]">#{i + 1}</span>
                    <span className="font-jakarta font-semibold text-[13px] text-[#151515]">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-jakarta font-bold text-[13px] text-[#FDC500]">{formatNaira(c.revenue)}</p>
                    <p className="font-jakarta text-[11px] text-[#9B9B9B]">{c.count} orders</p>
                  </div>
                </div>
                <Bar value={c.revenue} max={maxCatRev} color="bg-[#FDC500]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per university breakdown */}
      <div className="bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden">
        <div className="px-[24px] py-[16px] border-b border-[#EAEAEA]">
          <p className="font-satoshi font-bold text-[15px] text-[#151515]">Per-University Breakdown</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EAEAEA] bg-[#F7FFF8]">
                {["University", "Total Revenue", "Orders", "Vendors", "Platform Fees"].map((h) => (
                  <th key={h} className="px-[20px] py-[12px] text-left font-jakarta text-[12px] font-semibold text-[#9B9B9B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {a.byUniversity.map((u) => (
                <tr key={u.name} className="border-b border-[#EAEAEA] last:border-0">
                  <td className="px-[20px] py-[14px]"><span className="font-jakarta font-semibold text-[13px] text-[#151515]">{u.name}</span></td>
                  <td className="px-[20px] py-[14px]"><span className="font-jakarta font-bold text-[13px] text-[#2E7D32]">{formatNaira(u.revenue)}</span></td>
                  <td className="px-[20px] py-[14px]"><span className="font-jakarta text-[13px] text-[#333333]">{u.orders}</span></td>
                  <td className="px-[20px] py-[14px]"><span className="font-jakarta text-[13px] text-[#333333]">{u.vendors}</span></td>
                  <td className="px-[20px] py-[14px]"><span className="font-jakarta font-semibold text-[13px] text-[#FDC500]">{formatNaira(u.revenue * 0.075)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
