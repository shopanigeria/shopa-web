"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Settings, X, Check, ChevronLeft } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface OrderItem {
  quantity: number;
  price: string;
  product: { name: string; imageUrls?: string[]; images?: string[] };
}

interface Dispute {
  id: string;
  orderId: string;
  status: string;
  reason: string;
  proofUrls?: string[];
  vendorResponse?: string;
  createdAt: string;
  order?: {
    id: string;
    orderNumber?: string;
    orderItems: OrderItem[];
  };
  user?: { firstName: string; lastName: string };
}

type Tab = "INCOMING" | "ONGOING" | "RESOLVED";
type View = "list" | "respond" | "success";

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_DISPUTES: Dispute[] = [
  {
    id: "d1",
    orderId: "mock-order-1",
    status: "OPEN",
    reason: "One of the shirts that was delivered to me was torn.",
    proofUrls: ["https://example.com/proof.jpg"],
    createdAt: new Date().toISOString(),
    order: {
      id: "mock-order-1",
      orderNumber: "12345678",
      orderItems: [{ quantity: 2, price: "20000", product: { name: "Primark Shirt", imageUrls: [] } }],
    },
    user: { firstName: "Ayomide", lastName: "Lawal" },
  },
  {
    id: "d2",
    orderId: "mock-order-2",
    status: "RESPONDED",
    reason: "One of the shirts that was delivered to me was torn.",
    proofUrls: ["https://example.com/proof.jpg"],
    vendorResponse: "I wasn't aware the shirt was torn, I apologize for that",
    createdAt: new Date().toISOString(),
    order: {
      id: "mock-order-2",
      orderNumber: "12345679",
      orderItems: [{ quantity: 2, price: "20000", product: { name: "Primark Shirt", imageUrls: [] } }],
    },
    user: { firstName: "Ayomide", lastName: "Lawal" },
  },
  {
    id: "d3",
    orderId: "mock-order-3",
    status: "RESOLVED",
    reason: "One of the shirts that was delivered to me was torn.",
    proofUrls: ["https://example.com/proof.jpg"],
    vendorResponse: "I wasn't aware the shirt was torn, I apologize for that",
    createdAt: new Date().toISOString(),
    order: {
      id: "mock-order-3",
      orderNumber: "12345680",
      orderItems: [{ quantity: 2, price: "20000", product: { name: "Primark Shirt", imageUrls: [] } }],
    },
    user: { firstName: "Ayomide", lastName: "Lawal" },
  },
];

const STATUS_MAP: Record<Tab, string[]> = {
  INCOMING: ["OPEN", "PENDING"],
  ONGOING: ["RESPONDED", "UNDER_REVIEW", "IN_PROGRESS"],
  RESOLVED: ["RESOLVED", "CLOSED"],
};

const TABS: { key: Tab; label: string; activeClass: string }[] = [
  { key: "INCOMING", label: "Incoming", activeClass: "bg-[#D8FFDA] text-[#2E7D32]" },
  { key: "ONGOING", label: "Ongoing", activeClass: "bg-[#FDC500] text-white" },
  { key: "RESOLVED", label: "Resolved", activeClass: "bg-[#2E7D32] text-white" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function getShort(dispute: Dispute) {
  return (dispute.order?.orderNumber ?? dispute.orderId).slice(-8).toUpperCase();
}

function getImg(dispute: Dispute) {
  const item = dispute.order?.orderItems[0];
  return item?.product?.imageUrls?.[0] ?? item?.product?.images?.[0];
}

// ── Backdrop ───────────────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />;
}

// ── Success modal ──────────────────────────────────────────────────────────

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] border border-[#2E7D32] px-[32px] pt-[32px] pb-[32px] w-full max-w-[360px] relative flex flex-col items-center">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>
          <div className="w-[72px] h-[72px] rounded-full bg-[#2E7D32] flex items-center justify-center mb-[20px]">
            <Check size={36} className="text-white" strokeWidth={3} />
          </div>
          <p className="font-jakarta text-[14px] font-semibold text-[#2E7D32] text-center leading-[1.6] tracking-[-0.04em]">
            Response submitted! You will get a response in your mail within 72 hours. Thank you!
          </p>
        </div>
      </div>
    </>
  );
}

