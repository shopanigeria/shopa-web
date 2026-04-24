"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, Users, MessageSquare, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

interface VendorApp {
  id: string;
  storeName: string;
  status: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
}
interface Dispute {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  order?: { orderNumber?: string };
  user?: { firstName: string; lastName: string };
}
interface Analytics {
  totalVendors: number;
  pendingVendors: number;
  totalStudents: number;
  openDisputes: number;
}

const MOCK_ANALYTICS: Analytics = { totalVendors: 24, pendingVendors: 5, totalStudents: 312, openDisputes: 8 };
const MOCK_APPS: VendorApp[] = [
  { id: "v1", storeName: "Fresh Provisions", status: "PENDING", createdAt: new Date().toISOString(), user: { firstName: "Tolu", lastName: "Adeyemi", email: "tolu@crawford.edu" } },
  { id: "v2", storeName: "Campus Gadgets", status: "PENDING", createdAt: new Date().toISOString(), user: { firstName: "Emeka", lastName: "Obi", email: "emeka@crawford.edu" } },
];
const MOCK_DISPUTES: Dispute[] = [
  { id: "d1", status: "OPEN", reason: "Item not delivered", createdAt: new Date().toISOString(), order: { orderNumber: "12345678" }, user: { firstName: "Sade", lastName: "Bello" } },
  { id: "d2", status: "UNDER_REVIEW", reason: "Wrong item sent", createdAt: new Date().toISOString(), order: { orderNumber: "87654321" }, user: { firstName: "Kelvin", lastName: "Osei" } },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [rejectModal, setRejectModal] = useState<VendorApp | null>(null);

  const isMock = user?.id === "mock-admin-001";

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["admin-analytics"],
    queryFn: async () => { const { data } = await apiClient.get("/analytics/admin"); return data?.data ?? data; },
    enabled: !isMock,
  });
  const { data: pendingVendors } = useQuery<VendorApp[]>({
    queryKey: ["admin-pending-vendors"],
    queryFn: async () => { const { data } = await apiClient.get("/vendors/admin/pending"); return data?.data ?? data ?? []; },
    enabled: !isMock,
  });
  const { data: disputes } = useQuery<Dispute[]>({
    queryKey: ["admin-disputes"],
    queryFn: async () => { const { data } = await apiClient.get("/disputes"); return data?.data ?? data ?? []; },
    enabled: !isMock,
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      if (isMock) { toast.success(`Vendor ${status.toLowerCase()}. (mock)`); setRejectModal(null); return; }
      await apiClient.patch(`/vendors/admin/${id}/verify`, { status, ...(reason && { reason }) });
    },
    onSuccess: () => {
      toast.success("Vendor updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-vendors"] });
      setRejectModal(null);
    },
    onError: () => toast.error("Action failed."),
  });

  const stats = analytics ?? MOCK_ANALYTICS;
  const apps = (pendingVendors ?? MOCK_APPS).slice(0, 5);
  const recentDisputes = (disputes ?? MOCK_DISPUTES).slice(0, 5);
  const adminName = user ? `${user.firstName} ${user.lastName}` : "Admin";

  return (
    <AdminLayout campusName="Crawford University">
      <div className="mb-[24px]">
        <h1 className="font-satoshi font-bold text-[22px] text-[#151515]">Welcome back, {adminName}!</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">Crawford University Campus Admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[12px] mb-[32px]">
        <StatsCard label="Total Vendors" value={stats.totalVendors} icon={Store} iconBg="bg-[#D8FFDA]" iconColor="text-[#2E7D32]" />
        <StatsCard label="Pending Applications" value={stats.pendingVendors} icon={Store} iconBg="bg-[#FFF3E0]" iconColor="text-[#FF9800]" />
        <StatsCard label="Active Students" value={stats.totalStudents} icon={Users} iconBg="bg-[#E3F2FD]" iconColor="text-[#1565C0]" />
        <StatsCard label="Open Disputes" value={stats.openDisputes} icon={MessageSquare} iconBg="bg-[#FFEBEE]" iconColor="text-[#E53935]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
        {/* Pending vendor applications */}
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden">
          <div className="flex items-center justify-between px-[20px] py-[16px] border-b border-[#EAEAEA]">
            <p className="font-satoshi font-bold text-[15px] text-[#151515]">Pending Applications</p>
            <Link href="/admin/vendors" className="font-jakarta text-[12px] text-[#2E7D32] font-semibold">See all</Link>
          </div>
          {apps.length === 0 ? (
            <p className="px-[20px] py-[24px] font-jakarta text-[13px] text-[#9B9B9B]">No pending applications.</p>
          ) : (
            <div className="divide-y divide-[#EAEAEA]">
              {apps.map((app) => (
                <div key={app.id} className="px-[20px] py-[14px] flex items-center justify-between gap-[12px]">
                  <div className="min-w-0 flex-1">
                    <p className="font-jakarta font-semibold text-[13px] text-[#151515] truncate">{app.storeName}</p>
                    <p className="font-jakarta text-[11px] text-[#9B9B9B]">{app.user?.firstName} {app.user?.lastName} · {formatDate(app.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-[6px] shrink-0">
                    <button type="button" title="Approve vendor" aria-label="Approve vendor" onClick={() => verifyMutation.mutate({ id: app.id, status: "APPROVED" })}
                      className="w-[30px] h-[30px] rounded-full bg-[#D8FFDA] flex items-center justify-center hover:bg-[#2E7D32] group transition-colors">
                      <Check size={14} className="text-[#2E7D32] group-hover:text-white" />
                    </button>
                    <button type="button" title="Reject vendor" aria-label="Reject vendor" onClick={() => setRejectModal(app)}
                      className="w-[30px] h-[30px] rounded-full bg-[#FFEBEE] flex items-center justify-center hover:bg-[#E53935] group transition-colors">
                      <X size={14} className="text-[#E53935] group-hover:text-white" />
                    </button>
                    <Link href={`/admin/vendors/${app.id}`} className="font-jakarta text-[11px] text-[#2E7D32] font-semibold underline">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent disputes */}
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden">
          <div className="flex items-center justify-between px-[20px] py-[16px] border-b border-[#EAEAEA]">
            <p className="font-satoshi font-bold text-[15px] text-[#151515]">Recent Disputes</p>
            <Link href="/admin/disputes" className="font-jakarta text-[12px] text-[#2E7D32] font-semibold">See all</Link>
          </div>
          {recentDisputes.length === 0 ? (
            <p className="px-[20px] py-[24px] font-jakarta text-[13px] text-[#9B9B9B]">No disputes.</p>
          ) : (
            <div className="divide-y divide-[#EAEAEA]">
              {recentDisputes.map((d) => (
                <Link key={d.id} href={`/admin/disputes/${d.id}`}
                  className="px-[20px] py-[14px] flex items-center justify-between gap-[12px] hover:bg-[#F7FFF8] transition-colors flex">
                  <div className="min-w-0 flex-1">
                    <p className="font-jakarta font-semibold text-[13px] text-[#151515]">
                      Order #{(d.order?.orderNumber ?? d.id).slice(-8).toUpperCase()}
                    </p>
                    <p className="font-jakarta text-[11px] text-[#9B9B9B] truncate">{d.reason}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {rejectModal && (
        <ConfirmModal
          title={`Reject "${rejectModal.storeName}"?`}
          message="This vendor application will be rejected."
          confirmLabel="Reject" variant="danger"
          requireReason reasonLabel="Reason for rejection" reasonPlaceholder="Enter rejection reason..."
          isLoading={verifyMutation.isPending}
          onClose={() => setRejectModal(null)}
          onConfirm={(reason) => verifyMutation.mutate({ id: rejectModal.id, status: "REJECTED", reason })}
        />
      )}
    </AdminLayout>
  );
}
