"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable } from "@/components/admin/DataTable";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
}

const MOCK_STUDENTS: Student[] = [
  { id: "s1", firstName: "Sade", lastName: "Bello", email: "sade@crawford.edu", phone: "08011111111", isVerified: true, createdAt: new Date().toISOString() },
  { id: "s2", firstName: "Kelvin", lastName: "Osei", email: "kelvin@crawford.edu", phone: "08022222222", isVerified: false, createdAt: new Date().toISOString() },
  { id: "s3", firstName: "Ngozi", lastName: "Eze", email: "ngozi@crawford.edu", phone: "08033333333", isVerified: true, createdAt: new Date().toISOString() },
];

export default function AdminStudentsPage() {
  const { user } = useAuthStore();
  const isMock = user?.id === "mock-admin-001";
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["admin-students"],
    queryFn: async () => { const { data } = await apiClient.get("/users/pending-verifications"); return data?.data ?? data ?? []; },
    enabled: !isMock,
  });

  const [search, setSearch] = useState("");
  const all = (students ?? MOCK_STUDENTS).filter((s) =>
    !search ||
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout campusName="Crawford University">
      <div className="mb-[20px]">
        <h1 className="font-satoshi font-bold text-[20px] md:text-[22px] text-[#151515]">Students</h1>
        <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{all.length} students on this campus</p>
      </div>

      {/* Search */}
      <div className="mb-[16px]">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="w-full max-w-[400px] rounded-[8px] border border-[#EAEAEA] bg-white px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32]" />
      </div>

      {/* Mobile card list */}
      <div className="md:hidden flex flex-col gap-[10px]">
        {isLoading ? [1,2,3].map((i) => <div key={i} className="bg-white rounded-[12px] border border-[#EAEAEA] h-[80px] animate-pulse" />) :
        all.length === 0 ? <p className="font-jakarta text-[14px] text-[#9B9B9B] text-center py-[40px]">No students found.</p> :
        all.map((s) => (
          <div key={s.id} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[14px] flex items-center justify-between gap-[12px]">
            <div className="min-w-0">
              <p className="font-jakarta font-bold text-[13px] text-[#151515] truncate">{s.firstName} {s.lastName}</p>
              <p className="font-jakarta text-[11px] text-[#9B9B9B] truncate">{s.email}</p>
              <p className="font-jakarta text-[11px] text-[#C2C2C2] mt-[2px]">
                Joined {new Date(s.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <StatusBadge status={s.isVerified ? "VERIFIED" : "UNVERIFIED"} />
          </div>
        ))}
      </div>

      {/* Desktop table — no phone column */}
      <div className="hidden md:block">
        <DataTable
          data={all as unknown as Record<string, unknown>[]}
          isLoading={isLoading}
          searchPlaceholder="Search by name or email..."
          searchKeys={["firstName", "lastName", "email"] as never[]}
          emptyMessage="No students found."
          columns={[
            { key: "name", label: "Name", render: (row) => {
              const s = row as unknown as Student;
              return (<div><p className="font-jakarta font-semibold text-[13px] text-[#151515]">{s.firstName} {s.lastName}</p><p className="font-jakarta text-[11px] text-[#9B9B9B]">{s.email}</p></div>);
            }},
            { key: "isVerified", label: "Status", render: (row) => <StatusBadge status={(row as unknown as Student).isVerified ? "VERIFIED" : "UNVERIFIED"} /> },
            { key: "createdAt", label: "Joined", render: (row) => <span className="font-jakarta text-[12px] text-[#9B9B9B]">{new Date((row as unknown as Student).createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</span> },
          ]}
        />
      </div>
    </AdminLayout>
  );
}
