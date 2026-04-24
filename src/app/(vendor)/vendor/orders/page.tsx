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
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

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
  deliveredAt?: string;
  orderItems: OrderItem[];
  user?: { firstName: string; lastName: string };
  saleType?: string;
}

type Tab = "INCOMING" | "ONGOING" | "COMPLETED" | "FAILED";

// ── Mock data ──────────────────────────────────────────────────────────────

const makeMockOrder = (id: string, status: string, extra?: Partial<Order>): Order => ({
  id,
  orderNumber: `1234567${id}`,
  status,
  totalAmount: "40000",
  deliveryAddress: "Room 5, Male Hostel",
  createdAt: new Date("2026-02-26T10:00:00Z").toISOString(),
  expectedDelivery: "2026-02-28",
  saleType: "IN_STOCK",
  orderItems: [{
    quantity: 2,
    price: "20000",
    product: { name: "Primark Shirt", imageUrls: [] },
  }],
  user: { firstName: "Ayomide", lastName: "Lawal" },
  ...extra,
});

const MOCK_ORDERS: Order[] = [
  makeMockOrder("1", "PENDING"),
  makeMockOrder("2", "PENDING"),
  makeMockOrder("3", "ACCEPTED", { expectedDelivery: "2026-02-28" }),
  makeMockOrder("4", "ACCEPTED", { expectedDelivery: "2026-02-28" }),
  makeMockOrder("5", "DELIVERED", { deliveredAt: new Date("2026-02-28T08:00:00Z").toISOString() }),
  makeMockOrder("6", "DELIVERED", { deliveredAt: new Date("2026-02-28T08:00:00Z").toISOString() }),
  makeMockOrder("7", "FAILED"),
  makeMockOrder("8", "FAILED"),
];

const STATUS_MAP: Record<Tab, string[]> = {
  INCOMING: ["PENDING"],
  ONGOING: ["ACCEPTED", "IN_PROGRESS"],
  COMPLETED: ["DELIVERED", "COMPLETED"],
  FAILED: ["FAILED", "REJECTED", "CANCELLED"],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
}

function getOrderShort(order: Order) {
  return (order.orderNumber ?? order.id).slice(-8).toUpperCase();
}

function getImg(order: Order) {
  return order.orderItems[0]?.product?.imageUrls?.[0] ?? order.orderItems[0]?.product?.images?.[0];
}

// ── Backdrop ───────────────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />;
}

// ── Accept modal (date only, max 5 days from order creation) ───────────────

