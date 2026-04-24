"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";
import { formatNaira } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
  vendor?: { storeName: string; campus?: { name: string } };
}

const MOCK_ORDERS: Order[] = [
  { id: "o1", orderNumber: "AB123456", status: "DELIVERED", totalAmount: "40000", createdAt: new Date().toISOString(), user: { firstName: "Sade", lastName: "Bello" }, vendor: { storeName: "Fresh Provisions", campus: { name: "Crawford University" } } },
  { id: "o2", orderNumber: "CD789012", status: "PENDING", totalAmount: "12500", createdAt: new Date().toISOString(), user: { firstName: "Kelvin", lastName: "Osei" }, vendor: { storeName: "Campus Gadgets", campus: { name: "Crawford University" } } },
  { id: "o3", orderNumber: "EF345678", status: "FAILED", totalAmount: "8000", createdAt: new Date().toISOString(), user: { firstName: "Ngozi", lastName: "Eze" }, vendor: { storeName: "Style Hub", campus: { name: "Crawford University" } } },
];

export default function SuperAdminOrdersPage() {
  const router = useRouter();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["superadmin-orders"],
    queryFn: async () => { const { data } = await apiClient.get("/orders"); return data?.data ?? data ?? []; },
  });

  const all = orders ?? MOCK_ORDERS;

  return (
    <SuperAdminLayout>
      <div className="mb-[28px]">
        <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">All Orders</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{all.length} orders platform-wide</p>
      </div>

      <DataTable
        data={all as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchPlaceholder="Search by order number or buyer..."
        searchKeys={["orderNumber"] as never[]}
        filters={[
          { key: "status", label: "Status", options: [
            { value: "PENDING", label: "Pending" }, { value: "ACCEPTED", label: "Accepted" },
            { value: "DELIVERED", label: "Delivered" }, { value: "FAILED", label: "Failed" }, { value: "CANCELLED", label: "Cancelled" },
          ]},
        ]}
        emptyMessage="No orders found."
        onRowClick={(row) => router.push(`/superadmin/orders/${(row as unknown as Order).id}`)}
        columns={[
          { key: "orderNumber", label: "Order #", render: (r) => <span className="font-jakarta font-semibold text-[13px] text-[#151515]">#{((r as unknown as Order).orderNumber ?? (r as unknown as Order).id).slice(-8).toUpperCase()}</span> },
          { key: "buyer", label: "Buyer", render: (r) => { const o = r as unknown as Order; return <span className="font-jakarta text-[13px] text-[#333333]">{o.user ? `${o.user.firstName} ${o.user.lastName}` : "—"}</span>; } },
          { key: "vendor", label: "Vendor", render: (r) => <span className="font-jakarta text-[13px] text-[#333333]">{(r as unknown as Order).vendor?.storeName ?? "—"}</span> },
          { key: "campus", label: "Campus", render: (r) => <span className="font-jakarta text-[12px] text-[#9B9B9B]">{(r as unknown as Order).vendor?.campus?.name ?? "—"}</span> },
          { key: "totalAmount", label: "Amount", render: (r) => <span className="font-jakarta font-semibold text-[13px] text-[#2E7D32]">{formatNaira(parseFloat((r as unknown as Order).totalAmount))}</span> },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={(r as unknown as Order).status} /> },
          { key: "createdAt", label: "Date", render: (r) => <span className="font-jakarta text-[12px] text-[#9B9B9B]">{new Date((r as unknown as Order).createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</span> },
        ]}
      />
    </SuperAdminLayout>
  );
}
