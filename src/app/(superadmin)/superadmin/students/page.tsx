"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { useState } from "react";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  isActive?: boolean;
  createdAt: string;
  campus?: { name: string };
}


export default function SuperAdminStudentsPage() {
  const queryClient = useQueryClient();
  const [actionModal, setActionModal] = useState<{ student: Student; action: "suspend" | "reactivate" } | null>(null);

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["superadmin-students"],
    queryFn: async () => {
      // /users/pending-verifications returns all registered students
      const { data } = await apiClient.get("/users/pending-verifications");
      return data?.data ?? data ?? [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiClient.patch(`/users/${id}`, { isActive });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? "Student reactivated." : "Student suspended.");
      queryClient.invalidateQueries({ queryKey: ["superadmin-students"] });
      setActionModal(null);
    },
    onError: () => toast.error("Action failed."),
  });

  const all = students ?? [];

  return (
    <SuperAdminLayout>
      <div className="mb-[28px]">
        <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">All Students</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{all.length} students platform-wide</p>
      </div>

      <DataTable
        data={all as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchPlaceholder="Search by name or email..."
        searchKeys={["firstName", "lastName", "email"] as never[]}
        emptyMessage="No students found."
        columns={[
          { key: "name", label: "Name", render: (r) => {
            const s = r as unknown as Student;
            return <div><p className="font-jakarta font-semibold text-[13px] text-[#151515]">{s.firstName} {s.lastName}</p><p className="font-jakarta text-[11px] text-[#9B9B9B]">{s.email}</p></div>;
          }},
          { key: "campus", label: "Campus", render: (r) => <span className="font-jakarta text-[13px] text-[#333333]">{(r as unknown as Student).campus?.name ?? "—"}</span> },
          { key: "phone", label: "Phone", render: (r) => <span className="font-jakarta text-[13px] text-[#333333]">{(r as unknown as Student).phone ?? "—"}</span> },
          { key: "isVerified", label: "Verified", render: (r) => <StatusBadge status={(r as unknown as Student).isVerified ? "VERIFIED" : "UNVERIFIED"} /> },
          { key: "isActive", label: "Status", render: (r) => <StatusBadge status={(r as unknown as Student).isActive !== false ? "ACTIVE" : "SUSPENDED"} /> },
          { key: "createdAt", label: "Joined", render: (r) => <span className="font-jakarta text-[12px] text-[#9B9B9B]">{new Date((r as unknown as Student).createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</span> },
          { key: "actions", label: "", render: (r) => {
            const s = r as unknown as Student;
            const isActive = s.isActive !== false;
            return (
              <button type="button" title={isActive ? "Suspend student" : "Reactivate student"}
                onClick={() => setActionModal({ student: s, action: isActive ? "suspend" : "reactivate" })}
                className={`font-jakarta text-[12px] font-semibold hover:underline ${isActive ? "text-[#E53935]" : "text-[#2E7D32]"}`}>
                {isActive ? "Suspend" : "Reactivate"}
              </button>
            );
          }},
        ]}
      />

      {actionModal && (
        <ConfirmModal
          title={`${actionModal.action === "suspend" ? "Suspend" : "Reactivate"} ${actionModal.student.firstName} ${actionModal.student.lastName}?`}
          message={actionModal.action === "suspend" ? "This student will lose access to the platform." : "This student will regain full platform access."}
          confirmLabel={actionModal.action === "suspend" ? "Suspend" : "Reactivate"}
          variant={actionModal.action === "suspend" ? "danger" : "primary"}
          isLoading={toggleMutation.isPending}
          onClose={() => setActionModal(null)}
          onConfirm={() => toggleMutation.mutate({ id: actionModal.student.id, isActive: actionModal.action === "reactivate" })}
        />
      )}
    </SuperAdminLayout>
  );
}