// ── Detail modal (Resolved) ────────────────────────────────────────────────

function ResolvedDetailModal({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const img = getImg(dispute);
  const item = dispute.order?.orderItems[0];

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
          <p className="font-jakarta font-bold text-[16px] text-[#151515] tracking-[-0.04em] mb-[16px]">
            Order #{getShort(dispute)}
          </p>
          <div className="flex flex-col gap-[10px]">
            <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
              <span className="font-bold">Customer Name:</span>{" "}
              <span className="text-[#9B9B9B]">{dispute.user ? `${dispute.user.firstName} ${dispute.user.lastName}` : "—"}</span>
            </p>
            {item && (
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
            )}
            <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
              <span className="font-bold">Customer Complaint:</span>{" "}
              <span className="text-[#9B9B9B]">{dispute.reason}</span>
            </p>
            {dispute.vendorResponse && (
              <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
                <span className="font-bold">Your Response:</span>{" "}
                <span className="text-[#9B9B9B]">{dispute.vendorResponse}</span>
              </p>
            )}
            {dispute.proofUrls && dispute.proofUrls.length > 0 && (
              <a href={dispute.proofUrls[0]} target="_blank" rel="noopener noreferrer"
                className="font-jakarta text-[13px] tracking-[-0.04em]">
                <span className="text-[#2E7D32] font-bold underline">Click here</span>
                <span className="text-[#333333]"> to view proof</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Dispute cards ──────────────────────────────────────────────────────────

function IncomingDisputeCard({ dispute, onRespond }: { dispute: Dispute; onRespond: () => void }) {
  const img = getImg(dispute);
  const item = dispute.order?.orderItems[0];
  return (
    <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px]">
      <p className="font-jakarta font-bold text-[14px] text-[#151515] tracking-[-0.04em] mb-[12px]">
        Order #{getShort(dispute)}
      </p>
      <div className="flex flex-col gap-[8px] mb-[14px]">
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-bold">Customer Name:</span>{" "}
          <span className="text-[#9B9B9B]">{dispute.user ? `${dispute.user.firstName} ${dispute.user.lastName}` : "—"}</span>
        </p>
        {item && (
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
        )}
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-bold">Customer Complaint:</span>{" "}
          <span className="text-[#9B9B9B]">{dispute.reason}</span>
        </p>
        {dispute.proofUrls && dispute.proofUrls.length > 0 && (
          <a href={dispute.proofUrls[0]} target="_blank" rel="noopener noreferrer"
            className="font-jakarta text-[13px] tracking-[-0.04em]">
            <span className="text-[#2E7D32] font-bold underline">Click here</span>
            <span className="text-[#333333]"> to view proof</span>
          </a>
        )}
      </div>
      <button type="button" onClick={onRespond}
        className="w-full h-[44px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[13px] font-semibold text-white hover:bg-[#1D5620] transition-colors">
        Respond to dispute
      </button>
    </div>
  );
}

function OngoingDisputeCard({ dispute }: { dispute: Dispute }) {
  const img = getImg(dispute);
  const item = dispute.order?.orderItems[0];
  return (
    <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px]">
      <p className="font-jakarta font-bold text-[14px] text-[#151515] tracking-[-0.04em] mb-[12px]">
        Order #{getShort(dispute)}
      </p>
      <div className="flex flex-col gap-[8px]">
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-bold">Customer Name:</span>{" "}
          <span className="text-[#9B9B9B]">{dispute.user ? `${dispute.user.firstName} ${dispute.user.lastName}` : "—"}</span>
        </p>
        {item && (
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
        )}
        <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
          <span className="font-bold">Customer Complaint:</span>{" "}
          <span className="text-[#9B9B9B]">{dispute.reason}</span>
        </p>
        {dispute.vendorResponse && (
          <p className="font-jakarta text-[13px] text-[#333333] tracking-[-0.04em]">
            <span className="font-bold">Your Response:</span>{" "}
            <span className="text-[#9B9B9B]">{dispute.vendorResponse}</span>
          </p>
        )}
        {dispute.proofUrls && dispute.proofUrls.length > 0 && (
          <a href={dispute.proofUrls[0]} target="_blank" rel="noopener noreferrer"
            className="font-jakarta text-[13px] tracking-[-0.04em]">
            <span className="text-[#2E7D32] font-bold underline">Click here</span>
            <span className="text-[#333333]"> to view proof</span>
          </a>
        )}
      </div>
    </div>
  );
}

function ResolvedDisputeCard({ dispute, onViewDetails }: { dispute: Dispute; onViewDetails: () => void }) {
  return (
    <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px]">
      <p className="font-jakarta font-bold text-[14px] text-[#151515] tracking-[-0.04em] mb-[6px]">
        Order #{getShort(dispute)}
      </p>
      <button type="button" onClick={onViewDetails}
        className="font-jakarta text-[13px] font-semibold text-[#FDC500] underline tracking-[-0.04em]">
        View Details
      </button>
    </div>
  );
}

// ── Response form ──────────────────────────────────────────────────────────

function ResponseForm({ dispute, isMock, onBack, onSuccess }: {
  dispute: Dispute; isMock: boolean; onBack: () => void; onSuccess: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [explanation, setExplanation] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []);
    if (newFiles.length) setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!explanation.trim()) {
      toast.error("Please enter your explanation.");
      return;
    }
    if (isMock) {
      onSuccess();
      return;
    }
    setSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("images", f));
        const { data } = await apiClient.post("/upload/images", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedUrls = data?.urls ?? data?.data?.urls ?? [];
      }
      await apiClient.post(`/disputes/${dispute.id}/respond`, {
        response: explanation.trim(),
        ...(uploadedUrls.length > 0 && { counterProofUrls: uploadedUrls }),
      });
      onSuccess();
    } catch {
      toast.error("Failed to submit response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FFF8] flex flex-col">
      {/* Header */}
      <div className="bg-[#2E7D32] rounded-b-[12px] h-[90px] flex items-center px-[20px] gap-[12px]">
        <button type="button" aria-label="Go back" onClick={onBack} className="text-white">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <span className="font-jakarta text-[16px] font-semibold text-white leading-[1.26] tracking-[-0.04em]">
          Disputes
        </span>
      </div>

      <div className="flex-1 px-[20px] pt-[24px] pb-[100px] flex flex-col gap-[20px]">
        {/* Explanation */}
        <div>
          <label className="font-jakarta text-[13px] font-bold text-[#151515] tracking-[-0.04em] mb-[10px] block">
            Do you have any explanation to this dispute raised? <span className="text-[#FDC500]">*</span>
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Enter your explanation..."
            rows={6}
            className="w-full rounded-[8px] border border-[#EAEAEA] bg-white px-[14px] py-[12px] font-jakarta text-[14px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32] resize-none"
          />
        </div>

        {/* Counter-proof upload */}
        <div>
          <label className="font-jakarta text-[13px] font-bold text-[#151515] tracking-[-0.04em] mb-[10px] block">
            Upload counter-proof (if any)
          </label>

          {/* Existing files */}
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between py-[10px] border-b border-[#EAEAEA]">
              <span className="font-jakarta text-[13px] text-[#9B9B9B] tracking-[-0.04em] truncate max-w-[280px]">
                {file.name}
              </span>
              <button type="button" aria-label="Remove file" onClick={() => removeFile(i)}>
                <X size={16} className="text-[#9B9B9B]" />
              </button>
            </div>
          ))}

          {/* Upload trigger */}
          <input ref={fileRef} type="file" accept="image/*,.pdf" multiple onChange={handleFileAdd} className="hidden" aria-label="Upload counter-proof files" title="Upload counter-proof files" />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="font-jakarta text-[13px] font-semibold text-[#2E7D32] underline tracking-[-0.04em] mt-[10px] block">
            {files.length > 0 ? "+ Upload additional counter-proof" : "+ Click to upload counter-proof (PNG, JPEG, PDF, etc)"}
          </button>
        </div>
      </div>

      {/* Submit button — fixed to bottom */}
      <div className="fixed bottom-[80px] left-1/2 -translate-x-1/2 w-full max-w-[390px] px-[20px]">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !explanation.trim()}
          className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:bg-[#C2C2C2] disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Submitting..." : "Submit Response"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function VendorDisputesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isMock = user?.id === "mock-vendor-001";

  const [activeTab, setActiveTab] = useState<Tab>("INCOMING");
  const [view, setView] = useState<View>("list");
  const [respondingDispute, setRespondingDispute] = useState<Dispute | null>(null);
  const [viewingDispute, setViewingDispute] = useState<Dispute | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: disputes, isLoading } = useQuery<Dispute[]>({
    queryKey: ["vendor-disputes"],
    queryFn: async () => {
      const { data } = await apiClient.get("/disputes/vendor-disputes");
      return data?.data ?? data ?? [];
    },
    enabled: !isMock,
  });

  const allDisputes = isMock ? MOCK_DISPUTES : (disputes ?? []);
  const tabDisputes = allDisputes.filter((d) => STATUS_MAP[activeTab].includes(d.status));

  // ── Response form view ──
  if (view === "respond" && respondingDispute) {
    return (
      <>
        <ResponseForm
          dispute={respondingDispute}
          isMock={isMock}
          onBack={() => { setView("list"); setRespondingDispute(null); }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["vendor-disputes"] });
            setView("list");
            setRespondingDispute(null);
            setShowSuccess(true);
          }}
        />
        {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
      </>
    );
  }

  // ── List view ──
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
        <h1 className="font-satoshi font-bold text-[20px] text-[#151515]">Disputes</h1>
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
      <div className="flex items-center gap-[8px] px-[20px] md:px-[32px] pt-[20px] pb-[4px]">
        {TABS.map(({ key, label, activeClass }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "px-[16px] h-[36px] rounded-[8px] font-jakarta text-[13px] font-semibold tracking-[-0.04em] transition-colors",
              activeTab === key ? activeClass : "bg-[#EAEAEA] text-[#545454]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-[20px] md:px-[32px] lg:px-[40px] pt-[16px] pb-[24px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px] items-start">
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px] h-[180px] animate-pulse" />
          ))
        ) : tabDisputes.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">
              No {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} disputes.
            </p>
          </div>
        ) : activeTab === "INCOMING" ? (
          tabDisputes.map((d) => (
            <IncomingDisputeCard
              key={d.id}
              dispute={d}
              onRespond={() => { setRespondingDispute(d); setView("respond"); }}
            />
          ))
        ) : activeTab === "ONGOING" ? (
          tabDisputes.map((d) => <OngoingDisputeCard key={d.id} dispute={d} />)
        ) : (
          tabDisputes.map((d) => (
            <ResolvedDisputeCard
              key={d.id}
              dispute={d}
              onViewDetails={() => setViewingDispute(d)}
            />
          ))
        )}
      </div>

      {/* Resolved detail modal */}
      {viewingDispute && (
        <ResolvedDetailModal
          dispute={viewingDispute}
          onClose={() => setViewingDispute(null)}
        />
      )}

      {/* Success modal (shown after response submitted from list context) */}
      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
    </div>
  );
}
