"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Settings, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { formatNaira } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface VendorProfile {
  id: string;
  storeName: string;
  availableBalance?: number;
}

interface VendorAnalytics {
  pendingOrders: number;
  pendingDisputes: number;
  totalSales: number;
  availableBalance: number;
}

interface OrderItem {
  quantity: number;
  price: string;
  product: { name: string; imageUrls?: string[]; images?: string[] };
}

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: string;
  deliveryAddress?: string;
  createdAt: string;
  expectedDelivery?: string;
  orderItems: OrderItem[];
  user?: { firstName: string; lastName: string };
}

interface Dispute {
  id: string;
  orderId: string;
  order?: { orderNumber?: string; id: string; orderItems: OrderItem[] };
  reason: string;
  description?: string;
  proofUrls?: string[];
  status: string;
  createdAt: string;
}

// ── Mock fallback data (used when API is unavailable) ──────────────────────

const MOCK_ANALYTICS: VendorAnalytics = {
  pendingOrders: 1,
  pendingDisputes: 1,
  totalSales: 1,
  availableBalance: 100000,
};

const MOCK_INCOMING: Order[] = [
  {
    id: "mock-order-1",
    orderNumber: "ORD12345678",
    status: "PAID",
    totalAmount: "40000",
    deliveryAddress: "Male Hostel, Room 2",
    createdAt: new Date().toISOString(),
    orderItems: [{ quantity: 2, price: "20000", product: { name: "Primark Shirt" } }],
    user: { firstName: "Ayomide", lastName: "Lawal" },
  },
];

const MOCK_PENDING: Order[] = [
  {
    id: "mock-order-2",
    orderNumber: "ORD87654321",
    status: "CONFIRMED",
    totalAmount: "40000",
    deliveryAddress: "Female Hostel, Room 5",
    createdAt: new Date().toISOString(),
    expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    orderItems: [{ quantity: 2, price: "20000", product: { name: "Primark Shirt" } }],
    user: { firstName: "Ayomide", lastName: "Lawal" },
  },
];

const MOCK_DISPUTES: Dispute[] = [
  {
    id: "mock-dispute-1",
    orderId: "mock-order-2",
    order: {
      orderNumber: "ORD87654321",
      id: "mock-order-2",
      orderItems: [{ quantity: 2, price: "20000", product: { name: "Primark Shirt" } }],
    },
    reason: "One of the shirts that was delivered to me was torn.",
    status: "OPEN",
    createdAt: new Date().toISOString(),
  },
];

