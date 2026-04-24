"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { StatsCard } from "@/components/admin/StatsCard";
import { Wallet, DollarSign, Clock } from "lucide-react";
import { formatNaira } from "@/lib/utils";

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  bankDetails?: { accountNumber: string; bankName: string; accountName: string };
  vendor?: { storeName: string; campus?: { name: string }; user?: { firstName: string; lastName: string } };
}

const MOCK_WITHDRAWALS: Withdrawal[] = [
  { id: "w1", amount: 50000, status: "PENDING", createdAt: new Date().toISOString(), bankDetails: { accountNumber: "0123456789", bankName: "Access Bank", accountName: "Tolu Adeyemi" }, vendor: { storeName: "Fresh Provisions", campus: { name: "Crawford University" }, user: { firstName: "Tolu", lastName: "Adeyemi" } } },
  { id: "w2", amount: 25000, status: "APPROVED", createdAt: new Date().toISOString(), bankDetails: { accountNumber: "9876543210", bankName: "GTB", accountName: "Emeka Obi" }, vendor: { storeName: "Campus Gadgets", campus: { name: "Crawford University" }, user: { firstName: "Emeka", lastName: "Obi" } } },
  { id: "w3", amount: 15000, status: "REJECTED", createdAt: new Date().toISOString(), bankDetails: { accountNumber: "1122334455", bankName: "UBA", accountName: "Amaka Eze" }, vendor: { storeName: "Style Hub", campus: { name: "Crawford University" }, user: { firstName: "Amaka", lastName: "Eze" } } },
];

export default function WithdrawalsPage() {
  const queryClient = useQueryClient();
  const [actionModal, setActionModal] = useState<{ w: Withdrawal; action: "approve" | "reject" } | null>(null);

  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["superadmin-withdrawals"],
    queryFn: async () => { const { data } = await apiClient.get("/vendors/admin/withdrawals"); return data?.data ?? data ?? []; },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
      await apiClient.patch(`/vendors/admin/withdrawals/${id}`, { status, ...(note && { note }) });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.status === "APPROVED" ? "Withdrawal approved." : "Withdrawal rejected.");
      queryClient.invalidateQueries({ queryKey: ["superadmin-withdrawals"] });
      setActionModal(null);
    },
    onError: () => toast.error("Action failed."),
  });

  const all = withdrawals ?? MOCK_WITHDRAWALS;
  const pending = all.filter((w) => w.status === "PENDING");
  const approvedThisMonth = all.filter((w) => w.status === "APPROVED" && new Date(w.createdAt).getMonth() === new Date().getMonth());
  const totalPending = pending.reduce((s, w) => s + w.amount, 0);
  const totalApproved = approvedThisMonth.reduce((s, w) => s + w.amount, 0);

  return (
    <SuperAdminLayout>
      <div className="mb-[28px]">
        <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">Withdrawal Requests</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{pending.length} pending approval</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] mb-[28px]">
        <StatsCard label="Pending Withdrawals" value={pending.length} icon={Clock} iconBg="bg-[#FFF3E0]" iconColor="text-[#FF9800]" />
        <StatsCard label="Total Pending Amount" value={formatNaira(totalPending)} icon={Wallet} iconBg="bg-[#FFEBEE]" iconColor="text-[#E53935]" />
        <StatsCard label="Approved This Month" value={formatNaira(totalApproved)} icon={DollarSign} iconBg="bg-[#D8FFDA]" iconColor="text-[#2E7D32]" />
      </div>

      <DataTable
        data={all as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchPlaceholder="Search by vendor name..."
        searchKeys={[]} filters={[
          { key: "status", label: "Status", options: [{ value: "PENDING", label: "Pending" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }] },
        ]}
        emptyMessage="No withdrawal requests."
        columns={[
          { key: "vendor", label: "Vendor", render: (r) => {
            const w = r as unknown as Withdrawal;
            return <div><p className="font-jakarta font-semibold text-[13px] text-[#151515]">{w.vendor?.storeName ?? "—"}</p><p className="font-jakarta text-[11px] text-[#9B9B9B]">{w.vendor?.user ? `${w.vendor.user.firstName} ${w.vendor.user.lastName}` : ""}</p></div>;
          }},
          { key: "campus", label: "Campus", render: (r) => <span className="font-jakarta text-[12px] text-[#9B9B9B]">{(r as unknown as Withdrawal).vendor?.campus?.name ?? "—"}</span> },
          { key: "amount", label: "Amount", render: (r) => <span className="font-jakarta font-bold text-[13px] text-[#151515]">{formatNaira((r as unknown as Withdrawal).amount)}</span> },
          { key: "bankDetails", label: "Bank Details", render: (r) => {
            const w = r as unknown as Withdrawal;
            return w.bankDetails ? (
              <div>
                <p className="font-jakarta text-[12px] text-[#333333]">{w.bankDetails.bankName}</p>
                <p className="font-jakarta text-[11px] text-[#9B9B9B]">{w.bankDetails.accountNumber} · {w.bankDetails.accountName}</p>
              </div>
            ) : <span className="font-jakarta text-[12px] text-[#9B9B9B]">—</span>;
          }},
          { key: "status", label: "Status", render: (r) => <StatusBadge status={(r as unknown as Withdrawal).status} /> },
          { key: "createdAt", label: "Date", render: (r) => <span className="font-jakarta text-[12px] text-[#9B9B9B]">{new Date((r as unknown as Withdrawal).createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</span> },
          { key: "actions", label: "", render: (r) => {
            const w = r as unknown as Withdrawal;
            if (w.status !== "PENDING") return null;
            return (
              <div className="flex gap-[8px]">
                <button type="button" title="Approve withdrawal" onClick={() => setActionModal({ w, action: "approve" })}
                  className="font-jakarta text-[12px] text-[#2E7D32] font-semibold hover:underline">Approve</button>
                <button type="button" title="Reject withdrawal" onClick={() => setActionModal({ w, action: "reject" })}
                  className="font-jakarta text-[12px] text-[#E53935] font-semibold hover:underline">Reject</button>
              </div>
            );
          }},
        ]}
      />

      {actionModal?.action === "approve" && (
        <ConfirmModal title={`Approve withdrawal of ${formatNaira(actionModal.w.amount)}?`}
          message={`To ${actionModal.w.bankDetails?.accountName ?? ""} via ${actionModal.w.bankDetails?.bankName ?? ""} (${actionModal.w.bankDetails?.accountNumber ?? ""})`}
          confirmLabel="Approve & Process" isLoading={processMutation.isPending}
          onClose={() => setActionModal(null)}
          onConfirm={() => processMutation.mutate({ id: actionModal.w.id, status: "APPROVED" })}
        />
      )}
      {actionModal?.action === "reject" && (
        <ConfirmModal title={`Reject withdrawal of ${formatNaira(actionModal.w.amount)}?`}
          confirmLabel="Reject" variant="danger"
          requireReason reasonLabel="Reason" reasonPlaceholder="Enter rejection reason..."
          isLoading={processMutation.isPending} onClose={() => setActionModal(null)}
          onConfirm={(note) => processMutation.mutate({ id: actionModal.w.id, status: "REJECTED", note })}
        />
      )}
    </SuperAdminLayout>
  );
}
