"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Eye, EyeOff, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";

interface Campus {
  id: string;
  name: string;
  code?: string;
  location?: string;
  isActive: boolean;
}
interface Vendor { id: string; storeName: string; status: string; createdAt: string; user?: { firstName: string; lastName: string } }
interface Student { id: string; firstName: string; lastName: string; email: string; isVerified: boolean; createdAt: string }
interface Admin { id: string; firstName: string; lastName: string; email: string; createdAt: string }

const MOCK_CAMPUS: Campus = { id: "c1", name: "Crawford University", code: "CRAWFORD", location: "Igbesa, Ogun State", isActive: true };
const MOCK_VENDORS: Vendor[] = [
  { id: "v1", storeName: "Fresh Provisions", status: "APPROVED", createdAt: new Date().toISOString(), user: { firstName: "Tolu", lastName: "Adeyemi" } },
];
const MOCK_STUDENTS: Student[] = [
  { id: "s1", firstName: "Sade", lastName: "Bello", email: "sade@crawford.edu", isVerified: true, createdAt: new Date().toISOString() },
];

const inputClass = "w-full rounded-[8px] border border-[#EAEAEA] bg-[#F7FFF8] px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32]";

// ── Create Admin Modal ────────────────────────────────────────────────────────

function CreateAdminModal({
  campusId,
  campusName,
  onClose,
  onCreated,
}: {
  campusId: string;
  campusName: string;
  onClose: () => void;
  onCreated: (admin: Admin) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      // apiClient automatically attaches the Authorization Bearer token
      const { data } = await apiClient.post("/auth/admin/create", {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
        password,
        campusId,           // taken from the page URL param
      });
      return data?.data ?? data;
    },
    onSuccess: (created) => {
      toast.success(`Admin account created for ${firstName} ${lastName}.`);
      onCreated(created as Admin);
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(". ") : (msg ?? "Failed to create admin account."));
    },
  });

  const canSubmit =
    firstName.trim() && lastName.trim() && email.trim() && password.length >= 8 && !mutation.isPending;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[28px] pt-[28px] pb-[28px] w-full max-w-[460px] relative">
          {/* Close */}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute top-[16px] right-[16px]"
          >
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>

          <p className="font-satoshi font-bold text-[17px] text-[#151515] mb-[4px]">Create Admin Account</p>
          <p className="font-jakarta text-[12px] text-[#9B9B9B] mb-[20px]">
            Campus: <span className="font-semibold text-[#151515]">{campusName}</span>
          </p>

          <div className="flex flex-col gap-[14px] mb-[20px]">
            <div className="grid grid-cols-2 gap-[10px]">
              <div>
                <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">
                  First Name <span className="text-[#E53935]">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className={inputClass}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">
                  Last Name <span className="text-[#E53935]">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className={inputClass}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">
                Email Address <span className="text-[#E53935]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@university.edu"
                className={inputClass}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">
                Password <span className="text-[#E53935]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className={`${inputClass} pr-[40px]`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#545454]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && password.length < 8 && (
                <p className="font-jakarta text-[11px] text-[#E53935] mt-[4px]">
                  Password must be at least 8 characters.
                </p>
              )}
            </div>

            <div className="bg-[#F7FFF8] border border-[#D8FFDA] rounded-[8px] px-[14px] py-[10px]">
              <p className="font-jakarta text-[12px] text-[#2E7D32] leading-[1.6]">
                <span className="font-bold">Share these credentials securely.</span>{" "}
                The admin logs in at{" "}
                <span className="font-semibold">uadmin.shopshopa.com.ng/login</span>{" "}
                using the email and password you set here.
              </p>
            </div>
          </div>

          <div className="flex gap-[10px]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[44px] rounded-[8px] border border-[#EAEAEA] font-jakarta text-[13px] font-semibold text-[#545454] hover:bg-[#F7FFF8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={!canSubmit}
              className="flex-1 h-[44px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[13px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors"
            >
              {mutation.isPending ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UniversityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  const { data: campus } = useQuery<Campus>({
    queryKey: ["superadmin-campus", id],
    queryFn: async () => { const { data } = await apiClient.get(`/campuses/${id}`); return data?.data ?? data; },
  });
  const { data: admins, refetch: refetchAdmins } = useQuery<Admin[]>({
    queryKey: ["superadmin-campus-admins", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/users?role=admin&campusId=${id}`);
      return data?.data ?? data ?? [];
    },
  });
  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["superadmin-campus-vendors", id],
    queryFn: async () => { const { data } = await apiClient.get(`/vendors?campusId=${id}`); return data?.data ?? data ?? []; },
  });
  const { data: students } = useQuery<Student[]>({
    queryKey: ["superadmin-campus-students", id],
    queryFn: async () => { const { data } = await apiClient.get(`/users?campusId=${id}`); return data?.data ?? data ?? []; },
  });

  const c   = campus   ?? MOCK_CAMPUS;
  const vs  = vendors  ?? MOCK_VENDORS;
  const ss  = students ?? MOCK_STUDENTS;
  const ads = admins   ?? [];

  function handleAdminCreated() {
    refetchAdmins();
    queryClient.invalidateQueries({ queryKey: ["superadmin-campus-admins", id] });
  }

  return (
    <SuperAdminLayout>
      <button type="button" onClick={() => router.back()} className="flex items-center gap-[6px] text-[#2E7D32] mb-[20px] hover:opacity-70 transition-opacity">
        <ChevronLeft size={18} /> <span className="font-jakarta text-[13px] font-semibold">Back to Universities</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-[24px] flex-wrap gap-[12px]">
        <div>
          <h1 className="font-satoshi font-bold text-[22px] text-[#151515]">{c.name}</h1>
          <p className="font-jakarta text-[13px] text-[#9B9B9B]">{c.location} {c.code && `· ${c.code}`}</p>
        </div>
        <div className="flex items-center gap-[10px]">
          <StatusBadge status={c.isActive ? "ACTIVE" : "INACTIVE"} />
          <button
            type="button"
            onClick={() => setShowCreateAdmin(true)}
            className="flex items-center gap-[6px] bg-[#2E7D32] text-white font-jakarta text-[12px] font-semibold px-[14px] h-[36px] rounded-[8px] hover:bg-[#1D5620] transition-colors"
          >
            <Plus size={14} /> Add Admin
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[12px] mb-[28px]">
        {[
          { label: "Vendors",  value: vs.length },
          { label: "Students", value: ss.length },
          { label: "Admins",   value: ads.length },
          { label: "Status",   value: c.isActive ? "Active" : "Inactive" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px]">
            <p className="font-satoshi font-bold text-[20px] text-[#2E7D32]">{value}</p>
            <p className="font-jakarta text-[12px] text-[#9B9B9B] mt-[2px]">{label}</p>
          </div>
        ))}
      </div>

      {/* Campus Admins */}
      <div className="bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden mb-[24px]">
        <div className="flex items-center justify-between px-[20px] py-[14px] border-b border-[#EAEAEA]">
          <p className="font-satoshi font-bold text-[14px] text-[#151515]">Campus Admins ({ads.length})</p>
          <button
            type="button"
            onClick={() => setShowCreateAdmin(true)}
            className="font-jakarta text-[12px] font-semibold text-[#2E7D32] hover:underline flex items-center gap-[4px]"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        {ads.length === 0 ? (
          <div className="px-[20px] py-[24px] text-center">
            <p className="font-jakarta text-[13px] text-[#9B9B9B]">No admins yet. Add the first admin for this campus.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAEAEA]">
            {ads.map((a) => (
              <div key={a.id} className="px-[20px] py-[12px] flex items-center justify-between">
                <div>
                  <p className="font-jakarta font-semibold text-[13px] text-[#151515]">{a.firstName} {a.lastName}</p>
                  <p className="font-jakarta text-[11px] text-[#9B9B9B]">{a.email}</p>
                </div>
                <StatusBadge status="ACTIVE" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vendors */}
      <div className="mb-[24px]">
        <p className="font-satoshi font-bold text-[16px] text-[#151515] mb-[12px]">Vendors ({vs.length})</p>
        <DataTable
          data={vs as unknown as Record<string, unknown>[]}
          searchPlaceholder="Search vendors..."
          searchKeys={["storeName"] as never[]}
          emptyMessage="No vendors."
          columns={[
            { key: "storeName", label: "Store Name", render: (r) => <span className="font-jakarta font-semibold text-[13px] text-[#151515]">{(r as unknown as Vendor).storeName}</span> },
            { key: "owner", label: "Owner", render: (r) => { const v = r as unknown as Vendor; return <span className="font-jakarta text-[13px] text-[#333333]">{v.user ? `${v.user.firstName} ${v.user.lastName}` : "—"}</span>; } },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={(r as unknown as Vendor).status} /> },
          ]}
        />
      </div>

      {/* Students */}
      <div>
        <p className="font-satoshi font-bold text-[16px] text-[#151515] mb-[12px]">Students ({ss.length})</p>
        <DataTable
          data={ss as unknown as Record<string, unknown>[]}
          searchPlaceholder="Search students..."
          searchKeys={["firstName", "lastName", "email"] as never[]}
          emptyMessage="No students."
          columns={[
            { key: "name", label: "Name", render: (r) => { const s = r as unknown as Student; return <span className="font-jakarta font-semibold text-[13px] text-[#151515]">{s.firstName} {s.lastName}</span>; } },
            { key: "email", label: "Email", render: (r) => <span className="font-jakarta text-[13px] text-[#333333]">{(r as unknown as Student).email}</span> },
            { key: "isVerified", label: "Status", render: (r) => <StatusBadge status={(r as unknown as Student).isVerified ? "VERIFIED" : "UNVERIFIED"} /> },
          ]}
        />
      </div>

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <CreateAdminModal
          campusId={id}
          campusName={c.name}
          onClose={() => setShowCreateAdmin(false)}
          onCreated={handleAdminCreated}
        />
      )}
    </SuperAdminLayout>
  );
}
