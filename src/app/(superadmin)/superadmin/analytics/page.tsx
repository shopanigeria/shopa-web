"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { DollarSign, TrendingUp, Wallet, BarChart2 } from "lucide-react";
import { formatNaira } from "@/lib/utils";

interface StatsData {
  totalRevenue: number;
  platformFees: number;
  totalWithdrawals: number;
  netRevenue: number;
}

interface Campus { id: string; name: string; }

interface Order {
  id: string;
  status: string;
  refundStatus?: string | null;
  total?: string | number;
  totalAmount?: string | number;
  vendorId?: string;
  vendor?: { id?: string; storeName?: string };
  campus?: { id?: string; name?: string };
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-[8px] bg-[#EAEAEA] rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function getOrderAmount(o: Order): number {
  const raw = o.totalAmount ?? o.total ?? 0;
  const n = typeof raw === "string" ? parseFloat(raw.replace(/[^0-9.]/g, "")) : Number(raw);
  return isNaN(n) ? 0 : n;
}

function getVendorId(o: Order): string {
  return o.vendorId ?? o.vendor?.id ?? "";
}

function qualify(orders: Order[]) {
  return orders.filter((o) =>
    !["CANCELLED", "FAILED", "REJECTED"].includes(o.status) &&
    o.refundStatus !== "REFUNDED"
  );
}

function filterByCampus(orders: Order[], campusId: string | null) {
  if (!campusId) return orders;
  return orders.filter((o) => o.campus?.id === campusId);
}

function computeTopByRevenue(orders: Order[], campusId: string | null) {
  const map: Record<string, { storeName: string; revenue: number; orders: number }> = {};
  for (const o of qualify(filterByCampus(orders, campusId))) {
    const vid = getVendorId(o);
    const name = o.vendor?.storeName ?? vid;
    if (!map[vid]) map[vid] = { storeName: name, revenue: 0, orders: 0 };
    map[vid].revenue += getOrderAmount(o);
    map[vid].orders += 1;
  }
  return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
}

function computeTopBySales(orders: Order[], campusId: string | null) {
  const map: Record<string, { storeName: string; orders: number }> = {};
  for (const o of qualify(filterByCampus(orders, campusId))) {
    const vid = getVendorId(o);
    const name = o.vendor?.storeName ?? vid;
    if (!map[vid]) map[vid] = { storeName: name, orders: 0 };
    map[vid].orders += 1;
  }
  return Object.values(map).sort((a, b) => b.orders - a.orders).slice(0, 5);
}

function computeBreakdown(orders: Order[], campusId: string | null, name: string) {
  const filtered = qualify(filterByCampus(orders, campusId));
  const totalRev = filtered.reduce((s, o) => s + getOrderAmount(o), 0);
  const fees = totalRev * 0.075;
  return { name, totalRevenue: totalRev, platformFees: fees, netRevenue: totalRev - fees, totalOrders: filtered.length };
}

const ALL = "all";

export default function AnalyticsPage() {
  const [vendorUniFilter, setVendorUniFilter] = useState<string>(ALL);
  const [salesUniFilter, setSalesUniFilter] = useState<string>(ALL);
  const [uniFilter, setUniFilter] = useState<string>(ALL);

  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["superadmin-analytics-full"],
    queryFn: async () => {
      const { data } = await apiClient.get("/analytics/admin");
      return data?.stats ?? data?.data ?? data;
    },
  });

  const { data: campuses = [], isLoading: campusesLoading } = useQuery<Campus[]>({
    queryKey: ["superadmin-campuses-analytics"],
    queryFn: async () => {
      const { data } = await apiClient.get("/campuses", { params: { includeInactive: true } });
      return Array.isArray(data) ? data : (data?.data ?? []);
    },
  });

  // All orders — fetched once
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["superadmin-all-orders-analytics"],
    queryFn: async () => {
      const { data } = await apiClient.get("/orders");
      return data?.data ?? data ?? [];
    },
    staleTime: 0,
  });

  const isLoading = statsLoading || campusesLoading || ordersLoading;


  const campusIdForRevenue = vendorUniFilter === ALL ? null : vendorUniFilter;
  const campusIdForSales   = salesUniFilter   === ALL ? null : salesUniFilter;
  const campusIdForUni     = uniFilter        === ALL ? null : uniFilter;

  const topVendorsByRevenue = useMemo(() =>
    computeTopByRevenue(allOrders, campusIdForRevenue),
  [allOrders, campusIdForRevenue]);

  const topVendorsBySales = useMemo(() =>
    computeTopBySales(allOrders, campusIdForSales),
  [allOrders, campusIdForSales]);

  const uniBreakdown = useMemo(() => {
    const campus = campuses.find((c) => c.id === uniFilter);
    return computeBreakdown(allOrders, campusIdForUni, campus?.name ?? "All Universities");
  }, [allOrders, campusIdForUni, campuses, uniFilter]);

  const maxVendorRev = topVendorsByRevenue.length ? Math.max(...topVendorsByRevenue.map((v) => v.revenue)) : 1;
  const maxVendorSales = topVendorsBySales.length ? Math.max(...topVendorsBySales.map((v) => v.orders)) : 1;

  return (
    <SuperAdminLayout>
      <div className="mb-[28px]">
        <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">Financial Analytics</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">Platform-wide financial overview</p>
      </div>

      {/* Key metrics */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[32px]">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-[12px] border border-[#EAEAEA] h-[96px] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[32px]">
          <StatsCard label="Total Revenue" value={formatNaira(stats?.totalRevenue ?? 0)} icon={DollarSign} iconBg="bg-[#D8FFDA]" iconColor="text-[#2E7D32]" />
          <StatsCard label="Platform Fees (7.5%)" value={formatNaira(stats?.platformFees ?? 0)} icon={TrendingUp} iconBg="bg-[#FFF9C4]" iconColor="text-[#F9A825]" />
          <StatsCard label="Withdrawals Paid" value={formatNaira(stats?.totalWithdrawals ?? 0)} icon={Wallet} iconBg="bg-[#FFEBEE]" iconColor="text-[#E53935]" />
          <StatsCard label="Net Revenue" value={formatNaira(stats?.netRevenue ?? ((stats?.totalRevenue ?? 0) - (stats?.platformFees ?? 0)))} icon={BarChart2} iconBg="bg-[#E8F5E9]" iconColor="text-[#1B5E20]" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mb-[24px]">

        {/* Top vendors by revenue */}
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[24px]">
          <div className="flex items-center justify-between mb-[20px]">
            <p className="font-satoshi font-bold text-[15px] text-[#151515]">Top Vendors by Revenue</p>
            <select value={vendorUniFilter} onChange={(e) => setVendorUniFilter(e.target.value)} aria-label="Filter by university"
              className="text-[12px] font-jakarta border border-[#EAEAEA] rounded-[6px] px-[8px] py-[4px] text-[#333333] focus:outline-none focus:border-[#2E7D32]">
              <option value={ALL}>All Universities</option>
              {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {isLoading ? <div className="h-[160px] animate-pulse bg-[#EAEAEA] rounded-[8px]" /> :
           !topVendorsByRevenue.length ? <p className="font-jakarta text-[13px] text-[#9B9B9B]">No vendor data yet.</p> : (
            <div className="flex flex-col gap-[16px]">
              {topVendorsByRevenue.map((v, i) => (
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
          )}
        </div>

        {/* Top vendors by sales */}
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[24px]">
          <div className="flex items-center justify-between mb-[20px]">
            <p className="font-satoshi font-bold text-[15px] text-[#151515]">Top Vendors by Sales</p>
            <select value={salesUniFilter} onChange={(e) => setSalesUniFilter(e.target.value)} aria-label="Filter by university"
              className="text-[12px] font-jakarta border border-[#EAEAEA] rounded-[6px] px-[8px] py-[4px] text-[#333333] focus:outline-none focus:border-[#2E7D32]">
              <option value={ALL}>All Universities</option>
              {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {isLoading ? <div className="h-[160px] animate-pulse bg-[#EAEAEA] rounded-[8px]" /> :
           !topVendorsBySales.length ? <p className="font-jakarta text-[13px] text-[#9B9B9B]">No sales data yet.</p> : (
            <div className="flex flex-col gap-[16px]">
              {topVendorsBySales.map((v, i) => (
                <div key={v.storeName}>
                  <div className="flex items-center justify-between mb-[6px]">
                    <div className="flex items-center gap-[8px]">
                      <span className="font-jakarta text-[11px] font-bold text-[#9B9B9B] w-[16px]">#{i + 1}</span>
                      <span className="font-jakarta font-semibold text-[13px] text-[#151515]">{v.storeName}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-jakarta font-bold text-[13px] text-[#FDC500]">{v.orders} orders</p>
                    </div>
                  </div>
                  <Bar value={v.orders} max={maxVendorSales} color="bg-[#FDC500]" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Per university breakdown */}
      <div className="bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden mb-[40px]">
        <div className="px-[24px] py-[16px] border-b border-[#EAEAEA] flex items-center justify-between">
          <p className="font-satoshi font-bold text-[15px] text-[#151515]">University Breakdown</p>
          <select value={uniFilter} onChange={(e) => setUniFilter(e.target.value)} aria-label="Filter by university"
            className="text-[12px] font-jakarta border border-[#EAEAEA] rounded-[6px] px-[8px] py-[4px] text-[#333333] focus:outline-none focus:border-[#2E7D32]">
            <option value={ALL}>All Universities</option>
            {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {isLoading ? (
          <div className="p-[24px] animate-pulse bg-[#EAEAEA] h-[80px] m-[16px] rounded-[8px]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EAEAEA] bg-[#F7FFF8]">
                  {["University", "Total Sales", "Total Revenue", "Platform Fees (7.5%)", "Net Revenue"].map((h) => (
                    <th key={h} className="px-[20px] py-[12px] text-left font-jakarta text-[12px] font-semibold text-[#9B9B9B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#EAEAEA] last:border-0">
                  <td className="px-[20px] py-[14px]"><span className="font-jakarta font-semibold text-[13px] text-[#151515]">{uniBreakdown.name}</span></td>
                  <td className="px-[20px] py-[14px]"><span className="font-jakarta text-[13px] text-[#333333]">{uniBreakdown.totalOrders}</span></td>
                  <td className="px-[20px] py-[14px]"><span className="font-jakarta font-bold text-[13px] text-[#2E7D32]">{formatNaira(uniBreakdown.totalRevenue)}</span></td>
                  <td className="px-[20px] py-[14px]"><span className="font-jakarta font-semibold text-[13px] text-[#FDC500]">{formatNaira(uniBreakdown.platformFees)}</span></td>
                  <td className="px-[20px] py-[14px]"><span className="font-jakarta font-bold text-[13px] text-[#1B5E20]">{formatNaira(uniBreakdown.netRevenue)}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