function AcceptModal({ order, onClose, onConfirm, isLoading }: {
  order: Order; onClose: () => void; onConfirm: (date: string) => void; isLoading: boolean;
}) {
  const [date, setDate] = useState("");
  const minDate = new Date(order.createdAt).toISOString().split("T")[0];
  const maxDate = new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[28px] pb-[28px] w-full max-w-[360px] relative">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>
          <p className="font-jakarta font-bold text-[16px] text-[#333333] tracking-[-0.04em] mb-[4px]">Set Delivery Date</p>
          <p className="font-jakarta text-[12px] text-[#9B9B9B] tracking-[-0.04em] mb-[12px]">Must be within 5 days of order placement.</p>
          <input
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Delivery date"
            className="w-full rounded-[8px] bg-[#EAEAEA] px-[12px] py-[14px] font-jakarta text-[14px] text-[#333333] focus:outline-none mb-[20px]"
          />
          <button
            type="button"
            onClick={() => onConfirm(date)}
            disabled={isLoading || !date}
            className="w-full h-[50px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors mb-[12px]"
          >
            {isLoading ? "Accepting..." : "Accept Order"}
          </button>
          <button type="button" onClick={onClose} className="w-full font-jakarta text-[14px] text-[#9B9B9B] underline tracking-[-0.04em]">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

// ── Decline modal ──────────────────────────────────────────────────────────

function DeclineModal({ onClose, onConfirm, isLoading }: {
  onClose: () => void; onConfirm: () => void; isLoading: boolean;
}) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[28px] pb-[28px] w-full max-w-[360px] relative">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>
          <p className="font-jakarta font-bold text-[16px] text-[#333333] tracking-[-0.04em] mb-[24px] mt-[8px]">
            Are you sure you want to decline this order?
          </p>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full h-[50px] rounded-[8px] bg-[#E53935] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 hover:bg-[#C62828] transition-colors mb-[12px]"
          >
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

// ── Detail modal (Completed / Failed) ─────────────────────────────────────

function DetailModal({ order, tab, onClose }: { order: Order; tab: "COMPLETED" | "FAILED"; onClose: () => void }) {
  const img = getImg(order);
  const item = order.orderItems[0];
  const isCompleted = tab === "COMPLETED";

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[24px] pb-[28px] w-full max-w-[360px] relative">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>

          <p className="font-jakarta font-semibold text-[16px] text-[#151515] tracking-[-0.04em] mb-[16px]">
            Order #{getOrderShort(order)}
          </p>

          <div className="flex flex-col gap-[10px]">
            <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
              <span className="font-bold">Customer Name:</span>{" "}
              <span className="text-[#9B9B9B]">{order.user ? `${order.user.firstName} ${order.user.lastName}` : "—"}</span>
            </p>

            <div>
              <p className="font-jakarta text-[13px] font-bold text-[#333333] tracking-[-0.04em] mb-[8px]">Order Information:</p>
              <div className="flex items-center gap-[12px]">
                <div className="w-[56px] h-[56px] rounded-[8px] bg-[#EAEAEA] overflow-hidden shrink-0 relative">
                  {img && <Image src={img} alt={item.product.name} fill className="object-cover" sizes="56px" />}
                </div>
                <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
                  <span className="font-bold">{item.quantity}pcs</span> {item.product.name}
                </p>
              </div>
            </div>

            <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
              <span className="font-bold">Delivery Address:</span>{" "}
              <span className="text-[#9B9B9B]">{order.deliveryAddress ?? "—"}</span>
            </p>

            {isCompleted ? (
              <>
                <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
                  <span className="font-bold">Date Delivered:</span>{" "}
                  <span className="text-[#9B9B9B]">{formatDate(order.deliveredAt)}</span>
                </p>
                <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
                  <span className="font-bold">Time Delivered:</span>{" "}
                  <span className="text-[#9B9B9B]">{formatTime(order.deliveredAt)}</span>
                </p>
              </>
            ) : (
              <>
                <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
                  <span className="font-bold">Date Meant To Be Delivered:</span>{" "}
                  <span className="text-[#9B9B9B]">{formatDate(order.expectedDelivery)}</span>
                </p>
                <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
                  <span className="font-bold">Time Meant To Be Delivered:</span>{" "}
                  <span className="text-[#9B9B9B]">{order.expectedDelivery ? formatTime(order.expectedDelivery) : "—"}</span>
                </p>
              </>
            )}

            <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
              <span className="font-bold">Type:</span>{" "}
              <span className="text-[#9B9B9B]">{order.saleType === "PREORDER" ? "Preorder" : "In Stock"}</span>
            </p>
            <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
              <span className="font-bold">Total Cost:</span>{" "}
              <span className="text-[#9B9B9B]">{formatNaira(parseFloat(order.totalAmount))}</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Order cards ────────────────────────────────────────────────────────────

function IncomingCard({ order, onAccept, onDecline }: {
  order: Order; onAccept: () => void; onDecline: () => void;
}) {
  const img = getImg(order);
  const item = order.orderItems[0];
  return (
    <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px]">
      <p className="font-jakarta font-bold text-[14px] text-[#151515] tracking-[-0.04em] mb-[12px]">
        Order #{getOrderShort(order)}
      </p>
      <div className="flex flex-col gap-[8px] mb-[14px]">
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-semibold">Customer Name:</span>{" "}
          <span className="text-[#9B9B9B]">{order.user ? `${order.user.firstName} ${order.user.lastName}` : "—"}</span>
        </p>
        <div>
          <p className="font-jakarta text-[13px] font-semibold text-[#333333] tracking-[-0.04em] mb-[8px]">Order Information:</p>
          <div className="flex items-center gap-[12px]">
            <div className="w-[56px] h-[56px] rounded-[8px] bg-[#EAEAEA] overflow-hidden shrink-0 relative">
              {img && <Image src={img} alt={item.product.name} fill className="object-cover" sizes="56px" />}
            </div>
            <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
              <span className="font-bold">{item.quantity}pcs</span> {item.product.name}
            </p>
          </div>
        </div>
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-semibold">Delivery Address:</span>{" "}
          <span className="text-[#9B9B9B]">{order.deliveryAddress ?? "—"}</span>
        </p>
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-semibold">Type:</span>{" "}
          <span className="text-[#9B9B9B]">{order.saleType === "PREORDER" ? "Preorder" : "In Stock"}</span>
        </p>
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-semibold">Total Cost:</span>{" "}
          <span className="text-[#9B9B9B]">{formatNaira(parseFloat(order.totalAmount))}</span>
        </p>
      </div>
      <div className="flex gap-[10px]">
        <button type="button" onClick={onAccept}
          className="flex-1 h-[32px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[13px] font-semibold text-white hover:bg-[#1D5620] transition-colors">
          Accept
        </button>
        <button type="button" onClick={onDecline}
          className="flex-1 h-[32px] rounded-[8px] bg-[#E53935] font-jakarta text-[13px] font-semibold text-white hover:bg-[#C62828] transition-colors">
          Decline
        </button>
      </div>
    </div>
  );
}

function OngoingCard({ order, onDelivered, onFailed, isDeliveredLoading, isFailedLoading }: {
  order: Order;
  onDelivered: () => void;
  onFailed: () => void;
  isDeliveredLoading: boolean;
  isFailedLoading: boolean;
}) {
  const img = getImg(order);
  const item = order.orderItems[0];
  return (
    <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px]">
      <p className="font-jakarta font-bold text-[14px] text-[#151515] tracking-[-0.04em] mb-[12px]">
        Order #{getOrderShort(order)}
      </p>
      <div className="flex flex-col gap-[8px] mb-[14px]">
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-semibold">Customer Name:</span>{" "}
          <span className="text-[#9B9B9B]">{order.user ? `${order.user.firstName} ${order.user.lastName}` : "—"}</span>
        </p>
        <div>
          <p className="font-jakarta text-[13px] font-semibold text-[#333333] tracking-[-0.04em] mb-[8px]">Order Information:</p>
          <div className="flex items-center gap-[12px]">
            <div className="w-[56px] h-[56px] rounded-[8px] bg-[#EAEAEA] overflow-hidden shrink-0 relative">
              {img && <Image src={img} alt={item.product.name} fill className="object-cover" sizes="56px" />}
            </div>
            <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
              <span className="font-semibold">{item.quantity}pcs</span> {item.product.name}
            </p>
          </div>
        </div>
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-semibold">Delivery Address:</span>{" "}
          <span className="text-[#9B9B9B]">{order.deliveryAddress ?? "—"}</span>
        </p>
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-semibold">Expected Delivery Date:</span>{" "}
          <span className="text-[#9B9B9B]">{formatDate(order.expectedDelivery)}</span>
        </p>
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-semibold">Type:</span>{" "}
          <span className="text-[#9B9B9B]">{order.saleType === "PREORDER" ? "Preorder" : "In Stock"}</span>
        </p>
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-semibold">Total Cost:</span>{" "}
          <span className="text-[#9B9B9B]">{formatNaira(parseFloat(order.totalAmount))}</span>
        </p>
      </div>
      <div className="flex gap-[10px]">
        <button type="button" onClick={onDelivered} disabled={isDeliveredLoading}
          className="flex-1 h-[36px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[12px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors px-[6px]">
          {isDeliveredLoading ? "Updating..." : "I've delivered the item"}
        </button>
        <button type="button" onClick={onFailed} disabled={isFailedLoading}
          className="flex-1 h-[36px] rounded-[8px] bg-[#E53935] font-jakarta text-[12px] font-semibold text-white disabled:opacity-50 hover:bg-[#C62828] transition-colors px-[6px]">
          {isFailedLoading ? "Updating..." : "Unable to deliver"}
        </button>
      </div>
    </div>
  );
}

function CollapsedCard({ order, onViewDetails }: { order: Order; onViewDetails: () => void }) {
  return (
    <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px]">
      <p className="font-jakarta font-bold text-[14px] text-[#151515] tracking-[-0.04em] mb-[6px]">
        Order #{getOrderShort(order)}
      </p>
      <button type="button" onClick={onViewDetails}
        className="font-jakarta text-[13px] font-semibold text-[#FDC500] underline tracking-[-0.04em]">
        View Details
      </button>
    </div>
  );
}

