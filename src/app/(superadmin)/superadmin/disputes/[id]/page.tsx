"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, AlertTriangle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DisputeDetail {
  id: string;
  status: string;
  reason: string;
  description?: string;
  proofUrls?: string[];
  accountDetails?: string; // customer's bank account for refund, e.g. "0123456789, UBA, Sade Bello"
  // Vendor response
  vendorResponse?: string;
  vendorResponseAt?: string;
  counterProofUrls?: string[];
  // University admin resolution
  adminResolution?: string;
  adminResolvedAt?: string;
  refundRequested?: boolean;
  // Timestamps
  createdAt: string;
  vendorDeadlineAt?: string;
  adminDeadlineAt?: string;
  // Order
  order?: {
    id?: string;
    orderNumber?: string;
    totalAmount?: string;
    deliveryAddress?: string;
    saleType?: string;
    createdAt?: string;
    orderItems?: { quantity: number; price: string; product: { name: string; imageUrls?: string[] } }[];
    user?: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      matricNumber?: string;
    };
    vendor?: {
      storeName: string;
      user?: { firstName: string; lastName: string; email?: string; phone?: string };
      campus?: { name: string };
      bankAccount?: { accountNumber: string; bankName: string; accountName: string };
    };
    payment?: {
      status: string;
      reference?: string;
      amount?: number;
      method?: string;
    };
  };
}

// ── Mock ──────────────────────────────────────────────────────────────────────

const MOCK_DISPUTE: DisputeDetail = {
  id: "d1",
  status: "VENDOR_RESPONDED",
  reason: "Item not delivered",
  description: "I paid for 2 packs of Indomie on the 26th of February and waited 3 days. The vendor stopped responding to my messages after day 2. I have a screenshot of our conversation where he confirmed dispatch but the item never arrived. I'd like a full refund.",
  proofUrls: [
    "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=400&q=80",
    "https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=400&q=80",
  ],
  accountDetails: "0123456789, UBA, Sade Bello",
  vendorResponse: "I dispatched the item on the 28th via a delivery agent. The delivery agent confirmed it was dropped at the hostel gate but the customer claims it wasn't received. I have attached my dispatch record.",
  vendorResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  counterProofUrls: [
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80",
  ],
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 34).toISOString(),
  vendorDeadlineAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  adminDeadlineAt: new Date(Date.now() + 1000 * 60 * 60 * 38).toISOString(),
  order: {
    id: "o1",
    orderNumber: "12345678",
    totalAmount: "7000",
    deliveryAddress: "Room 5, Male Hostel, Crawford University",
    saleType: "IN_STOCK",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    orderItems: [
      { quantity: 2, price: "3500", product: { name: "Indomie Pack (12)", imageUrls: [] } },
    ],
    user: {
      firstName: "Sade",
      lastName: "Bello",
      email: "sade@crawford.edu",
      phone: "08011111111",
      matricNumber: "CSC/2022/045",
    },
    vendor: {
      storeName: "Fresh Provisions",
      user: { firstName: "Tolu", lastName: "Adeyemi", email: "tolu@crawford.edu", phone: "08012345678" },
      campus: { name: "Crawford University" },
      bankAccount: { accountNumber: "0123456789", bankName: "Access Bank", accountName: "Tolu Adeyemi" },
    },
    payment: {
      status: "SUCCESSFUL",
      reference: "PSK_REF_001ABC",
      amount: 7000,
      method: "Card",
    },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function Section({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: "red" | "green" | "blue" | "yellow" }) {
  const border = highlight === "red" ? "border-[#E53935]" : highlight === "green" ? "border-[#2E7D32]" : highlight === "blue" ? "border-[#1565C0]" : highlight === "yellow" ? "border-[#FF9800]" : "border-[#EAEAEA]";
  const bg = highlight === "red" ? "bg-[#FFEBEE]" : highlight === "green" ? "bg-[#D8FFDA]" : highlight === "blue" ? "bg-[#E3F2FD]" : highlight === "yellow" ? "bg-[#FFF3E0]" : "bg-white";
  const dot = highlight === "red" ? "bg-[#E53935]" : highlight === "green" ? "bg-[#2E7D32]" : highlight === "blue" ? "bg-[#1565C0]" : highlight === "yellow" ? "bg-[#FF9800]" : "bg-[#9B9B9B]";

  return (
    <div className={cn("rounded-[12px] border p-[20px]", border, bg)}>
      <div className="flex items-center gap-[8px] mb-[14px]">
        <div className={cn("w-[8px] h-[8px] rounded-full shrink-0", dot)} />
        <p className="font-satoshi font-bold text-[14px] text-[#151515]">{title}</p>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-[8px] py-[7px] border-b border-black/5 last:border-0">
      <span className="font-jakarta text-[12px] text-[#9B9B9B] w-[160px] shrink-0">{label}</span>
      <span className={cn("font-jakarta text-[13px] font-semibold text-[#333333]", mono && "font-mono text-[12px]")}>{value}</span>
    </div>
  );
}

function ProofImages({ urls, label }: { urls: string[]; label: string }) {
  if (!urls || urls.length === 0) return (
    <p className="font-jakarta text-[12px] text-[#9B9B9B] italic">No {label} uploaded.</p>
  );
  return (
    <div className="flex gap-[8px] flex-wrap mt-[8px]">
      {urls.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" title={`View ${label} ${i + 1}`}
          className="relative w-[90px] h-[90px] rounded-[8px] overflow-hidden border border-[#EAEAEA] hover:opacity-80 transition-opacity cursor-zoom-in block shrink-0">
          <Image src={url} alt={`${label} ${i + 1}`} fill className="object-cover" sizes="90px" />
        </a>
      ))}
    </div>
  );
}

