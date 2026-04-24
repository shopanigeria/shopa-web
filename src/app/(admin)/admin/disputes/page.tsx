"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";

interface Dispute {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  order?: { orderNumber?: string; vendor?: { storeName?: string }; user?: { firstName: string; lastName: string } };
  user?: { firstName: string; lastName: string };
}

const MOCK_DISPUTES: Dispute[] = [
  { id: "d1", status: "VENDOR_RESPONDED", reason: "Item not delivered", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(), order: { orderNumber: "12345678", vendor: { storeName: "Fresh Provisions" }, user: { firstName: "Sade", lastName: "Bello" } } },
  { id: "d2", status: "OPEN", reason: "Wrong item received", createdAt: new Date().toISOString(), order: { orderNumber: "87654321", vendor: { storeName: "Campus Gadgets" }, user: { firstName: "Kelvin", lastName: "Osei" } } },
  { id: "d3", status: "RESOLVED", reason: "Item arrived damaged", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), order: { orderNumber: "11223344", vendor: { storeName: "Style Hub" }, user: { firstName: "Ngozi", lastName: "Eze" } } },
  { id: "d4", status: "VENDOR_TIMEOUT", reason: "Vendor disappeared after payment", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 55).toISOString(), order: { orderNumber: "55667788", vendor: { storeName: "Bad Store" }, user: { firstName: "Temi", lastName: "Adeyemi" } } },
];

export default function AdminDisputesPage() {
  const { user } = useAuthStore();
  const isMock = user?.id === "mock-admin-001";
  const { data: disputes, isLoading } = useQuery<Dispute[]>({
    queryKey: ["admin-disputes"],
    queryFn: async () => { const { data } = await apiClient.get("/disputes"); return data?.data ?? data ?? []; },
    enabled: !isMock,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const all = (disputes ?? MOCK_DISPUTES).filter((d) =>
    (!search || d.reason.toLowerCase().includes(search.toLowerCase()) || (d.order?.orderNumber ?? "").includes(search)) &&
    (!statusFilter || d.status === statusFilter)
  );

  const STATUS_OPTIONS = [
    { value: "OPEN", label: "Open (awaiting vendor)" },
    { value: "VENDOR_RESPONDED", label: "Vendor Responded — Action Required" },
    { value: "VENDOR_TIMEOUT", label: "Vendor Timeout" },
    { value: "UNDER_REVIEW", label: "Under Review" },
    { value: "ADMIN_TIMEOUT", label: "Admin Timeout" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "ESCALATED", label: "Escalated" },
    { value: "CLOSED", label: "Closed" },
  ];

  return (
    <AdminLayout campusName="Crawford University">
      <div className="mb-[20px]">
        <h1 className="font-satoshi font-bold text-[20px] md:text-[22px] text-[#151515]">Disputes</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{all.length} total disputes</p>
      </div>

      {/* Search + filter */}
      <div className="flex gap-[8px] mb-[16px] flex-wrap">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reason or order #..."
          className="flex-1 min-w-[180px] rounded-[8px] border border-[#EAEAEA] bg-white px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" title="Filter by status"
          className="rounded-[8px] border border-[#EAEAEA] bg-white px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] focus:outline-none focus:border-[#2E7D32]">
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden flex flex-col gap-[10px]">
        {isLoading ? [1,2,3].map((i) => <div key={i} className="bg-white rounded-[12px] border border-[#EAEAEA] h-[110px] animate-pulse" />) :
        all.length === 0 ? <p className="font-jakarta text-[14px] text-[#9B9B9B] text-center py-[40px]">No disputes found.</p> :
        all.map((d) => {
          const buyer = d.order?.user ?? d.user;
          return (
            <div key={d.id} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px]">
              <div className="flex items-start justify-between gap-[8px] mb-[8px]">
                <p className="font-jakarta font-bold text-[13px] text-[#151515]">
                  Order #{(d.order?.orderNumber ?? d.id).slice(-8).toUpperCase()}
                </p>
                <StatusBadge status={d.status} />
              </div>
              <p className="font-jakarta text-[12px] text-[#545454] mb-[4px]">{d.reason}</p>
              {buyer && <p className="font-jakarta text-[11px] text-[#9B9B9B] mb-[4px]">Buyer: {buyer.firstName} {buyer.lastName}</p>}
              {d.order?.vendor?.storeName && <p className="font-jakarta text-[11px] text-[#9B9B9B] mb-[10px]">Vendor: {d.order.vendor.storeName}</p>}
              <Link href={`/admin/disputes/${d.id}`} className="font-jakarta text-[12px] text-[#2E7D32] font-semibold underline">
                View Details →
              </Link>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <DataTable
          data={all as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          searchPlaceholder="Search disputes..."
          searchKeys={["reason"] as never[]}
          filters={[{ key: "status", label: "Status", options: STATUS_OPTIONS }]}
          emptyMessage="No disputes found."
          columns={[
            { key: "order", label: "Order #", render: (row) => { const d = row as unknown as Dispute; return <span className="font-jakarta font-semibold text-[13px] text-[#151515]">#{(d.order?.orderNumber ?? d.id).slice(-8).toUpperCase()}</span>; } },
            { key: "buyer", label: "Buyer", render: (row) => { const d = row as unknown as Dispute; const buyer = d.order?.user ?? d.user; return <span className="font-jakarta text-[13px] text-[#333333]">{buyer ? `${buyer.firstName} ${buyer.lastName}` : "—"}</span>; } },
            { key: "vendor", label: "Vendor", render: (row) => <span className="font-jakarta text-[13px] text-[#333333]">{(row as unknown as Dispute).order?.vendor?.storeName ?? "—"}</span> },
            { key: "reason", label: "Reason", render: (row) => <span className="font-jakarta text-[13px] text-[#333333] max-w-[200px] truncate block">{(row as unknown as Dispute).reason}</span> },
            { key: "status", label: "Status", render: (row) => <StatusBadge status={(row as unknown as Dispute).status} /> },
            { key: "createdAt", label: "Date", render: (row) => <span className="font-jakarta text-[12px] text-[#9B9B9B]">{new Date((row as unknown as Dispute).createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</span> },
            { key: "actions", label: "", render: (row) => { const d = row as unknown as Dispute; return <Link href={`/admin/disputes/${d.id}`} className="font-jakarta text-[12px] text-[#2E7D32] font-semibold hover:underline">View</Link>; } },
          ]}
        />
      </div>
    </AdminLayout>
  );
}
