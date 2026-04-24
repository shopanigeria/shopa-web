"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { AlertTriangle, Clock } from "lucide-react";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";
import { formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Dispute {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  vendorResponseAt?: string;
  adminResolution?: string;
  refundRequested?: boolean;
  order?: {
    orderNumber?: string;
    totalAmount?: string;
    vendor?: { storeName?: string; campus?: { name: string } };
    user?: { firstName: string; lastName: string };
  };
}

// ── Dispute flow the super admin sees ─────────────────────────────────────────
// OPEN             → vendor window active (super admin can monitor)
// VENDOR_TIMEOUT   → vendor didn't respond → super admin must issue refund
// VENDOR_RESPONDED → forwarded to uni admin (super admin can monitor)
// ADMIN_TIMEOUT    → uni admin didn't respond in 48h → super admin must resolve
// ESCALATED        → uni admin escalated manually → super admin must resolve
// RESOLVED         → done by uni admin (super admin can see outcome)
// CLOSED           → fully done

const SUPERADMIN_REFUND_STATUSES = ["VENDOR_TIMEOUT"];
const SUPERADMIN_RESOLVE_STATUSES = ["ADMIN_TIMEOUT", "ESCALATED"];

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_DISPUTES: Dispute[] = [
  {
    id: "d1", status: "VENDOR_TIMEOUT", reason: "Item never arrived",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 55).toISOString(),
    order: { orderNumber: "12345678", totalAmount: "5000", vendor: { storeName: "Fresh Provisions", campus: { name: "Crawford University" } }, user: { firstName: "Sade", lastName: "Bello" } },
  },
  {
    id: "d2", status: "ESCALATED", reason: "Vendor unresponsive after delivery claim",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    vendorResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    order: { orderNumber: "87654321", totalAmount: "12000", vendor: { storeName: "Campus Gadgets", campus: { name: "Crawford University" } }, user: { firstName: "Kelvin", lastName: "Osei" } },
  },
  {
    id: "d3", status: "ADMIN_TIMEOUT", reason: "Wrong item received",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
    vendorResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    order: { orderNumber: "11223344", totalAmount: "8000", vendor: { storeName: "Style Hub", campus: { name: "Crawford University" } }, user: { firstName: "Ngozi", lastName: "Eze" } },
  },
  {
    id: "d4", status: "RESOLVED", reason: "Item damaged on arrival",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    adminResolution: "Campus admin ruled in favour of customer. No refund required as vendor provided evidence of intact packaging at dispatch.",
    refundRequested: false,
    order: { orderNumber: "55667788", totalAmount: "3500", vendor: { storeName: "BookNook", campus: { name: "Crawford University" } }, user: { firstName: "Ade", lastName: "Martins" } },
  },
  {
    id: "d5", status: "OPEN", reason: "Delayed delivery",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    order: { orderNumber: "99001122", totalAmount: "2200", vendor: { storeName: "Campus Bites", campus: { name: "Crawford University" } }, user: { firstName: "Temi", lastName: "Adeyemi" } },
  },
];

// ── Resolve / refund modal ────────────────────────────────────────────────────

type ModalMode = "refund" | "resolve";

