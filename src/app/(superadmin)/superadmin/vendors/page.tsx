"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

interface Vendor {
  id: string;
  storeName: string;
  status: string;
  createdAt: string;
  campus?: { name: string };
  user?: { firstName: string; lastName: string; email: string };
  categories?: string[];
}

const MOCK_VENDORS: Vendor[] = [
  { id: "v1", storeName: "Fresh Provisions", status: "APPROVED", createdAt: new Date().toISOString(), campus: { name: "Crawford University" }, user: { firstName: "Tolu", lastName: "Adeyemi", email: "tolu@test.com" }, categories: ["Provisions"] },
  { id: "v2", storeName: "Campus Gadgets", status: "PENDING", createdAt: new Date().toISOString(), campus: { name: "Crawford University" }, user: { firstName: "Emeka", lastName: "Obi", email: "emeka@test.com" }, categories: ["Gadgets & Accessories"] },
  { id: "v3", storeName: "Style Hub", status: "REJECTED", createdAt: new Date().toISOString(), campus: { name: "Crawford University" }, user: { firstName: "Amaka", lastName: "Eze", email: "amaka@test.com" }, categories: ["Clothing & Accessories"] },
];

export default function SuperAdminVendorsPage() {
  const queryClient = useQueryClient();
  const [actionModal, setActionModal] = useState<{ vendor: Vendor; action: "approve" | "reject" | "suspend" } | null>(null);

  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ["superadmin-vendors"],
    queryFn: async () => { const { data } = await apiClient.get("/vendors"); return data?.data ?? data ?? []; },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      await apiClient.patch(`/vendors/admin/${id}/verify`, { status, ...(reason && { reason }) });
    },
    onSuccess: () => { toast.success("Vendor updated."); queryClient.invalidateQueries({ queryKey: ["superadmin-vendors"] }); setActionModal(null); },
    onError: () => toast.error("Action failed."),
  });

  const all = vendors ?? MOCK_VENDORS;

  return (
    <SuperAdminLayout>
      <div className="flex items-center justify-between mb-[28px] flex-wrap gap-[12px]">
        <div>
          <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">All Vendors</h1>
          <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{all.length} vendors platform-wide</p>
        </div>
        <Link href="/superadmin/vendors/deletion-requests"
          className="font-jakarta text-[13px] font-semibold text-[#E53935] border border-[#E53935] px-[14px] h-[36px] rounded-[8px] flex items-center hover:bg-[#FFEBEE] transition-colors">
          Deletion Requests
        </Link>
      </div>

      <DataTable
        data={all as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchPlaceholder="Search vendors..."
        searchKeys={["storeName"] as never[]}
        filters={[
          { key: "status", label: "Status", options: [{ value: "PENDING", label: "Pending" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }] },
        ]}
        emptyMessage="No vendors found."
        columns={[
          { key: "storeName", label: "Store", render: (r) => {
            const v = r as unknown as Vendor;
            return <div><p className="font-jakarta font-semibold text-[13px] text-[#151515]">{v.storeName}</p><p className="font-jakarta text-[11px] text-[#9B9B9B]">{v.user?.firstName} {v.user?.lastName}</p></div>;
          }},
          { key: "campus", label: "Campus", render: (r) => <span className="font-jakarta text-[13px] text-[#333333]">{(r as unknown as Vendor).campus?.name ?? "—"}</span> },
          { key: "categories", label: "Categories", render: (r) => <span className="font-jakarta text-[12px] text-[#545454]">{((r as unknown as Vendor).categories ?? []).join(", ") || "—"}</span> },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={(r as unknown as Vendor).status} /> },
          { key: "createdAt", label: "Registered", render: (r) => <span className="font-jakarta text-[12px] text-[#9B9B9B]">{new Date((r as unknown as Vendor).createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</span> },
          { key: "actions", label: "Actions", render: (r) => {
            const v = r as unknown as Vendor;
            return (
              <div className="flex items-center gap-[8px]">
                {v.status === "PENDING" && <button type="button" title="Approve" onClick={() => setActionModal({ vendor: v, action: "approve" })} className="font-jakarta text-[12px] text-[#2E7D32] font-semibold hover:underline">Approve</button>}
                {v.status !== "REJECTED" && <button type="button" title="Reject" onClick={() => setActionModal({ vendor: v, action: "reject" })} className="font-jakarta text-[12px] text-[#E53935] font-semibold hover:underline">Reject</button>}
                {v.status === "APPROVED" && <button type="button" title="Suspend" onClick={() => setActionModal({ vendor: v, action: "suspend" })} className="font-jakarta text-[12px] text-[#9B9B9B] font-semibold hover:underline">Suspend</button>}
              </div>
            );
          }},
        ]}
      />

      {actionModal?.action === "approve" && (
        <ConfirmModal title={`Approve "${actionModal.vendor.storeName}"?`} confirmLabel="Approve"
          isLoading={verifyMutation.isPending} onClose={() => setActionModal(null)}
          onConfirm={() => verifyMutation.mutate({ id: actionModal.vendor.id, status: "APPROVED" })}
        />
      )}
      {actionModal?.action === "reject" && (
        <ConfirmModal title={`Reject "${actionModal.vendor.storeName}"?`} confirmLabel="Reject" variant="danger"
          requireReason reasonLabel="Reason" reasonPlaceholder="Enter rejection reason..."
          isLoading={verifyMutation.isPending} onClose={() => setActionModal(null)}
          onConfirm={(reason) => verifyMutation.mutate({ id: actionModal.vendor.id, status: "REJECTED", reason })}
        />
      )}
      {actionModal?.action === "suspend" && (
        <ConfirmModal title={`Suspend "${actionModal.vendor.storeName}"?`} message="This vendor will be suspended platform-wide." confirmLabel="Suspend" variant="danger"
          isLoading={verifyMutation.isPending} onClose={() => setActionModal(null)}
          onConfirm={() => verifyMutation.mutate({ id: actionModal.vendor.id, status: "SUSPENDED" })}
        />
      )}
    </SuperAdminLayout>
  );
}
