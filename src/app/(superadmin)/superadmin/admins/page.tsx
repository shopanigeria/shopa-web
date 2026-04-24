"use client";

import { useState } from "react";
import { Plus, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  campus?: { id: string; name: string };
  campusId?: string;
  isActive: boolean;
  createdAt: string;
}

interface Campus {
  id: string;
  name: string;
}

const MOCK_ADMINS: AdminUser[] = [
  { id: "a1", firstName: "Chidi", lastName: "Nwosu", email: "chidi@crawford.edu", campus: { id: "c1", name: "Crawford University" }, isActive: true, createdAt: new Date().toISOString() },
];

const MOCK_CAMPUSES: Campus[] = [
  { id: "69345327-e2bb-4f39-935d-80feefcf16a8", name: "Crawford University" },
];

const inputClass = "w-full rounded-[8px] border border-[#EAEAEA] bg-[#F7FFF8] px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32]";

export default function AdminsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isMock = user?.id === "mock-superadmin-001";

  const [showCreate, setShowCreate] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [campusId, setCampusId] = useState("");

  function resetForm() {
    setFirstName(""); setLastName(""); setEmail("");
    setPassword(""); setCampusId(""); setShowPassword(false);
  }

  const { data: admins, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["superadmin-admins"],
    queryFn: async () => { const { data } = await apiClient.get("/users?role=admin"); return data?.data ?? data ?? []; },
    enabled: !isMock,
  });

  const { data: campuses } = useQuery<Campus[]>({
    queryKey: ["campuses"],
    queryFn: async () => { const { data } = await apiClient.get("/campuses"); return data?.data ?? data ?? []; },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (isMock) {
        toast.success("Admin account created. (mock)");
        setShowCreate(false);
        resetForm();
        return;
      }
      await apiClient.post("/auth/register", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role: "admin",
        campusId,
      });
    },
    onSuccess: () => {
      toast.success(`Admin account created for ${firstName} ${lastName}. They can now log in.`);
      queryClient.invalidateQueries({ queryKey: ["superadmin-admins"] });
      setShowCreate(false);
      resetForm();
    },
    onError: () => toast.error("Failed to create admin account. The email may already be in use."),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isMock) { toast.success(`Admin ${isActive ? "suspended" : "reactivated"}. (mock)`); setToggleTarget(null); return; }
      await apiClient.patch(`/users/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      toast.success("Admin status updated.");
      queryClient.invalidateQueries({ queryKey: ["superadmin-admins"] });
      setToggleTarget(null);
    },
    onError: () => toast.error("Failed to update."),
  });

  const all = admins ?? MOCK_ADMINS;
  const campusList = campuses ?? MOCK_CAMPUSES;
  const canCreate = firstName.trim() && lastName.trim() && email.trim() && password.length >= 8 && campusId;

  return (
    <SuperAdminLayout>
      <div className="flex items-center justify-between mb-[28px]">
        <div>
          <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">Admin Management</h1>
          <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{all.length} campus admins</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)}
          className="flex items-center gap-[8px] bg-[#2E7D32] text-white font-jakarta text-[13px] font-semibold px-[16px] h-[40px] rounded-[8px] hover:bg-[#1D5620] transition-colors">
          <Plus size={16} /> Create Admin
        </button>
      </div>

      <div className="bg-[#FFF9C4] border border-[#F9A825]/40 rounded-[10px] px-[16px] py-[12px] mb-[24px]">
        <p className="font-jakarta text-[12px] font-bold text-[#F9A825] mb-[2px]">University admins cannot self-register</p>
        <p className="font-jakarta text-[12px] text-[#545454] leading-[1.5]">
          Only you (super admin) can create admin accounts. Each admin is assigned to a specific campus.
          After you create their account, they log in at <span className="font-semibold text-[#2E7D32]">/login</span> using the credentials you set.
        </p>
      </div>

      <DataTable
        data={all as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        searchPlaceholder="Search admins..."
        searchKeys={["firstName", "lastName", "email"] as never[]}
        emptyMessage="No admins found. Create one using the button above."
        columns={[
          { key: "name", label: "Name", render: (r) => {
            const a = r as unknown as AdminUser;
            return (
              <div>
                <p className="font-jakarta font-semibold text-[13px] text-[#151515]">{a.firstName} {a.lastName}</p>
                <p className="font-jakarta text-[11px] text-[#9B9B9B]">{a.email}</p>
              </div>
            );
          }},
          { key: "campus", label: "Campus", render: (r) =>
            <span className="font-jakarta text-[13px] text-[#333333]">{(r as unknown as AdminUser).campus?.name ?? "—"}</span>
          },
          { key: "isActive", label: "Status", render: (r) =>
            <StatusBadge status={(r as unknown as AdminUser).isActive ? "ACTIVE" : "SUSPENDED"} />
          },
          { key: "createdAt", label: "Created", render: (r) =>
            <span className="font-jakarta text-[12px] text-[#9B9B9B]">
              {new Date((r as unknown as AdminUser).createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          },
          { key: "actions", label: "Actions", render: (r) => {
            const a = r as unknown as AdminUser;
            return (
              <button type="button" title={a.isActive ? "Suspend admin" : "Reactivate admin"}
                onClick={() => setToggleTarget(a)}
                className={cn("font-jakarta text-[12px] font-semibold hover:underline", a.isActive ? "text-[#E53935]" : "text-[#2E7D32]")}>
                {a.isActive ? "Suspend" : "Reactivate"}
              </button>
            );
          }},
        ]}
      />

      {/* Create admin modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => { setShowCreate(false); resetForm(); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
            <div className="bg-white rounded-[16px] px-[28px] pt-[28px] pb-[28px] w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
              <p className="font-satoshi font-bold text-[18px] text-[#151515] mb-[4px]">Create Admin Account</p>
              <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[24px]">
                Set up login credentials for the university admin. They will use these to access their campus dashboard.
              </p>

              <div className="flex flex-col gap-[16px]">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-[12px]">
                  <div>
                    <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">First Name <span className="text-[#E53935]">*</span></label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputClass} />
                  </div>
                  <div>
                    <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">Last Name <span className="text-[#E53935]">*</span></label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={inputClass} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">Email Address <span className="text-[#E53935]">*</span></label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@university.edu" className={inputClass} />
                </div>

                {/* Password */}
                <div>
                  <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">Password <span className="text-[#E53935]">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className={cn(inputClass, "pr-[40px]")}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility"
                      className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#545454]">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {password && password.length < 8 && (
                    <p className="font-jakarta text-[11px] text-[#E53935] mt-[4px]">Password must be at least 8 characters.</p>
                  )}
                </div>

                {/* Campus */}
                <div>
                  <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">Assign to Campus <span className="text-[#E53935]">*</span></label>
                  <select value={campusId} onChange={(e) => setCampusId(e.target.value)} aria-label="Select campus" title="Select campus"
                    className={cn(inputClass, "appearance-none")}>
                    <option value="">Select a campus...</option>
                    {campusList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Info note */}
                <div className="bg-[#F7FFF8] border border-[#D8FFDA] rounded-[8px] px-[14px] py-[10px]">
                  <p className="font-jakarta text-[12px] text-[#2E7D32] leading-[1.6]">
                    <span className="font-bold">Share these credentials securely</span> with the admin.
                    They will log in at <span className="font-semibold">/login</span> using the email and password you set here.
                    They cannot change their own password — only you can update it.
                  </p>
                </div>
              </div>

              <div className="flex gap-[10px] mt-[24px]">
                <button type="button" onClick={() => { setShowCreate(false); resetForm(); }}
                  className="flex-1 h-[44px] rounded-[8px] border border-[#EAEAEA] font-jakarta text-[13px] font-semibold text-[#545454] hover:bg-[#F7FFF8] transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={() => createMutation.mutate()}
                  disabled={!canCreate || createMutation.isPending}
                  className="flex-1 h-[44px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[13px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors">
                  {createMutation.isPending ? "Creating..." : "Create Admin Account"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Suspend / reactivate confirm */}
      {toggleTarget && (
        <ConfirmModal
          title={`${toggleTarget.isActive ? "Suspend" : "Reactivate"} ${toggleTarget.firstName} ${toggleTarget.lastName}?`}
          message={toggleTarget.isActive
            ? "This admin will lose access to their campus dashboard immediately."
            : "This admin will regain access to their campus dashboard."}
          confirmLabel={toggleTarget.isActive ? "Suspend" : "Reactivate"}
          variant={toggleTarget.isActive ? "danger" : "primary"}
          isLoading={toggleMutation.isPending}
          onClose={() => setToggleTarget(null)}
          onConfirm={() => toggleMutation.mutate({ id: toggleTarget.id, isActive: toggleTarget.isActive })}
        />
      )}
    </SuperAdminLayout>
  );
}