function ActionModal({ dispute, mode, onClose, onConfirm, isLoading }: {
  dispute: Dispute;
  mode: ModalMode;
  onClose: () => void;
  onConfirm: (note: string) => void;
  isLoading: boolean;
}) {
  const [note, setNote] = useState("");
  const orderTotal = dispute.order?.totalAmount ? parseFloat(dispute.order.totalAmount) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[24px] pb-[28px] w-full max-w-[480px]">
          {mode === "refund" ? (
            <>
              <p className="font-satoshi font-bold text-[16px] text-[#151515] mb-[4px]">Issue Refund</p>
              <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[4px]">
                Vendor did not respond within 48 hours. A full refund of{" "}
                <span className="font-bold text-[#E53935]">{formatNaira(orderTotal)}</span> will be issued to the customer.
              </p>
              <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[16px]">
                Both the vendor and customer will be notified by email.
              </p>
            </>
          ) : (
            <>
              <p className="font-satoshi font-bold text-[16px] text-[#151515] mb-[4px]">Resolve Dispute</p>
              <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[16px]">
                {dispute.status === "ADMIN_TIMEOUT"
                  ? "The campus admin did not resolve within 48 hours. You are now resolving this directly."
                  : "This dispute was escalated to you by the campus admin."}
                {" "}Your resolution will be emailed to both parties.
              </p>
            </>
          )}

          <label className="font-jakarta text-[13px] font-bold text-[#151515] block mb-[8px]">
            {mode === "refund" ? "Refund Note" : "Resolution Note"} <span className="text-[#E53935]">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={mode === "refund"
              ? "Briefly explain why the refund is being issued..."
              : "Describe your resolution. This will be emailed to both vendor and customer..."}
            rows={4}
            title={mode === "refund" ? "Refund note" : "Resolution note"}
            className="w-full rounded-[8px] border border-[#EAEAEA] bg-[#F7FFF8] px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32] resize-none mb-[20px]"
          />
          <div className="flex gap-[10px]">
            <button type="button" onClick={onClose}
              className="flex-1 h-[44px] rounded-[8px] border border-[#EAEAEA] font-jakarta text-[13px] font-semibold text-[#545454] hover:bg-[#F7FFF8] transition-colors">
              Cancel
            </button>
            <button type="button"
              onClick={() => note.trim() && onConfirm(note.trim())}
              disabled={!note.trim() || isLoading}
              className={cn(
                "flex-1 h-[44px] rounded-[8px] font-jakarta text-[13px] font-semibold text-white disabled:opacity-50 transition-colors",
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

export default function SuperAdminDisputesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isMock = user?.id === "mock-superadmin-001";

  const [actionModal, setActionModal] = useState<{ dispute: Dispute; mode: ModalMode } | null>(null);

  const { data: disputes, isLoading } = useQuery<Dispute[]>({
    queryKey: ["superadmin-disputes"],
    queryFn: async () => { const { data } = await apiClient.get("/disputes"); return data?.data ?? data ?? []; },
    enabled: !isMock,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, mode, note }: { id: string; mode: ModalMode; note: string }) => {
      if (isMock) { toast.success(mode === "refund" ? "Refund issued. (mock)" : "Dispute resolved. (mock)"); setActionModal(null); return; }
      const outcome = mode === "refund" ? "REFUND_ISSUED" : "RESOLVED";
      await apiClient.patch(`/disputes/${id}/resolve`, { resolution: note, outcome });
    },
    onSuccess: () => {
      toast.success(actionModal?.mode === "refund" ? "Refund issued. Both parties notified." : "Dispute resolved. Both parties notified.");
      queryClient.invalidateQueries({ queryKey: ["superadmin-disputes"] });
      setActionModal(null);
    },
    onError: () => toast.error("Action failed."),
  });

  const all = disputes ?? MOCK_DISPUTES;

  const needsRefund = all.filter((d) => SUPERADMIN_REFUND_STATUSES.includes(d.status));
  const needsResolve = all.filter((d) => SUPERADMIN_RESOLVE_STATUSES.includes(d.status));

  return (
    <SuperAdminLayout>
      <div className="mb-[28px]">
        <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">All Disputes</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{all.length} total disputes platform-wide</p>
      </div>

      {/* Priority action banners */}
      {needsRefund.length > 0 && (
        <div className="bg-[#FFEBEE] border border-[#E53935]/40 rounded-[12px] p-[16px] mb-[16px] flex items-start gap-[12px]">
          <AlertTriangle size={18} className="text-[#E53935] shrink-0 mt-[1px]" />
          <div>
            <p className="font-jakarta font-bold text-[13px] text-[#E53935] mb-[2px]">
              {needsRefund.length} Refund{needsRefund.length > 1 ? "s" : ""} Required — Vendor Timeout
            </p>
            <p className="font-jakarta text-[12px] text-[#E53935]/80 leading-[1.5]">
              The vendor(s) below did not respond within 48 hours. You must issue a refund directly to the customer.
              Campus admins are not involved in this path.
            </p>
          </div>
        </div>
      )}

      {needsResolve.length > 0 && (
        <div className="bg-[#F3E5F5] border border-[#7B1FA2]/30 rounded-[12px] p-[16px] mb-[16px] flex items-start gap-[12px]">
          <Clock size={18} className="text-[#7B1FA2] shrink-0 mt-[1px]" />
          <div>
            <p className="font-jakarta font-bold text-[13px] text-[#7B1FA2] mb-[2px]">
              {needsResolve.length} Dispute{needsResolve.length > 1 ? "s" : ""} Require Your Resolution
            </p>
            <p className="font-jakarta text-[12px] text-[#7B1FA2]/80 leading-[1.5]">
              Either the campus admin timed out or manually escalated these to you. Review and resolve directly.
            </p>
          </div>
        </div>
      )}

      <DataTable
        data={all as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchPlaceholder="Search disputes..."
        searchKeys={["reason"] as never[]}
        filters={[{ key: "status", label: "Status", options: [
          { value: "OPEN", label: "Open (vendor window active)" },
          { value: "VENDOR_TIMEOUT", label: "Vendor Timeout → Refund needed" },
          { value: "VENDOR_RESPONDED", label: "Vendor Responded (uni admin reviewing)" },
          { value: "ADMIN_TIMEOUT", label: "Admin Timeout → Super admin resolve" },
          { value: "ESCALATED", label: "Escalated to Super Admin" },
          { value: "RESOLVED", label: "Resolved" },
          { value: "CLOSED", label: "Closed" },
        ]}]}
        emptyMessage="No disputes found."
        columns={[
          { key: "order", label: "Order #", render: (r) => {
            const d = r as unknown as Dispute;
            return <span className="font-jakarta font-semibold text-[13px] text-[#151515]">#{(d.order?.orderNumber ?? d.id).slice(-8).toUpperCase()}</span>;
          }},
          { key: "buyer", label: "Buyer", render: (r) => {
            const d = r as unknown as Dispute;
            return <span className="font-jakarta text-[13px] text-[#333333]">{d.order?.user ? `${d.order.user.firstName} ${d.order.user.lastName}` : "—"}</span>;
          }},
          { key: "vendor", label: "Vendor", render: (r) => <span className="font-jakarta text-[13px] text-[#333333]">{(r as unknown as Dispute).order?.vendor?.storeName ?? "—"}</span> },
          { key: "campus", label: "Campus", render: (r) => <span className="font-jakarta text-[12px] text-[#9B9B9B]">{(r as unknown as Dispute).order?.vendor?.campus?.name ?? "—"}</span> },
          { key: "amount", label: "Amount", render: (r) => {
            const d = r as unknown as Dispute;
            return d.order?.totalAmount
              ? <span className="font-jakarta font-semibold text-[13px] text-[#151515]">{formatNaira(parseFloat(d.order.totalAmount))}</span>
              : <span className="font-jakarta text-[12px] text-[#9B9B9B]">—</span>;
          }},
          { key: "status", label: "Status", render: (r) => {
            const d = r as unknown as Dispute;
            // Custom labels for the flow-specific statuses
            const label: Record<string, string> = {
              VENDOR_TIMEOUT: "Vendor Timeout",
              ADMIN_TIMEOUT: "Admin Timeout",
              VENDOR_RESPONDED: "With Uni Admin",
            };
            return <StatusBadge status={label[d.status] ? d.status : d.status} />;
          }},
          { key: "resolution", label: "Uni Admin Resolution", render: (r) => {
            const d = r as unknown as Dispute;
            if (!d.adminResolution) return <span className="font-jakarta text-[12px] text-[#C2C2C2]">—</span>;
            return (
              <div className="max-w-[180px]">
                <p className="font-jakarta text-[12px] text-[#333333] truncate">{d.adminResolution}</p>
                {d.refundRequested !== undefined && (
                  <p className={`font-jakarta text-[11px] font-semibold mt-[2px] ${d.refundRequested ? "text-[#E53935]" : "text-[#2E7D32]"}`}>
                    {d.refundRequested ? "Refund requested" : "No refund"}
                  </p>
                )}
              </div>
            );
          }},
          { key: "createdAt", label: "Date", render: (r) => <span className="font-jakarta text-[12px] text-[#9B9B9B]">{new Date((r as unknown as Dispute).createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</span> },
          { key: "actions", label: "", render: (r) => {
            const d = r as unknown as Dispute;
            return (
              <div className="flex items-center gap-[10px]">
                <Link href={`/superadmin/disputes/${d.id}`}
                  className="font-jakarta text-[12px] font-semibold text-[#2E7D32] hover:underline whitespace-nowrap">
                  View
                </Link>
                {SUPERADMIN_REFUND_STATUSES.includes(d.status) && (
                  <button type="button" title="Issue refund" onClick={() => setActionModal({ dispute: d, mode: "refund" })}
                    className="font-jakarta text-[12px] font-semibold text-[#E53935] hover:underline whitespace-nowrap">
                    Refund
                  </button>
                )}
                {SUPERADMIN_RESOLVE_STATUSES.includes(d.status) && (
                  <button type="button" title="Resolve dispute" onClick={() => setActionModal({ dispute: d, mode: "resolve" })}
                    className="font-jakarta text-[12px] font-semibold text-[#7B1FA2] hover:underline whitespace-nowrap">
                    Resolve
                  </button>
                )}
              </div>
            );
          }},
        ]}
      />

      {actionModal && (
        <ActionModal
          dispute={actionModal.dispute}
          mode={actionModal.mode}
          onClose={() => setActionModal(null)}
          isLoading={actionMutation.isPending}
          onConfirm={(note) => actionMutation.mutate({ id: actionModal.dispute.id, mode: actionModal.mode, note })}
        />
      )}
    </SuperAdminLayout>
  );
}