// ── Helper ─────────────────────────────────────────────────────────────────

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${dd}-${mm}-${yyyy}, ${h}:${min}${ampm}`;
}

// ── Modals ─────────────────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />;
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const item = order.orderItems[0];
  const img = item?.product?.imageUrls?.[0] ?? item?.product?.images?.[0];
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[24px] pb-[32px] w-full max-w-[360px] relative">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>
          <div className="mb-[16px]">
            <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em]">Name</p>
            <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">
              {order.user ? `${order.user.firstName} ${order.user.lastName}` : "—"}
            </p>
          </div>
          <div className="mb-[16px]">
            <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em] mb-[8px]">Order Information</p>
            <div className="flex items-center gap-[12px]">
              <div className="w-[56px] h-[56px] rounded-[8px] bg-[#EAEAEA] overflow-hidden shrink-0 relative">
                {img && <Image src={img} alt={item.product.name} fill className="object-cover" sizes="56px" />}
              </div>
              <p className="font-jakarta text-[14px] text-[#333333] tracking-[-0.04em]">
                <span className="font-bold">{item?.quantity}x</span> {item?.product.name}
              </p>
            </div>
          </div>
          <div className="mb-[16px]">
            <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em]">Total Cost</p>
            <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">{formatNaira(parseFloat(order.totalAmount))}</p>
          </div>
          {order.deliveryAddress && (
            <div>
              <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em]">Delivery Address</p>
              <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">{order.deliveryAddress}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DisputeDetailModal({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const item = dispute.order?.orderItems[0];
  const img = item?.product?.imageUrls?.[0] ?? item?.product?.images?.[0];
  const short = (dispute.order?.orderNumber ?? dispute.orderId).slice(-8).toUpperCase();
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[24px] pb-[32px] w-full max-w-[360px] relative">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>
          <div className="mb-[16px]">
            <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em]">Order ID</p>
            <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">#{short}</p>
          </div>
          {item && (
            <div className="mb-[16px]">
              <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em] mb-[8px]">Order Information</p>
              <div className="flex items-center gap-[12px]">
                <div className="w-[56px] h-[56px] rounded-[8px] bg-[#EAEAEA] overflow-hidden shrink-0 relative">
                  {img && <Image src={img} alt={item.product.name} fill className="object-cover" sizes="56px" />}
                </div>
                <p className="font-jakarta text-[14px] text-[#333333] tracking-[-0.04em]">
                  <span className="font-bold">{item.quantity}x</span> {item.product.name}
                </p>
              </div>
            </div>
          )}
          <div className="mb-[16px]">
            <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em] mb-[4px]">Customer Complaint</p>
            <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">{dispute.reason}</p>
          </div>
          {dispute.proofUrls && dispute.proofUrls.length > 0 && (
            <a href={dispute.proofUrls[0]} target="_blank" rel="noopener noreferrer"
              className="font-jakarta text-[14px] text-[#2E7D32] font-bold underline tracking-[-0.04em]">
              Click here
            </a>
          )}
          {(!dispute.proofUrls || dispute.proofUrls.length === 0) && (
            <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">
              <span className="text-[#2E7D32] font-bold underline">Click here</span> to view proof
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function AcceptOrderModal({ order, onClose, onConfirm, isLoading }: {
  order: Order; onClose: () => void; onConfirm: (date: string) => void; isLoading: boolean;
}) {
  const [date, setDate] = useState("");

  const minDate = new Date(order.createdAt).toISOString().split("T")[0];
  const maxDate = new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[24px] pb-[32px] w-full max-w-[360px] relative">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>
          <p className="font-jakarta font-bold text-[16px] text-[#333333] tracking-[-0.04em] mb-[4px] mt-[8px]">Set Delivery Date</p>
          <p className="font-jakarta text-[12px] text-[#9B9B9B] tracking-[-0.04em] mb-[12px]">
            Must be within 5 days of order placement.
          </p>
          <input
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Delivery date"
            title="Delivery date"
            className="w-full rounded-[8px] bg-[#EAEAEA] px-[12px] py-[14px] font-jakarta text-[14px] text-[#333333] focus:outline-none mb-[24px]"
          />
          <button type="button" onClick={() => onConfirm(date)} disabled={isLoading || !date}
            className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors">
            {isLoading ? "Accepting..." : "Accept Order"}
          </button>
        </div>
      </div>
    </>
  );
}

function DeclineOrderModal({ onClose, onConfirm, isLoading }: {
  onClose: () => void; onConfirm: () => void; isLoading: boolean;
}) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[24px] pb-[32px] w-full max-w-[360px] relative">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>
          <p className="font-jakarta font-bold text-[16px] text-[#333333] tracking-[-0.04em] mb-[24px] mt-[36px]">
            Are you sure you want to decline this order?
          </p>
          <button type="button" onClick={onConfirm} disabled={isLoading}
            className="w-full h-[53px] rounded-[8px] bg-[#E53935] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 mb-[12px] hover:bg-[#C62828] transition-colors">
            {isLoading ? "Declining..." : "Decline Order"}
          </button>
          <button type="button" onClick={onClose} className="w-full font-jakarta text-[14px] text-[#9B9B9B] underline tracking-[-0.04em]">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function VendorDashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isMock = !user?.id || user.id === "mock-vendor-001";

  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [acceptOrder, setAcceptOrder] = useState<Order | null>(null);
  const [declineOrder, setDeclineOrder] = useState<Order | null>(null);
  const [viewDispute, setViewDispute] = useState<Dispute | null>(null);

  // ── Data fetching ──
  const { data: profile } = useQuery<VendorProfile>({
    queryKey: ["vendor-profile"],
    queryFn: async () => { const { data } = await apiClient.get("/vendors/me"); return data; },
    enabled: !isMock,
    retry: false,
  });

  const { data: analytics } = useQuery<VendorAnalytics>({
    queryKey: ["vendor-analytics"],
    queryFn: async () => { const { data } = await apiClient.get("/analytics/vendor"); return data; },
    enabled: !isMock,
    retry: false,
  });

  const { data: incomingOrders } = useQuery<Order[]>({
    queryKey: ["vendor-orders", "incoming"],
    queryFn: async () => {
      const { data } = await apiClient.get("/orders/vendor-orders?status=PAID");
      return data?.orders ?? data ?? [];
    },
    enabled: !isMock,
    retry: false,
  });

  const { data: pendingOrders } = useQuery<Order[]>({
    queryKey: ["vendor-orders", "pending"],
    queryFn: async () => {
      const { data } = await apiClient.get("/orders/vendor-orders?status=CONFIRMED");
      return data?.orders ?? data ?? [];
    },
    enabled: !isMock,
    retry: false,
  });

  const { data: disputes } = useQuery<Dispute[]>({
    queryKey: ["vendor-disputes"],
    queryFn: async () => {
      const { data } = await apiClient.get("/disputes/vendor-disputes");
      return data?.disputes ?? data ?? [];
    },
    enabled: !isMock,
    retry: false,
  });

  // Use mock data when in dev mock mode
  const stats = analytics ?? (isMock ? MOCK_ANALYTICS : null);
  const incoming = incomingOrders ?? (isMock ? MOCK_INCOMING : []);
  const pending = pendingOrders ?? (isMock ? MOCK_PENDING : []);
  const openDisputes = (disputes ?? (isMock ? MOCK_DISPUTES : [])).filter((d) => d.status === "OPEN");
  const storeName = profile?.storeName ?? user?.firstName ?? "Store";

  // ── Mutations ──
  const acceptMutation = useMutation({
    mutationFn: async ({ orderId, date }: { orderId: string; date: string }) => {
      await apiClient.post(`/orders/${orderId}/accept`, { expectedDelivery: date });
    },
    onSuccess: () => {
      toast.success("Order accepted!");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      setAcceptOrder(null);
    },
    onError: () => toast.error("Failed to accept order"),
  });

  const declineMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await apiClient.post(`/orders/${orderId}/reject`, { reason: "Declined by vendor" });
    },
    onSuccess: () => {
      toast.success("Order declined.");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      setDeclineOrder(null);
    },
    onError: () => toast.error("Failed to decline order"),
  });

  const shortId = (o: Order) => (o.orderNumber ?? o.id).slice(-8).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      {/* Header — mobile only */}
      <div className="md:hidden bg-[#2E7D32] rounded-b-[12px] px-[24px] pt-[56px] pb-[20px] flex items-center justify-between">
        <Image src="/images/logo.svg" alt="Shopa" width={100} height={36} priority />
        <div className="flex items-center gap-[12px]">
          <Link href="/vendor/notifications"
            className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center">
            <Bell size={18} className="text-white" />
          </Link>
          <Link href="/vendor/settings"
            className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center">
            <Settings size={18} className="text-white" />
          </Link>
        </div>
      </div>

      {/* Desktop top bar */}
      <div className="hidden md:flex items-center justify-between px-[32px] py-[20px] border-b border-[#EAEAEA] bg-white">
        <h1 className="font-satoshi font-bold text-[20px] text-[#151515]">Dashboard</h1>
        <div className="flex items-center gap-[10px]">
          <Link href="/vendor/notifications" aria-label="Notifications"
            className="w-[36px] h-[36px] rounded-full bg-[#F7FFF8] border border-[#EAEAEA] flex items-center justify-center hover:bg-[#D8FFDA] transition-colors">
            <Bell size={18} className="text-[#2E7D32]" />
          </Link>
          <Link href="/vendor/settings" aria-label="Settings"
            className="w-[36px] h-[36px] rounded-full bg-[#F7FFF8] border border-[#EAEAEA] flex items-center justify-center hover:bg-[#D8FFDA] transition-colors">
            <Settings size={18} className="text-[#2E7D32]" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="px-[24px] md:px-[32px] lg:px-[40px] pt-[20px]">
        {/* Welcome */}
        <h1 className="font-jakarta font-bold text-[18px] md:text-[20px] text-[#2E7D32] tracking-[-0.04em] mb-[16px]">
          Welcome, {storeName}!
        </h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px] mb-[24px]">
          <StatCard
            iconBg="bg-[#FFF3E0]"
            iconColor="text-[#FF9800]"
            label="Pending Orders"
            value={`${stats?.pendingOrders ?? 0} Order${(stats?.pendingOrders ?? 0) !== 1 ? "s" : ""}`}
            icon="orders"
          />
          <StatCard
            iconBg="bg-[#FFEBEE]"
            iconColor="text-[#E53935]"
            label="Pending Dispute"
            value={`${stats?.pendingDisputes ?? 0} Dispute${(stats?.pendingDisputes ?? 0) !== 1 ? "s" : ""}`}
            icon="dispute"
          />
          <StatCard
            iconBg="bg-[#2E7D32]"
            iconColor="text-white"
            label="Total Sales"
            value={`${stats?.totalSales ?? 0} Sale${(stats?.totalSales ?? 0) !== 1 ? "s" : ""}`}
            icon="sales"
          />
          <StatCard
            iconBg="bg-[#FFC107]"
            iconColor="text-white"
            label="Avail. Balance"
            value={formatNaira(stats?.availableBalance ?? 0)}
            icon="balance"
          />
        </div>

        {/* Incoming Orders */}
        <section className="mb-[24px]">
          <p className="font-jakarta font-semibold text-[14px] text-[#333333] tracking-[-0.04em] mb-[10px]">
            Incoming Orders
          </p>
          {incoming.length === 0 ? (
            <p className="font-jakarta text-[13px] text-[#9B9B9B] tracking-[-0.04em]">No incoming orders</p>
          ) : (
            incoming.map((order) => (
              <div key={order.id} className="bg-white border border-[#EAEAEA] rounded-[8px] px-[16px] py-[14px] mb-[10px]">
                <div className="flex items-center justify-between mb-[6px]">
                  <p className="font-jakarta font-semibold text-[14px] text-[#333333] tracking-[-0.04em]">
                    Order #{shortId(order)}
                  </p>
                  <div className="flex gap-[8px]">
                    <button type="button" onClick={() => setAcceptOrder(order)}
                      className="h-[32px] px-[14px] rounded-[6px] bg-[#2E7D32] font-jakarta text-[12px] font-semibold text-white hover:bg-[#1D5620] transition-colors">
                      Accept
                    </button>
                    <button type="button" onClick={() => setDeclineOrder(order)}
                      className="h-[32px] px-[14px] rounded-[6px] bg-[#E53935] font-jakarta text-[12px] font-semibold text-white hover:bg-[#C62828] transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
                <button type="button" onClick={() => setViewOrder(order)}
                  className="font-jakarta text-[13px] font-semibold text-[#FDC500] underline tracking-[-0.04em]">
                  View Details
                </button>
              </div>
            ))
          )}
        </section>

        {/* Pending Orders */}
        <section className="mb-[24px]">
          <div className="flex items-center justify-between mb-[10px]">
            <p className="font-jakarta font-semibold text-[14px] text-[#333333] tracking-[-0.04em]">Pending Orders</p>
            <Link href="/vendor/orders" className="font-jakarta text-[13px] text-[#FDC500] font-semibold tracking-[-0.04em]">See all</Link>
          </div>
          {pending.length === 0 ? (
            <p className="font-jakarta text-[13px] text-[#9B9B9B] tracking-[-0.04em]">No pending orders</p>
          ) : (
            pending.slice(0, 3).map((order) => (
              <div key={order.id} className="bg-white border border-[#EAEAEA] rounded-[8px] px-[16px] py-[14px] mb-[10px]">
                <div className="flex items-start justify-between mb-[6px]">
                  <p className="font-jakarta font-semibold text-[14px] text-[#333333] tracking-[-0.04em]">
                    Order #{shortId(order)}
                  </p>
                  {order.expectedDelivery && (
                    <div className="text-right">
                      <p className="font-jakarta text-[12px] font-semibold text-[#2E7D32] tracking-[-0.04em]">Expected Delivery</p>
                      <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em]">
                        {formatOrderDate(order.expectedDelivery)}
                      </p>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => setViewOrder(order)}
                  className="font-jakarta text-[13px] font-semibold text-[#FDC500] underline tracking-[-0.04em]">
                  View Details
                </button>
              </div>
            ))
          )}
        </section>

        {/* Pending Order Disputes */}
        <section className="mb-[24px]">
          <div className="flex items-center justify-between mb-[10px]">
            <p className="font-jakarta font-semibold text-[14px] text-[#333333] tracking-[-0.04em]">Pending Order Dispute</p>
            <Link href="/vendor/disputes" className="font-jakarta text-[13px] text-[#FDC500] font-semibold tracking-[-0.04em]">See all</Link>
          </div>
          {openDisputes.length === 0 ? (
            <p className="font-jakarta text-[13px] text-[#9B9B9B] tracking-[-0.04em]">No pending disputes</p>
          ) : (
            openDisputes.slice(0, 3).map((dispute) => (
              <div key={dispute.id} className="bg-white border border-[#EAEAEA] rounded-[8px] px-[16px] py-[14px] mb-[10px]">
                <div className="flex items-center justify-between mb-[6px]">
                  <p className="font-jakarta font-semibold text-[14px] text-[#333333] tracking-[-0.04em]">
                    Order #{(dispute.order?.orderNumber ?? dispute.orderId).slice(-8).toUpperCase()}
                  </p>
                  <button type="button"
                    className="h-[32px] px-[14px] rounded-[6px] bg-[#2E7D32] font-jakarta text-[12px] font-semibold text-white hover:bg-[#1D5620] transition-colors">
                    Resolve
                  </button>
                </div>
                <button type="button" onClick={() => setViewDispute(dispute)}
                  className="font-jakarta text-[13px] font-semibold text-[#FDC500] underline tracking-[-0.04em]">
                  View Details
                </button>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Modals */}
      {viewOrder && <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />}
      {viewDispute && <DisputeDetailModal dispute={viewDispute} onClose={() => setViewDispute(null)} />}
      {acceptOrder && (
        <AcceptOrderModal
          order={acceptOrder}
          onClose={() => setAcceptOrder(null)}
          isLoading={acceptMutation.isPending}
          onConfirm={(date) => {
            if (isMock) { toast.success("Order accepted! (mock)"); setAcceptOrder(null); return; }
            acceptMutation.mutate({ orderId: acceptOrder.id, date });
          }}
        />
      )}
      {declineOrder && (
        <DeclineOrderModal
          onClose={() => setDeclineOrder(null)}
          isLoading={declineMutation.isPending}
          onConfirm={() => {
            if (isMock) { toast.success("Order declined. (mock)"); setDeclineOrder(null); return; }
            declineMutation.mutate(declineOrder.id);
          }}
        />
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ iconBg, iconColor, label, value, icon }: {
  iconBg: string; iconColor: string; label: string; value: string; icon: string;
}) {
  return (
    <div className="bg-white border border-[#EAEAEA] rounded-[12px] px-[14px] py-[14px] flex items-center gap-[12px]">
      <div className={`w-[44px] h-[44px] rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
        <StatIcon type={icon} className={iconColor} />
      </div>
      <div>
        <p className="font-jakarta font-medium text-[12px] text-[#9B9B9B] tracking-[-0.04em] leading-[1.3] mb-[4px] ">{label}</p>
        <p className="font-jakarta font-bold text-[12px] text-[#333333] tracking-[-0.04em] leading-[1.3]">{value}</p>
      </div>
    </div>
  );
}

function StatIcon({ type, className }: { type: string; className: string }) {
  if (type === "orders") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
  if (type === "dispute") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
  if (type === "sales") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
