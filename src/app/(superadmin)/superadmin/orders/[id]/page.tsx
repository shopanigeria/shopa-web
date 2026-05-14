"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatNaira } from "@/lib/utils";

interface OrderDetail {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount?: string | number;
  total?: string | number;
  deliveryAddress?: string;
  deliveryMethod?: string;
  notes?: string;
  createdAt: string;
  expectedDelivery?: string;
  deliveredAt?: string;
  orderItems?: { quantity: number; price: string | number; product: { name: string } }[];
  items?: { quantity: number; price: string | number; product: { name: string } }[];
  buyer?: { firstName: string; lastName: string; email?: string; phone?: string };
  user?: { firstName: string; lastName: string; email?: string; phone?: string };
  vendor?: { storeName: string; user?: { firstName: string; lastName: string } };
  campus?: { name: string };
  payment?: { status: string; reference?: string; amount?: number; method?: string };
}

const MOCK_ORDER: OrderDetail = {
  id: "o1", orderNumber: "AB123456", status: "DELIVERED", totalAmount: "40000",
  deliveryAddress: "Room 5, Male Hostel",
  createdAt: new Date("2026-02-26T10:00:00Z").toISOString(),
  expectedDelivery: "2026-02-28",
  deliveredAt: new Date("2026-02-28T08:00:00Z").toISOString(),
  orderItems: [{ quantity: 2, price: "20000", product: { name: "Primark Shirt" } }],
  user: { firstName: "Sade", lastName: "Bello", email: "sade@crawford.edu", phone: "08011111111" },
  vendor: { storeName: "Fresh Provisions", campus: { name: "Crawford University" }, user: { firstName: "Tolu", lastName: "Adeyemi" } },
  payment: { status: "SUCCESSFUL", reference: "PSK_REF_001", amount: 40000, method: "Card" },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-[8px] py-[8px] border-b border-[#F0F0F0] last:border-0">
      <span className="font-jakarta text-[12px] text-[#9B9B9B] w-[140px] shrink-0">{label}</span>
      <span className="font-jakarta text-[13px] font-semibold text-[#333333]">{value}</span>
    </div>
  );
}

export default function SuperAdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: order, isLoading, isError } = useQuery<OrderDetail>({
    queryKey: ["superadmin-order", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/${id}`);
      return data?.data ?? data;
    },
    retry: 1,
  });

  const o = order;
  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-[300px]">
          <div className="h-8 w-8 rounded-full border-4 border-[#2E7D32] border-t-transparent animate-spin" />
        </div>
      </SuperAdminLayout>
    );
  }

  if (isError || !o) {
    return (
      <SuperAdminLayout>
        <button type="button" onClick={() => router.back()} className="flex items-center gap-[6px] text-[#2E7D32] mb-[20px] hover:opacity-70 transition-opacity">
          <ChevronLeft size={18} /> <span className="font-jakarta text-[13px] font-semibold">Back to Orders</span>
        </button>
        <div className="flex items-center justify-center h-[300px]">
          <p className="font-jakarta text-[14px] text-[#9B9B9B]">Order not found or failed to load.</p>
        </div>
      </SuperAdminLayout>
    );
  }
  const shortId = (o.orderNumber ?? o.id).slice(-8).toUpperCase();
  const buyer = o.buyer ?? o.user;
  const orderItems = o.orderItems ?? o.items ?? [];
  const rawTotal = o.totalAmount ?? o.total ?? 0;
  const totalNum = parseFloat(String(rawTotal).replace(/[^0-9.]/g, ""));

  function fmtDate(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <SuperAdminLayout>
      <button type="button" onClick={() => router.back()} className="flex items-center gap-[6px] text-[#2E7D32] mb-[20px] hover:opacity-70 transition-opacity">
        <ChevronLeft size={18} /> <span className="font-jakarta text-[13px] font-semibold">Back to Orders</span>
      </button>

      <div className="flex items-center justify-between mb-[24px] flex-wrap gap-[12px]">
        <h1 className="font-satoshi font-bold text-[22px] text-[#151515]">Order #{shortId}</h1>
        <StatusBadge status={o.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px]">
        {/* Order details */}
        <div className="lg:col-span-2 flex flex-col gap-[16px]">
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
            <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[12px]">Order Items</p>
            {orderItems.length === 0 ? (
              <p className="font-jakarta text-[13px] text-[#9B9B9B]">No items data available.</p>
            ) : orderItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-[8px] border-b border-[#F0F0F0] last:border-0">
                <span className="font-jakarta text-[13px] text-[#333333]">{item.quantity}× {item.product.name}</span>
                <span className="font-jakarta font-semibold text-[13px] text-[#2E7D32]">{formatNaira(parseFloat(String(item.price).replace(/[^0-9.]/g, "")))}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-[12px] mt-[4px]">
              <span className="font-jakarta font-bold text-[13px] text-[#151515]">Total</span>
              <span className="font-jakarta font-bold text-[14px] text-[#2E7D32]">{formatNaira(isNaN(totalNum) ? 0 : totalNum)}</span>
            </div>
          </div>

          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
            <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[4px]">Order Details</p>
            <Row label="Placed" value={fmtDate(o.createdAt)} />
            <Row label="Expected Delivery" value={o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
            <Row label="Delivered At" value={fmtDate(o.deliveredAt)} />
            <Row label="Delivery Address" value={o.deliveryAddress ?? "—"} />
          </div>

          {/* Payment */}
          {o.payment && (
            <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
              <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[4px]">Payment</p>
              <Row label="Status" value={o.payment.status} />
              <Row label="Reference" value={o.payment.reference ?? "—"} />
              <Row label="Amount" value={o.payment.amount ? formatNaira(o.payment.amount) : "—"} />
              <Row label="Method" value={o.payment.method ?? "—"} />
            </div>
          )}
        </div>

        {/* Parties */}
        <div className="flex flex-col gap-[16px]">
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
            <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[12px]">Buyer</p>
            <Row label="Name" value={buyer ? `${buyer.firstName} ${buyer.lastName}` : "—"} />
            <Row label="Email" value={buyer?.email ?? "—"} />
            <Row label="Phone" value={buyer?.phone ?? "—"} />
          </div>
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
            <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[12px]">Vendor</p>
            <Row label="Store" value={o.vendor?.storeName ?? "—"} />
            <Row label="Owner" value={o.vendor?.user ? `${o.vendor.user.firstName} ${o.vendor.user.lastName}` : "—"} />
            <Row label="Campus" value={o.campus?.name ?? "—"} />
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