// ── Resolve / refund modal ────────────────────────────────────────────────────

type ModalMode = "refund" | "resolve";

function ActionModal({ mode, orderTotal, onClose, onConfirm, isLoading }: {
  mode: ModalMode;
  orderTotal: number;
  onClose: () => void;
  onConfirm: (note: string) => void;
  isLoading: boolean;
}) {
  const [note, setNote] = useState("");
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[24px] pb-[28px] w-full max-w-[480px]">
          <p className="font-satoshi font-bold text-[16px] text-[#151515] mb-[4px]">
            {mode === "refund" ? "Issue Refund to Customer" : "Resolve Dispute"}
          </p>
          <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[16px]">
            {mode === "refund"
              ? `A full refund of ${formatNaira(orderTotal)} will be processed to the customer. Both parties will be notified by email.`
              : "Your resolution will be emailed to both the customer and the vendor."}
          </p>
          <label className="font-jakarta text-[13px] font-bold text-[#151515] block mb-[8px]">
            {mode === "refund" ? "Refund Note" : "Resolution Note"} <span className="text-[#E53935]">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={mode === "refund" ? "Explain why the refund is being issued..." : "Describe your resolution clearly..."}
            rows={4}
            title={mode === "refund" ? "Refund note" : "Resolution note"}
            className="w-full rounded-[8px] border border-[#EAEAEA] bg-[#F7FFF8] px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32] resize-none mb-[20px]"
          />
          <div className="flex gap-[10px]">
            <button type="button" onClick={onClose}
              className="flex-1 h-[44px] rounded-[8px] border border-[#EAEAEA] font-jakarta text-[13px] font-semibold text-[#545454] hover:bg-[#F7FFF8] transition-colors">
              Cancel
            </button>
            <button type="button" onClick={() => note.trim() && onConfirm(note.trim())}
              disabled={!note.trim() || isLoading}
              className={cn("flex-1 h-[44px] rounded-[8px] font-jakarta text-[13px] font-semibold text-white disabled:opacity-50 transition-colors",
                mode === "refund" ? "bg-[#E53935] hover:bg-[#C62828]" : "bg-[#2E7D32] hover:bg-[#1D5620]"
              )}>
              {isLoading ? "Processing..." : mode === "refund" ? "Issue Refund" : "Submit Resolution"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuperAdminDisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isMock = user?.id === "mock-superadmin-001";

  const [modal, setModal] = useState<ModalMode | null>(null);

  const { data: dispute } = useQuery<DisputeDetail>({
    queryKey: ["superadmin-dispute", id],
    queryFn: async () => { const { data } = await apiClient.get(`/disputes/${id}`); return data?.data ?? data; },
    enabled: !isMock,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ mode, note }: { mode: ModalMode; note: string }) => {
      if (isMock) { toast.success(mode === "refund" ? "Refund issued. (mock)" : "Resolved. (mock)"); setModal(null); return; }
      const outcome = mode === "refund" ? "REFUND_ISSUED" : "RESOLVED";
      await apiClient.patch(`/disputes/${id}/resolve`, { resolution: note, outcome });
    },
    onSuccess: () => {
      toast.success(modal === "refund" ? "Refund issued. Both parties notified by email." : "Dispute resolved. Both parties notified by email.");
      queryClient.invalidateQueries({ queryKey: ["superadmin-dispute", id] });
      setModal(null);
    },
    onError: () => toast.error("Action failed."),
  });

  const d = dispute ?? MOCK_DISPUTE;
  const orderTotal = parseFloat(d.order?.totalAmount ?? "0");
  const shortId = (d.order?.orderNumber ?? id).slice(-8).toUpperCase();

  const REFUND_STATUSES = ["VENDOR_TIMEOUT"];
  const RESOLVE_STATUSES = ["ADMIN_TIMEOUT", "ESCALATED", "VENDOR_RESPONDED", "UNDER_REVIEW"];
  const canRefund = REFUND_STATUSES.includes(d.status);
  const canResolve = RESOLVE_STATUSES.includes(d.status);

  return (
    <SuperAdminLayout>
      <button type="button" onClick={() => router.back()}
        className="flex items-center gap-[6px] text-[#2E7D32] mb-[20px] hover:opacity-70 transition-opacity">
        <ChevronLeft size={18} />
        <span className="font-jakarta text-[13px] font-semibold">Back to Disputes</span>
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-[20px] gap-[12px] flex-wrap">
        <div>
          <h1 className="font-satoshi font-bold text[22px] text-[#151515]">
            Dispute — Order #{shortId}
          </h1>
          <p className="font-jakarta text-[12px] text-[#9B9B9B] mt-[2px]">
            Raised {fmtDate(d.createdAt)} · {d.order?.vendor?.campus?.name ?? "—"}
          </p>
        </div>
        <StatusBadge status={d.status} />
      </div>

      {/* Status banner */}
      {(d.status === "VENDOR_TIMEOUT" || d.status === "ADMIN_TIMEOUT") && (
        <div className={cn("rounded-[10px] p-[14px] mb-[20px] flex items-start gap-[10px]",
          d.status === "VENDOR_TIMEOUT" ? "bg-[#FFEBEE] border border-[#E53935]/40" : "bg-[#F3E5F5] border border-[#7B1FA2]/30"
        )}>
          <AlertTriangle size={16} className={d.status === "VENDOR_TIMEOUT" ? "text-[#E53935]" : "text-[#7B1FA2]"} />
          <div>
            <p className={cn("font-jakarta font-bold text-[13px]", d.status === "VENDOR_TIMEOUT" ? "text-[#E53935]" : "text-[#7B1FA2]")}>
              {d.status === "VENDOR_TIMEOUT" ? "Vendor did not respond — refund required" : "Campus admin timed out — your resolution required"}
            </p>
            <p className={cn("font-jakarta text-[12px] mt-[2px] leading-[1.5]", d.status === "VENDOR_TIMEOUT" ? "text-[#E53935]/80" : "text-[#7B1FA2]/80")}>
              {d.status === "VENDOR_TIMEOUT"
                ? "The vendor did not respond within 48 hours. Issue a full refund to the customer directly. Campus admin is not involved in this path."
                : "The campus admin did not resolve within 48 hours. You must resolve this dispute directly."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[20px]">

        {/* ── Left col: all content ── */}
        <div className="xl:col-span-2 flex flex-col gap-[16px]">

          {/* 1. Customer complaint */}
          <Section title="Customer Complaint" highlight="red">
            <p className="font-jakarta font-bold text-[13px] text-[#E53935] mb-[6px]">{d.reason}</p>
            {d.description && (
              <p className="font-jakarta text-[13px] text-[#545454] leading-[1.7] mb-[12px] whitespace-pre-wrap">{d.description}</p>
            )}
            <p className="font-jakarta text-[12px] font-bold text-[#9B9B9B] mb-[4px]">Proof uploaded by customer:</p>
            <ProofImages urls={d.proofUrls ?? []} label="customer proof" />
            <p className="font-jakarta text-[11px] text-[#9B9B9B] mt-[10px]">Raised: {fmtDate(d.createdAt)}</p>
          </Section>

          {/* 2. Customer / account details */}
          <Section title="Customer Details" highlight="blue">
            <Row label="Full Name" value={d.order?.user ? `${d.order.user.firstName} ${d.order.user.lastName}` : "—"} />
            <Row label="Email" value={d.order?.user?.email ?? "—"} />
            <Row label="Phone" value={d.order?.user?.phone ?? "—"} />
            <Row label="Matric Number" value={d.order?.user?.matricNumber ?? "—"} />
          </Section>

          {/* 3. Customer refund account */}
          <Section title="Customer Refund Account" highlight="blue">
            {d.accountDetails ? (
              <>
                <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[10px]">
                  Account details provided by the customer at time of raising the dispute:
                </p>
                <div className="bg-white rounded-[8px] border border-[#1565C0]/20 px-[16px] py-[12px]">
                  <p className="font-jakarta font-bold text-[14px] text-[#151515] tracking-[-0.04em]">{d.accountDetails}</p>
                </div>
                <p className="font-jakarta text-[11px] text-[#9B9B9B] mt-[8px] leading-[1.5]">
                  Use these details to process a refund if applicable.
                  Always verify account details with the customer before processing.
                </p>
              </>
            ) : (
              <p className="font-jakarta text-[13px] text-[#9B9B9B]">
                No refund account details provided by the customer.
              </p>
            )}
          </Section>

          {/* 4. Order details */}
          <Section title="Order Details">
            <Row label="Order Number" value={`#${shortId}`} />
            <Row label="Order Date" value={fmtDate(d.order?.createdAt)} />
            <Row label="Delivery Address" value={d.order?.deliveryAddress ?? "—"} />
            <Row label="Sale Type" value={d.order?.saleType === "PREORDER" ? "Preorder" : "In Stock"} />
            {d.order?.orderItems?.map((item, i) => (
              <Row key={i} label={`Item ${i + 1}`} value={`${item.quantity}× ${item.product.name} — ${formatNaira(parseFloat(item.price))}`} />
            ))}
            <Row label="Order Total" value={formatNaira(orderTotal)} />
          </Section>

          {/* 4. Payment info */}
          {d.order?.payment && (
            <Section title="Payment Information">
              <Row label="Payment Status" value={d.order.payment.status} />
              <Row label="Reference" value={d.order.payment.reference ?? "—"} mono />
              <Row label="Amount Paid" value={d.order.payment.amount ? formatNaira(d.order.payment.amount) : "—"} />
              <Row label="Payment Method" value={d.order.payment.method ?? "—"} />
            </Section>
          )}

          {/* 5. Vendor response */}
          {d.status === "VENDOR_TIMEOUT" ? (
            <Section title="Vendor Response" highlight="red">
              <div className="flex items-center gap-[8px]">
                <Clock size={14} className="text-[#E53935]" />
                <p className="font-jakarta text-[13px] text-[#E53935] font-semibold">Vendor did not respond within 48 hours.</p>
              </div>
            </Section>
          ) : d.vendorResponse ? (
            <Section title="Vendor Response" highlight="green">
              <p className="font-jakarta text-[13px] text-[#1D5620] leading-[1.7] mb-[12px] whitespace-pre-wrap">{d.vendorResponse}</p>
              <p className="font-jakarta text-[12px] font-bold text-[#9B9B9B] mb-[4px]">Counter-proof uploaded by vendor:</p>
              <ProofImages urls={d.counterProofUrls ?? []} label="vendor counter-proof" />
              <p className="font-jakarta text-[11px] text-[#9B9B9B] mt-[10px]">Responded: {fmtDate(d.vendorResponseAt)}</p>
            </Section>
          ) : (
            <Section title="Vendor Response">
              <p className="font-jakarta text-[13px] text-[#9B9B9B]">Awaiting vendor response.</p>
            </Section>
          )}

          {/* 6. University admin resolution (if exists) */}
          {d.adminResolution && (
            <Section title="Campus Admin Resolution" highlight="yellow">
              <p className="font-jakarta text-[13px] text-[#545454] leading-[1.7] mb-[8px] whitespace-pre-wrap">{d.adminResolution}</p>
              {d.refundRequested !== undefined && (
                <div className={cn("inline-flex items-center gap-[6px] px-[10px] py-[4px] rounded-full font-jakarta text-[11px] font-bold",
                  d.refundRequested ? "bg-[#FFEBEE] text-[#E53935]" : "bg-[#D8FFDA] text-[#2E7D32]"
                )}>
                  {d.refundRequested ? "🔁 Refund request raised to super admin" : "✓ Campus admin ruled: no refund required"}
                </div>
              )}
              <p className="font-jakarta text-[11px] text-[#9B9B9B] mt-[10px]">Resolved: {fmtDate(d.adminResolvedAt)}</p>
            </Section>
          )}
        </div>

        {/* ── Right col: vendor info + actions ── */}
        <div className="flex flex-col gap-[16px]">

          {/* Vendor details */}
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
            <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[12px]">Vendor Details</p>
            <Row label="Store Name" value={d.order?.vendor?.storeName ?? "—"} />
            <Row label="Owner" value={d.order?.vendor?.user ? `${d.order.vendor.user.firstName} ${d.order.vendor.user.lastName}` : "—"} />
            <Row label="Email" value={d.order?.vendor?.user?.email ?? "—"} />
            <Row label="Phone" value={d.order?.vendor?.user?.phone ?? "—"} />
            <Row label="Campus" value={d.order?.vendor?.campus?.name ?? "—"} />
          </div>

          {/* Vendor bank account */}
          {d.order?.vendor?.bankAccount && (
            <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
              <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[12px]">Vendor Bank Account</p>
              <Row label="Bank" value={d.order.vendor.bankAccount.bankName} />
              <Row label="Account No." value={d.order.vendor.bankAccount.accountNumber} mono />
              <Row label="Account Name" value={d.order.vendor.bankAccount.accountName} />
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
            <p className="font-satoshi font-bold text-[13px] text-[#151515] mb-[14px]">Timeline</p>
            <div className="flex flex-col gap-[10px]">
              {[
                { label: "Dispute raised by customer", time: d.createdAt, done: true },
                { label: "Vendor 48h deadline", time: d.vendorDeadlineAt, done: !!d.vendorResponseAt || d.status === "VENDOR_TIMEOUT" },
                { label: "Vendor responded", time: d.vendorResponseAt, done: !!d.vendorResponseAt },
                { label: "Admin 48h deadline", time: d.adminDeadlineAt, done: !!d.adminResolution || d.status === "ADMIN_TIMEOUT" },
                { label: "Admin resolved", time: d.adminResolvedAt, done: !!d.adminResolution },
              ].filter((s) => s.time).map((step, i) => (
                <div key={i} className="flex items-start gap-[10px]">
                  <div className={cn("w-[8px] h-[8px] rounded-full mt-[4px] shrink-0", step.done ? "bg-[#2E7D32]" : "bg-[#EAEAEA] border border-[#C2C2C2]")} />
                  <div>
                    <p className="font-jakarta text-[12px] font-semibold text-[#333333]">{step.label}</p>
                    <p className="font-jakarta text-[11px] text-[#9B9B9B]">{fmtDate(step.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
            <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[12px]">Super Admin Actions</p>
            {canRefund && (
              <button type="button" onClick={() => setModal("refund")}
                className="w-full h-[44px] rounded-[8px] bg-[#E53935] font-jakarta text-[13px] font-semibold text-white hover:bg-[#C62828] transition-colors mb-[10px]">
                Issue Refund to Customer
              </button>
            )}
            {canResolve && (
              <button type="button" onClick={() => setModal("resolve")}
                className="w-full h-[44px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[13px] font-semibold text-white hover:bg-[#1D5620] transition-colors">
                Resolve Dispute
              </button>
            )}
            {!canRefund && !canResolve && (
              <p className="font-jakarta text-[13px] text-[#9B9B9B] leading-[1.6]">
                This dispute has been {d.status.toLowerCase().replace(/_/g, " ")}. No further action required.
              </p>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <ActionModal
          mode={modal}
          orderTotal={orderTotal}
          onClose={() => setModal(null)}
          isLoading={actionMutation.isPending}
          onConfirm={(note) => actionMutation.mutate({ mode: modal, note })}
        />
      )}
    </SuperAdminLayout>
  );
}