// ── Tab config ─────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; activeClass: string }[] = [
  { key: "INCOMING", label: "Incoming", activeClass: "bg-[#D8FFDA] text-[#2E7D32]" },
  { key: "ONGOING", label: "Ongoing", activeClass: "bg-[#FDC500] text-white" },
  { key: "COMPLETED", label: "Completed", activeClass: "bg-[#2E7D32] text-white" },
  { key: "FAILED", label: "Failed", activeClass: "bg-[#E53935] text-white" },
];

// ── Main page ──────────────────────────────────────────────────────────────

export default function VendorOrdersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isMock = user?.id === "mock-vendor-001";

  const [activeTab, setActiveTab] = useState<Tab>("INCOMING");
  const [acceptingOrder, setAcceptingOrder] = useState<Order | null>(null);
  const [decliningOrder, setDecliningOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<{ order: Order; tab: "COMPLETED" | "FAILED" } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["vendor-orders"],
    queryFn: async () => {
      const { data } = await apiClient.get("/orders/vendor-orders");
      return data?.data ?? data ?? [];
    },
    enabled: !isMock,
  });

  const allOrders = isMock ? MOCK_ORDERS : (orders ?? []);
  const tabOrders = allOrders.filter((o) => STATUS_MAP[activeTab].includes(o.status));

  // ── Mutations ──────────────────────────────────────────────────────────

  const acceptMutation = useMutation({
    mutationFn: async ({ orderId, date }: { orderId: string; date: string }) => {
      await apiClient.post(`/orders/${orderId}/accept`, { expectedDelivery: date });
    },
    onSuccess: () => {
      toast.success("Order accepted!");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      setAcceptingOrder(null);
    },
    onError: () => toast.error("Failed to accept order."),
  });

  const declineMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await apiClient.post(`/orders/${orderId}/reject`, { reason: "Vendor declined" });
    },
    onSuccess: () => {
      toast.success("Order declined.");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      setDecliningOrder(null);
    },
    onError: () => toast.error("Failed to decline order."),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await apiClient.patch(`/orders/${orderId}/status`, { status });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === "DELIVERED" ? "Order marked as delivered!" : "Order marked as failed.");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      setActionLoadingId(null);
    },
    onError: () => { toast.error("Something went wrong."); setActionLoadingId(null); },
  });

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      {/* Mobile header */}
      <div className="md:hidden bg-[#2E7D32] rounded-b-[12px] h-[90px] flex items-center justify-between px-[20px]">
        <Image src="/images/logo.svg" alt="Shopa" width={80} height={30} priority />
        <div className="flex items-center gap-[10px]">
          <Link href="/vendor/notifications" aria-label="Notifications">
            <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center">
              <Bell size={18} className="text-white" />
            </div>
          </Link>
          <Link href="/vendor/settings" aria-label="Settings">
            <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center">
              <Settings size={18} className="text-white" />
            </div>
          </Link>
        </div>
      </div>
      {/* Desktop top bar */}
      <div className="hidden md:flex items-center justify-between px-[32px] py-[20px] border-b border-[#EAEAEA] bg-white">
        <h1 className="font-satoshi font-bold text-[20px] text-[#151515]">Orders</h1>
        <div className="flex items-center gap-[10px]">
          <Link href="/vendor/notifications" aria-label="Notifications" className="w-[36px] h-[36px] rounded-full bg-[#F7FFF8] border border-[#EAEAEA] flex items-center justify-center hover:bg-[#D8FFDA] transition-colors">
            <Bell size={18} className="text-[#2E7D32]" />
          </Link>
          <Link href="/vendor/settings" aria-label="Settings" className="w-[36px] h-[36px] rounded-full bg-[#F7FFF8] border border-[#EAEAEA] flex items-center justify-center hover:bg-[#D8FFDA] transition-colors">
            <Settings size={18} className="text-[#2E7D32]" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-[8px] px-[20px] md:px-[32px] pt-[20px] pb-[4px] overflow-x-auto">
        {TABS.map(({ key, label, activeClass }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex-shrink-0 px-[16px] h-[36px] rounded-[8px] font-jakarta text-[13px] font-semibold tracking-[-0.04em] transition-colors",
              activeTab === key ? activeClass : "bg-[#EAEAEA] text-[#545454]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="px-[20px] md:px-[32px] lg:px-[40px] pt-[16px] pb-[24px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px] items-start">
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px] h-[180px] animate-pulse" />
          ))
        ) : tabOrders.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">
              No {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} orders.
            </p>
          </div>
        ) : activeTab === "INCOMING" ? (
          tabOrders.map((order) => (
            <IncomingCard
              key={order.id}
              order={order}
              onAccept={() => setAcceptingOrder(order)}
              onDecline={() => setDecliningOrder(order)}
            />
          ))
        ) : activeTab === "ONGOING" ? (
          tabOrders.map((order) => (
            <OngoingCard
              key={order.id}
              order={order}
              isDeliveredLoading={actionLoadingId === `${order.id}-delivered`}
              isFailedLoading={actionLoadingId === `${order.id}-failed`}
              onDelivered={() => {
                if (isMock) { toast.success("Marked as delivered! (mock)"); return; }
                setActionLoadingId(`${order.id}-delivered`);
                statusMutation.mutate({ orderId: order.id, status: "DELIVERED" });
              }}
              onFailed={() => {
                if (isMock) { toast.success("Marked as failed. (mock)"); return; }
                setActionLoadingId(`${order.id}-failed`);
                statusMutation.mutate({ orderId: order.id, status: "FAILED" });
              }}
            />
          ))
        ) : (
          tabOrders.map((order) => (
            <CollapsedCard
              key={order.id}
              order={order}
              onViewDetails={() => setViewingOrder({ order, tab: activeTab as "COMPLETED" | "FAILED" })}
            />
          ))
        )}
      </div>

      {/* Accept modal */}
      {acceptingOrder && (
        <AcceptModal
          order={acceptingOrder}
          onClose={() => setAcceptingOrder(null)}
          isLoading={acceptMutation.isPending}
          onConfirm={(date) => {
            if (isMock) { toast.success("Order accepted! (mock)"); setAcceptingOrder(null); return; }
            acceptMutation.mutate({ orderId: acceptingOrder.id, date });
          }}
        />
      )}

      {/* Decline modal */}
      {decliningOrder && (
        <DeclineModal
          onClose={() => setDecliningOrder(null)}
          isLoading={declineMutation.isPending}
          onConfirm={() => {
            if (isMock) { toast.success("Order declined. (mock)"); setDecliningOrder(null); return; }
            declineMutation.mutate(decliningOrder.id);
          }}
        />
      )}

      {/* Detail modal */}
      {viewingOrder && (
        <DetailModal
          order={viewingOrder.order}
          tab={viewingOrder.tab}
          onClose={() => setViewingOrder(null)}
        />
      )}
    </div>
  );
}
