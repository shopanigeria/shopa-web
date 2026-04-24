"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Clock, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface DisputeDetail {
  id: string;
  status: string;
  reason: string;
  description?: string;
  proofUrls?: string[];
  vendorResponse?: string;
  vendorResponseAt?: string;
  counterProofUrls?: string[];
  adminResolution?: string;
  refundRequested?: boolean;
  createdAt: string;
  vendorDeadlineAt?: string;   // 48h after createdAt
  adminDeadlineAt?: string;    // 48h after vendorResponseAt
  order?: {
    orderNumber?: string;
    totalAmount?: string;
    orderItems?: { quantity: number; product: { name: string } }[];
    user?: { firstName: string; lastName: string; email?: string };
    vendor?: { storeName: string; user?: { firstName: string; lastName: string } };
  };
}

// ── Dispute flow states visible to university admin ───────────────────────────
// OPEN             → vendor hasn't responded yet (admin can see but can't act)
// VENDOR_TIMEOUT   → vendor missed 48h window (admin cannot act — goes to super admin)
// VENDOR_RESPONDED → vendor responded within 48h (admin must resolve within 48h)
// ADMIN_TIMEOUT    → admin missed their 48h window (super admin handles)
// UNDER_REVIEW     → admin is actively reviewing
// RESOLVED         → admin resolved (with or without refund)
// ESCALATED        → super admin took over
// CLOSED           → fully done

const ADMIN_ACTIONABLE = ["VENDOR_RESPONDED", "UNDER_REVIEW"];

// ── Mock data (with vendor response for testing the resolution flow) ──────────

const MOCK_DISPUTE: DisputeDetail = {
  id: "d1",
  status: "VENDOR_RESPONDED",
  reason: "Item not delivered",
  description: "I placed an order 3 days ago and it has not been delivered. The vendor stopped responding to my messages.",
  proofUrls: [],
  vendorResponse: "I'm sorry about the delay. There was a logistics issue on my end. The item was dispatched on the 28th but the delivery agent had issues locating the hostel. I have proof of dispatch below.",
  vendorResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  counterProofUrls: [],
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  vendorDeadlineAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  adminDeadlineAt: new Date(Date.now() + 1000 * 60 * 60 * 42).toISOString(), // 42h remaining
  order: {
    orderNumber: "12345678",
    totalAmount: "5000",
    orderItems: [{ quantity: 2, product: { name: "Indomie Pack (12)" } }],
    user: { firstName: "Sade", lastName: "Bello", email: "sade@crawford.edu" },
    vendor: { storeName: "Fresh Provisions", user: { firstName: "Tolu", lastName: "Adeyemi" } },
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function hoursRemaining(deadlineIso?: string): number | null {
  if (!deadlineIso) return null;
  const diff = new Date(deadlineIso).getTime() - Date.now();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60)));
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-[8px] py-[8px] border-b border-[#F0F0F0] last:border-0">
      <span className="font-jakarta text-[12px] text-[#9B9B9B] w-[120px] shrink-0">{label}</span>
      <span className="font-jakarta text-[13px] font-semibold text-[#333333]">{value}</span>
    </div>
  );
}

// ── Resolve modal ─────────────────────────────────────────────────────────────

