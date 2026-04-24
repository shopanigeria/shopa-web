"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
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
const MOCK_ADMINS: Admin[] = [
  { id: "a1", firstName: "Admin", lastName: "User", email: "admin@crawford.edu", createdAt: new Date().toISOString() },
];

export default function UniversityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: campus } = useQuery<Campus>({
    queryKey: ["superadmin-campus", id],
    queryFn: async () => { const { data } = await apiClient.get(`/campuses/${id}`); return data?.data ?? data; },
  });
  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["superadmin-campus-vendors", id],
    queryFn: async () => { const { data } = await apiClient.get(`/vendors?campusId=${id}`); return data?.data ?? data ?? []; },
  });
  const { data: students } = useQuery<Student[]>({
    queryKey: ["superadmin-campus-students", id],
    queryFn: async () => { const { data } = await apiClient.get(`/users?campusId=${id}`); return data?.data ?? data ?? []; },
  });

  const c = campus ?? MOCK_CAMPUS;
  const vs = vendors ?? MOCK_VENDORS;
  const ss = students ?? MOCK_STUDENTS;

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
          <Link href="/superadmin/admins"
            className="flex items-center gap-[6px] bg-[#2E7D32] text-white font-jakarta text-[12px] font-semibold px-[14px] h-[36px] rounded-[8px] hover:bg-[#1D5620] transition-colors">
            <Plus size={14} /> Add Admin
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[12px] mb-[28px]">
        {[
          { label: "Vendors", value: vs.length },
          { label: "Students", value: ss.length },
          { label: "Admins", value: MOCK_ADMINS.length },
          { label: "Status", value: c.isActive ? "Active" : "Inactive" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px]">
            <p className="font-satoshi font-bold text-[20px] text-[#2E7D32]">{value}</p>
            <p className="font-jakarta text-[12px] text-[#9B9B9B] mt-[2px]">{label}</p>
          </div>
        ))}
      </div>

      {/* Admins */}
      <div className="bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden mb-[24px]">
        <div className="px-[20px] py-[14px] border-b border-[#EAEAEA]">
          <p className="font-satoshi font-bold text-[14px] text-[#151515]">Campus Admins</p>
        </div>
        <div className="divide-y divide-[#EAEAEA]">
          {MOCK_ADMINS.map((a) => (
            <div key={a.id} className="px-[20px] py-[12px] flex items-center justify-between">
              <div>
                <p className="font-jakarta font-semibold text-[13px] text-[#151515]">{a.firstName} {a.lastName}</p>
                <p className="font-jakarta text-[11px] text-[#9B9B9B]">{a.email}</p>
              </div>
              <StatusBadge status="ACTIVE" />
            </div>
          ))}
        </div>
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

    </SuperAdminLayout>
  );
}
