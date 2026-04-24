"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { DataTable } from "@/components/admin/DataTable";

interface Vendor {
  id: string;
  storeName: string;
  status: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
  categories?: string[];
}

const MOCK_VENDORS: Vendor[] = [
  { id: "v1", storeName: "Fresh Provisions", status: "PENDING", createdAt: new Date().toISOString(), user: { firstName: "Tolu", lastName: "Adeyemi", email: "tolu@test.com" }, categories: ["Provisions"] },
  { id: "v2", storeName: "Campus Gadgets", status: "APPROVED", createdAt: new Date().toISOString(), user: { firstName: "Emeka", lastName: "Obi", email: "emeka@test.com" }, categories: ["Gadgets & Accessories"] },
  { id: "v3", storeName: "Style Hub", status: "REJECTED", createdAt: new Date().toISOString(), user: { firstName: "Amaka", lastName: "Eze", email: "amaka@test.com" }, categories: ["Clothing & Accessories"] },
];

export default function AdminVendorsPage() {
  const queryClient = useQueryClient();
  const [actionModal, setActionModal] = useState<{ vendor: Vendor; action: "approve" | "reject" | "delete" } | null>(null);

  const { user } = useAuthStore();
  const isMock = user?.id === "mock-admin-001";
  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ["admin-vendors"],
    queryFn: async () => { const { data } = await apiClient.get("/vendors"); return data?.data ?? data ?? []; },
    enabled: !isMock,
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      if (isMock) { toast.success(`Vendor ${status.toLowerCase()}. (mock)`); setActionModal(null); return; }
      await apiClient.patch(`/vendors/admin/${id}/verify`, { status, ...(reason && { reason }) });
    },
    onSuccess: () => { toast.success("Vendor updated."); queryClient.invalidateQueries({ queryKey: ["admin-vendors"] }); setActionModal(null); },
    onError: () => toast.error("Action failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (isMock) { toast.success("Deletion request sent. (mock)"); setActionModal(null); return; }
      await apiClient.post(`/vendors/admin/${id}/deletion-request`, { reason });
    },
    onSuccess: () => { toast.success("Deletion request sent to super admin."); setActionModal(null); },
    onError: () => toast.error("Request failed."),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const all = (vendors ?? MOCK_VENDORS).filter((v) =>
    (!search || v.storeName.toLowerCase().includes(search.toLowerCase()) || `${v.user?.firstName} ${v.user?.lastName}`.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || v.status === statusFilter)
  );

  return (
    <AdminLayout campusName="Crawford University">
      <div className="flex items-center justify-between mb-[20px]">
        <div>
          <h1 className="font-satoshi font-bold text-[20px] md:text-[22px] text-[#151515]">Vendor Management</h1>
          <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{all.length} vendors on this campus</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-[8px] mb-[16px] flex-wrap">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors..."
          className="flex-1 min-w-[180px] rounded-[8px] border border-[#EAEAEA] bg-white px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" title="Filter by status"
          className="rounded-[8px] border border-[#EAEAEA] bg-white px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] focus:outline-none focus:border-[#2E7D32]">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden flex flex-col gap-[10px]">
        {isLoading ? [1,2,3].map((i) => <div key={i} className="bg-white rounded-[12px] border border-[#EAEAEA] h-[100px] animate-pulse" />) :
        all.length === 0 ? <p className="font-jakarta text-[14px] text-[#9B9B9B] text-center py-[40px]">No vendors found.</p> :
        all.map((v) => (
          <div key={v.id} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px]">
            <div className="flex items-start justify-between gap-[8px] mb-[10px]">
              <div>
                <p className="font-jakarta font-bold text-[14px] text-[#151515]">{v.storeName}</p>
                <p className="font-jakarta text-[12px] text-[#9B9B9B]">{v.user?.firstName} {v.user?.lastName}</p>
              </div>
              <StatusBadge status={v.status} />
            </div>
            <p className="font-jakarta text-[12px] text-[#545454] mb-[12px]">{(v.categories ?? []).join(", ") || "—"}</p>
            <p className="font-jakarta text-[11px] text-[#9B9B9B] mb-[12px]">
              {new Date(v.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <div className="flex flex-wrap gap-[8px]">
              <Link href={`/admin/vendors/${v.id}`} className="font-jakarta text-[12px] text-[#2E7D32] font-semibold underline">View</Link>
              {v.status === "PENDING" && <>
                <button type="button" title="Approve" onClick={() => setActionModal({ vendor: v, action: "approve" })}
                  className="font-jakarta text-[12px] text-[#2E7D32] font-semibold underline">Approve</button>
                <button type="button" title="Reject" onClick={() => setActionModal({ vendor: v, action: "reject" })}
                  className="font-jakarta text-[12px] text-[#E53935] font-semibold underline">Reject</button>
              </>}
              {v.status === "APPROVED" && (
                <button type="button" title="Request deletion" onClick={() => setActionModal({ vendor: v, action: "delete" })}
                  className="font-jakarta text-[12px] text-[#9B9B9B] font-semibold underline">Request Deletion</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <DataTable
          data={all as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          searchPlaceholder="Search vendors..."
          searchKeys={["storeName"] as never[]}
          filters={[{ key: "status", label: "Status", options: [{ value: "PENDING", label: "Pending" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }] }]}
          emptyMessage="No vendors found."
          columns={[
            { key: "storeName", label: "Store Name", render: (row) => {
              const v = row as unknown as Vendor;
              return (<div><p className="font-jakarta font-semibold text-[13px] text-[#151515]">{v.storeName}</p><p className="font-jakarta text-[11px] text-[#9B9B9B]">{v.user?.firstName} {v.user?.lastName}</p></div>);
            }},
            { key: "categories", label: "Categories", render: (row) => <span className="font-jakarta text-[12px] text-[#545454]">{((row as unknown as Vendor).categories ?? []).join(", ") || "—"}</span> },
            { key: "status", label: "Status", render: (row) => <StatusBadge status={(row as unknown as Vendor).status} /> },
            { key: "createdAt", label: "Registered", render: (row) => <span className="font-jakarta text-[12px] text-[#9B9B9B]">{new Date((row as unknown as Vendor).createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</span> },
            { key: "actions", label: "Actions", render: (row) => {
              const v = row as unknown as Vendor;
              return (
                <div className="flex items-center gap-[8px]">
                  <Link href={`/admin/vendors/${v.id}`} className="font-jakarta text-[12px] text-[#2E7D32] font-semibold hover:underline">View</Link>
                  {v.status === "PENDING" && <>
                    <button type="button" title="Approve" onClick={() => setActionModal({ vendor: v, action: "approve" })} className="font-jakarta text-[12px] text-[#2E7D32] font-semibold hover:underline">Approve</button>
                    <button type="button" title="Reject" onClick={() => setActionModal({ vendor: v, action: "reject" })} className="font-jakarta text-[12px] text-[#E53935] font-semibold hover:underline">Reject</button>
                  </>}
                  {v.status === "APPROVED" && <button type="button" title="Request deletion" onClick={() => setActionModal({ vendor: v, action: "delete" })} className="font-jakarta text-[12px] text-[#9B9B9B] font-semibold hover:underline">Request Deletion</button>}
                </div>
              );
            }},
          ]}
        />
      </div>

      {actionModal?.action === "approve" && (
        <ConfirmModal title={`Approve "${actionModal.vendor.storeName}"?`} message="This vendor will be approved and can start selling."
          confirmLabel="Approve" isLoading={verifyMutation.isPending}
          onClose={() => setActionModal(null)}
          onConfirm={() => verifyMutation.mutate({ id: actionModal.vendor.id, status: "APPROVED" })}
        />
      )}
      {actionModal?.action === "reject" && (
        <ConfirmModal title={`Reject "${actionModal.vendor.storeName}"?`} confirmLabel="Reject" variant="danger"
          requireReason reasonLabel="Rejection reason" reasonPlaceholder="Enter reason..."
          isLoading={verifyMutation.isPending}
          onClose={() => setActionModal(null)}
          onConfirm={(reason) => verifyMutation.mutate({ id: actionModal.vendor.id, status: "REJECTED", reason })}
        />
      )}
      {actionModal?.action === "delete" && (
        <ConfirmModal title={`Request deletion of "${actionModal.vendor.storeName}"?`}
          message="This will send a deletion request to the super admin." confirmLabel="Send Request" variant="danger"
          requireReason reasonLabel="Reason" reasonPlaceholder="Enter reason for deletion..."
          isLoading={deleteMutation.isPending}
          onClose={() => setActionModal(null)}
          onConfirm={(reason) => deleteMutation.mutate({ id: actionModal.vendor.id, reason: reason ?? "" })}
        />
      )}
    </AdminLayout>
  );
}