function ResolveModal({ onClose, onConfirm, isLoading }: {
  onClose: () => void;
  onConfirm: (resolution: string, refund: boolean) => void;
  isLoading: boolean;
}) {
  const [resolution, setResolution] = useState("");
  const [refund, setRefund] = useState<boolean | null>(null);

  const canSubmit = resolution.trim().length > 0 && refund !== null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[24px] pb-[28px] w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
          <p className="font-satoshi font-bold text-[16px] text-[#151515] mb-[4px]">Resolve Dispute</p>
          <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[20px]">
            Your resolution and the outcome will be emailed to both the customer and vendor.
          </p>

          {/* Resolution description */}
          <div className="mb-[20px]">
            <label className="font-jakarta text-[13px] font-bold text-[#151515] block mb-[8px]">
              Resolution Description <span className="text-[#E53935]">*</span>
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe your resolution clearly. This will be sent to both parties via email..."
              rows={5}
              title="Resolution description"
              className="w-full rounded-[8px] border border-[#EAEAEA] bg-[#F7FFF8] px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32] resize-none"
            />
          </div>

          {/* Refund decision */}
          <div className="mb-[24px]">
            <label className="font-jakarta text-[13px] font-bold text-[#151515] block mb-[12px]">
              Refund Decision <span className="text-[#E53935]">*</span>
            </label>
            <div className="flex flex-col gap-[10px]">
              <button
                type="button"
                onClick={() => setRefund(true)}
                className={cn(
                  "flex items-start gap-[12px] p-[14px] rounded-[10px] border-2 text-left transition-colors",
                  refund === true ? "border-[#E53935] bg-[#FFEBEE]" : "border-[#EAEAEA] hover:border-[#E53935]/40"
                )}
              >
                <div className={cn("w-[18px] h-[18px] rounded-full border-2 mt-[1px] shrink-0 flex items-center justify-center",
                  refund === true ? "border-[#E53935] bg-[#E53935]" : "border-[#9B9B9B]")}>
                  {refund === true && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
                </div>
                <div>
                  <p className="font-jakarta font-bold text-[13px] text-[#E53935]">Raise Refund Request</p>
                  <p className="font-jakarta text-[12px] text-[#9B9B9B] mt-[2px]">
                    A refund request will be sent to the super admin for processing.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRefund(false)}
                className={cn(
                  "flex items-start gap-[12px] p-[14px] rounded-[10px] border-2 text-left transition-colors",
                  refund === false ? "border-[#2E7D32] bg-[#D8FFDA]" : "border-[#EAEAEA] hover:border-[#2E7D32]/40"
                )}
              >
                <div className={cn("w-[18px] h-[18px] rounded-full border-2 mt-[1px] shrink-0 flex items-center justify-center",
                  refund === false ? "border-[#2E7D32] bg-[#2E7D32]" : "border-[#9B9B9B]")}>
                  {refund === false && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
                </div>
                <div>
                  <p className="font-jakarta font-bold text-[13px] text-[#2E7D32]">No Refund Required</p>
                  <p className="font-jakarta text-[12px] text-[#9B9B9B] mt-[2px]">
                    The dispute is resolved without a refund. Both parties will be notified via email.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-[10px]">
            <button type="button" onClick={onClose}
              className="flex-1 h-[44px] rounded-[8px] border border-[#EAEAEA] font-jakarta text-[13px] font-semibold text-[#545454] hover:bg-[#F7FFF8] transition-colors">
              Cancel
            </button>
            <button type="button"
              onClick={() => canSubmit && onConfirm(resolution.trim(), refund!)}
              disabled={!canSubmit || isLoading}
              className="flex-1 h-[44px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[13px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors">
              {isLoading ? "Submitting..." : "Submit Resolution"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isMock = user?.id === "mock-admin-001";

  const [showResolveModal, setShowResolveModal] = useState(false);

  const { data: dispute } = useQuery<DisputeDetail>({
    queryKey: ["admin-dispute", id],
    queryFn: async () => { const { data } = await apiClient.get(`/disputes/${id}`); return data?.data ?? data; },
    enabled: !isMock,
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ resolution, refund }: { resolution: string; refund: boolean }) => {
      if (isMock) { toast.success("Resolution submitted. (mock)"); setShowResolveModal(false); return; }
      await apiClient.patch(`/disputes/${id}/resolve`, {
        resolution,
        outcome: refund ? "REFUND_REQUESTED" : "NO_REFUND",
      });
    },
    onSuccess: () => {
      toast.success("Dispute resolved. Both parties will be notified by email.");
      queryClient.invalidateQueries({ queryKey: ["admin-dispute", id] });
      setShowResolveModal(false);
    },
    onError: () => toast.error("Failed to submit resolution."),
  });

  const d = dispute ?? MOCK_DISPUTE;
  const adminHoursLeft = hoursRemaining(d.adminDeadlineAt);
  const canAct = ADMIN_ACTIONABLE.includes(d.status);

  // Status display label mapping
  const statusLabel: Record<string, { label: string; info: string }> = {
    OPEN: { label: "Awaiting Vendor Response", info: "The vendor has 48 hours to respond before this is escalated to super admin." },
    VENDOR_TIMEOUT: { label: "Vendor Did Not Respond", info: "The vendor did not respond within 48 hours. This has been escalated directly to the super admin for a refund decision." },
    VENDOR_RESPONDED: { label: "Vendor Responded — Awaiting Your Resolution", info: "The vendor has submitted their response. You have 48 hours to review and resolve this dispute." },
    UNDER_REVIEW: { label: "Under Review", info: "You are currently reviewing this dispute." },
    ADMIN_TIMEOUT: { label: "Resolution Overdue", info: "You did not resolve this within 48 hours. The super admin has been notified and may take over." },
    RESOLVED: { label: "Resolved", info: "This dispute has been resolved." },
    ESCALATED: { label: "Escalated to Super Admin", info: "The super admin is handling this dispute." },
    CLOSED: { label: "Closed", info: "This dispute has been closed." },
  };

  const statusInfo = statusLabel[d.status] ?? { label: d.status, info: "" };

  return (
    <AdminLayout campusName="Crawford University">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-[6px] text-[#2E7D32] mb-[20px] hover:opacity-70 transition-opacity">
        <ChevronLeft size={18} /> <span className="font-jakarta text-[13px] font-semibold">Back to Disputes</span>
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-[20px] gap-[12px] flex-wrap">
        <div>
          <h1 className="font-satoshi font-bold text-[20px] text-[#151515]">
            Dispute — Order #{(d.order?.orderNumber ?? id).slice(-8).toUpperCase()}
          </h1>
          <p className="font-jakarta text-[12px] text-[#9B9B9B] mt-[2px]">
            Raised {fmtDate(d.createdAt)}
          </p>
        </div>
        <StatusBadge status={d.status} />
      </div>

      {/* Status info banner */}
      <div className={cn("rounded-[10px] p-[14px] mb-[20px] flex items-start gap-[10px]",
        d.status === "VENDOR_RESPONDED" || d.status === "UNDER_REVIEW" ? "bg-[#FFF3E0] border border-[#FFB300]" :
        d.status === "VENDOR_TIMEOUT" || d.status === "ADMIN_TIMEOUT" ? "bg-[#FFEBEE] border border-[#E53935]" :
        "bg-[#F7FFF8] border border-[#EAEAEA]"
      )}>
        {(d.status === "VENDOR_RESPONDED" || d.status === "UNDER_REVIEW") && <Clock size={16} className="text-[#FF9800] shrink-0 mt-[1px]" />}
        {(d.status === "VENDOR_TIMEOUT" || d.status === "ADMIN_TIMEOUT") && <AlertTriangle size={16} className="text-[#E53935] shrink-0 mt-[1px]" />}
        <div>
          <p className={cn("font-jakarta font-bold text-[13px]",
            d.status === "VENDOR_RESPONDED" || d.status === "UNDER_REVIEW" ? "text-[#FF9800]" :
            d.status === "VENDOR_TIMEOUT" || d.status === "ADMIN_TIMEOUT" ? "text-[#E53935]" : "text-[#2E7D32]"
          )}>{statusInfo.label}</p>
          <p className="font-jakarta text-[12px] text-[#545454] mt-[2px] leading-[1.5]">{statusInfo.info}</p>
          {canAct && adminHoursLeft !== null && (
            <p className="font-jakarta text-[12px] font-bold text-[#E53935] mt-[4px]">
              {adminHoursLeft > 0 ? `${adminHoursLeft} hour${adminHoursLeft !== 1 ? "s" : ""} remaining to resolve` : "Resolution window has expired"}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px]">
        {/* Left: details */}
        <div className="lg:col-span-2 flex flex-col gap-[16px]">

          {/* Order info */}
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
            <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[4px]">Order Information</p>
            <Row label="Buyer" value={d.order?.user ? `${d.order.user.firstName} ${d.order.user.lastName}` : "—"} />
            <Row label="Buyer Email" value={d.order?.user?.email ?? "—"} />
            <Row label="Vendor" value={d.order?.vendor?.storeName ?? "—"} />
            <Row label="Vendor Owner" value={d.order?.vendor?.user ? `${d.order.vendor.user.firstName} ${d.order.vendor.user.lastName}` : "—"} />
            {d.order?.orderItems?.map((item, i) => (
              <Row key={i} label="Item" value={`${item.quantity}× ${item.product.name}`} />
            ))}
            {d.order?.totalAmount && <Row label="Order Total" value={formatNaira(parseFloat(d.order.totalAmount))} />}
          </div>

          {/* Customer complaint */}
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
            <div className="flex items-center gap-[8px] mb-[10px]">
              <div className="w-[8px] h-[8px] rounded-full bg-[#E53935]" />
              <p className="font-satoshi font-bold text-[14px] text-[#151515]">Customer Complaint</p>
            </div>
            <p className="font-jakarta text-[13px] font-semibold text-[#E53935] mb-[6px]">{d.reason}</p>
            {d.description && (
              <p className="font-jakarta text-[13px] text-[#545454] leading-[1.7]">{d.description}</p>
            )}
            {d.proofUrls && d.proofUrls.length > 0 && (
              <div className="mt-[12px]">
                <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[8px]">Customer proof:</p>
                <div className="flex gap-[8px] flex-wrap">
                  {d.proofUrls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" title={`View proof ${i + 1}`}
                      className="relative w-[80px] h-[80px] rounded-[8px] overflow-hidden border border-[#EAEAEA] block hover:opacity-80 transition-opacity">
                      <Image src={url} alt={`Proof ${i + 1}`} fill className="object-cover" sizes="80px" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p className="font-jakarta text-[11px] text-[#9B9B9B] mt-[10px]">Raised: {fmtDate(d.createdAt)}</p>
          </div>

          {/* Vendor response — only shown when vendor has responded */}
          {d.status === "OPEN" ? (
            <div className="bg-[#F7FFF8] rounded-[12px] border border-[#EAEAEA] p-[20px]">
              <div className="flex items-center gap-[8px] mb-[8px]">
                <Clock size={16} className="text-[#9B9B9B]" />
                <p className="font-satoshi font-bold text-[14px] text-[#9B9B9B]">Awaiting Vendor Response</p>
              </div>
              <p className="font-jakarta text-[13px] text-[#9B9B9B] leading-[1.6]">
                The vendor has 48 hours from when the dispute was raised to submit their response.
                If they do not respond, a refund will be raised directly through the super admin.
              </p>
            </div>
          ) : d.status === "VENDOR_TIMEOUT" ? (
            <div className="bg-[#FFEBEE] rounded-[12px] border border-[#E53935]/30 p-[20px]">
              <div className="flex items-center gap-[8px] mb-[8px]">
                <AlertTriangle size={16} className="text-[#E53935]" />
                <p className="font-satoshi font-bold text-[14px] text-[#E53935]">Vendor Did Not Respond</p>
              </div>
              <p className="font-jakarta text-[13px] text-[#E53935]/80 leading-[1.6]">
                The vendor did not respond within the 48-hour window. A refund request has been escalated directly to the super admin.
                This is no longer actionable by the campus admin.
              </p>
            </div>
          ) : d.vendorResponse ? (
            <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
              <div className="flex items-center gap-[8px] mb-[10px]">
                <div className="w-[8px] h-[8px] rounded-full bg-[#2E7D32]" />
                <p className="font-satoshi font-bold text-[14px] text-[#151515]">Vendor Response</p>
              </div>
              <p className="font-jakarta text-[13px] text-[#545454] leading-[1.7]">{d.vendorResponse}</p>
              {d.counterProofUrls && d.counterProofUrls.length > 0 && (
                <div className="mt-[12px]">
                  <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[8px]">Vendor counter-proof:</p>
                  <div className="flex gap-[8px] flex-wrap">
                    {d.counterProofUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" title={`View counter-proof ${i + 1}`}
                        className="relative w-[80px] h-[80px] rounded-[8px] overflow-hidden border border-[#EAEAEA] block hover:opacity-80 transition-opacity">
                        <Image src={url} alt={`Counter-proof ${i + 1}`} fill className="object-cover" sizes="80px" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <p className="font-jakarta text-[11px] text-[#9B9B9B] mt-[10px]">Responded: {fmtDate(d.vendorResponseAt)}</p>
            </div>
          ) : null}

          {/* Admin resolution (if already resolved) */}
          {d.adminResolution && (
            <div className="bg-[#D8FFDA] rounded-[12px] border border-[#2E7D32]/30 p-[20px]">
              <div className="flex items-center gap-[8px] mb-[10px]">
                <div className="w-[8px] h-[8px] rounded-full bg-[#2E7D32]" />
                <p className="font-satoshi font-bold text-[14px] text-[#2E7D32]">Admin Resolution</p>
              </div>
              <p className="font-jakarta text-[13px] text-[#1D5620] leading-[1.7]">{d.adminResolution}</p>
              {d.refundRequested !== undefined && (
                <p className="font-jakarta text-[12px] font-semibold text-[#2E7D32] mt-[8px]">
                  {d.refundRequested ? "🔁 Refund request raised to super admin." : "✓ No refund required."}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex flex-col gap-[12px]">
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
            <p className="font-satoshi font-bold text-[14px] text-[#151515] mb-[16px]">Your Action</p>

            {canAct ? (
              <div className="flex flex-col gap-[10px]">
                <p className="font-jakarta text-[12px] text-[#9B9B9B] leading-[1.6] mb-[4px]">
                  Review both the customer complaint and the vendor response above, then submit your resolution.
                  A summary email will be sent to both parties automatically.
                </p>
                <button type="button" onClick={() => setShowResolveModal(true)}
                  className="w-full h-[44px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[13px] font-semibold text-white hover:bg-[#1D5620] transition-colors">
                  Submit Resolution
                </button>
              </div>
            ) : d.status === "OPEN" ? (
              <p className="font-jakarta text-[13px] text-[#9B9B9B] leading-[1.6]">
                Waiting for the vendor to respond before you can take action.
              </p>
            ) : d.status === "VENDOR_TIMEOUT" ? (
              <p className="font-jakarta text-[13px] text-[#E53935] leading-[1.6]">
                This dispute bypassed campus admin review. The super admin is handling the refund directly.
              </p>
            ) : (
              <p className="font-jakarta text-[13px] text-[#9B9B9B] leading-[1.6]">
                This dispute has been {d.status.toLowerCase().replace("_", " ")}.
                No further action is required from you.
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
            <p className="font-satoshi font-bold text-[13px] text-[#151515] mb-[14px]">Timeline</p>
            <div className="flex flex-col gap-[10px]">
              {[
                { label: "Dispute raised", time: d.createdAt, done: true },
                { label: "Vendor response deadline", time: d.vendorDeadlineAt, done: !!d.vendorResponseAt || d.status === "VENDOR_TIMEOUT" },
                { label: "Vendor responded", time: d.vendorResponseAt, done: !!d.vendorResponseAt },
                { label: "Admin resolution deadline", time: d.adminDeadlineAt, done: d.status === "RESOLVED" || d.status === "ADMIN_TIMEOUT" },
              ].map((step, i) => step.time && (
                <div key={i} className="flex items-start gap-[10px]">
                  <div className={cn("w-[8px] h-[8px] rounded-full mt-[4px] shrink-0", step.done ? "bg-[#2E7D32]" : "bg-[#EAEAEA]")} />
                  <div>
                    <p className="font-jakarta text-[12px] font-semibold text-[#333333]">{step.label}</p>
                    <p className="font-jakarta text-[11px] text-[#9B9B9B]">{fmtDate(step.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showResolveModal && (
        <ResolveModal
          onClose={() => setShowResolveModal(false)}
          isLoading={resolveMutation.isPending}
          onConfirm={(resolution, refund) => resolveMutation.mutate({ resolution, refund })}
        />
      )}
    </AdminLayout>
  );
}
