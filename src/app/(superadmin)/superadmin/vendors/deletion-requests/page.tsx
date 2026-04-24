"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { useState } from "react";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

interface DeletionRequest {
  id: string;
  vendorId: string;
  reason: string;
  status: string;
  createdAt: string;
  vendor?: { storeName: string; campus?: { name: string } };
  requestedBy?: { firstName: string; lastName: string };
}

const MOCK_REQUESTS: DeletionRequest[] = [
  { id: "dr1", vendorId: "v1", reason: "Vendor violated campus code of conduct.", status: "PENDING", createdAt: new Date().toISOString(), vendor: { storeName: "Bad Store", campus: { name: "Crawford University" } }, requestedBy: { firstName: "Chidi", lastName: "Nwosu" } },
];

export default function DeletionRequestsPage() {
  const queryClient = useQueryClient();
  const [actionModal, setActionModal] = useState<{ req: DeletionRequest; action: "approve" | "reject" } | null>(null);

  const { data: requests, isLoading } = useQuery<DeletionRequest[]>({
    queryKey: ["deletion-requests"],
    queryFn: async () => { const { data } = await apiClient.get("/vendors/admin/deletion-requests"); return data?.data ?? data ?? []; },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, approve, note }: { id: string; approve: boolean; note?: string }) => {
      await apiClient.patch(`/vendors/admin/deletion-requests/${id}`, { approved: approve, ...(note && { note }) });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.approve ? "Vendor deleted." : "Request rejected.");
      queryClient.invalidateQueries({ queryKey: ["deletion-requests"] });
      setActionModal(null);
    },
    onError: () => toast.error("Action failed."),
  });

  const all = requests ?? MOCK_REQUESTS;
  const pending = all.filter((r) => r.status === "PENDING");

  return (
    <SuperAdminLayout>
      <div className="mb-[28px]">
        <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">Vendor Deletion Requests</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{pending.length} pending request{pending.length !== 1 ? "s" : ""}</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-[12px]">{[1, 2].map((i) => <div key={i} className="bg-white rounded-[12px] border border-[#EAEAEA] h-[100px] animate-pulse" />)}</div>
      ) : all.length === 0 ? (
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[40px] text-center">
          <p className="font-jakarta text-[14px] text-[#9B9B9B]">No deletion requests.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[12px]">
          {all.map((req) => (
            <div key={req.id} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
              <div className="flex items-start justify-between gap-[12px] flex-wrap">
                <div>
                  <p className="font-satoshi font-bold text-[15px] text-[#151515]">{req.vendor?.storeName ?? req.vendorId}</p>
                  <p className="font-jakarta text-[12px] text-[#9B9B9B] mt-[2px]">
                    {req.vendor?.campus?.name ?? "—"} · Requested by {req.requestedBy ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : "Admin"}
                  </p>
                  <p className="font-jakarta text-[12px] text-[#9B9B9B]">{new Date(req.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
                <span className={`font-jakarta text-[11px] font-semibold px-[10px] py-[3px] rounded-full ${req.status === "PENDING" ? "bg-[#FFF3E0] text-[#FF9800]" : req.status === "APPROVED" ? "bg-[#FFEBEE] text-[#E53935]" : "bg-[#D8FFDA] text-[#2E7D32]"}`}>
                  {req.status}
                </span>
              </div>
              <div className="mt-[12px] bg-[#F7FFF8] rounded-[8px] px-[14px] py-[10px]">
                <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[2px]">Reason from campus admin:</p>
                <p className="font-jakarta text-[13px] text-[#333333]">{req.reason}</p>
              </div>
              {req.status === "PENDING" && (
                <div className="flex gap-[10px] mt-[16px]">
                  <button type="button" onClick={() => setActionModal({ req, action: "approve" })}
                    className="flex-1 h-[40px] rounded-[8px] bg-[#E53935] font-jakarta text-[13px] font-semibold text-white hover:bg-[#C62828] transition-colors">
                    Approve Deletion
                  </button>
                  <button type="button" onClick={() => setActionModal({ req, action: "reject" })}
                    className="flex-1 h-[40px] rounded-[8px] border border-[#EAEAEA] font-jakarta text-[13px] font-semibold text-[#545454] hover:bg-[#F7FFF8] transition-colors">
                    Reject Request
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {actionModal?.action === "approve" && (
        <ConfirmModal title={`Delete "${actionModal.req.vendor?.storeName}"?`}
          message="This will permanently delete the vendor and all their products. This cannot be undone."
          confirmLabel="Delete Vendor" variant="danger"
          isLoading={processMutation.isPending} onClose={() => setActionModal(null)}
          onConfirm={() => processMutation.mutate({ id: actionModal.req.id, approve: true })}
        />
      )}
      {actionModal?.action === "reject" && (
        <ConfirmModal title="Reject deletion request?"
          message="The campus admin will be notified that this request was rejected."
          confirmLabel="Reject" requireReason reasonLabel="Note to campus admin" reasonPlaceholder="Explain why the deletion was rejected..."
          isLoading={processMutation.isPending} onClose={() => setActionModal(null)}
          onConfirm={(note) => processMutation.mutate({ id: actionModal.req.id, approve: false, note })}
        />
      )}
    </SuperAdminLayout>
  );
}
