"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { SuperAdminLayout } from "@/components/admin/SuperAdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

interface Campus {
  id: string;
  name: string;
  code?: string;
  location?: string;
  isActive: boolean;
  _count?: { vendors: number; students: number };
}

const MOCK_CAMPUSES: Campus[] = [
  { id: "c1", name: "Crawford University", code: "CRAWFORD", location: "Igbesa, Ogun State", isActive: true, _count: { vendors: 24, students: 312 } },
];

export default function UniversitiesPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [toggleModal, setToggleModal] = useState<Campus | null>(null);

  const { data: campuses, isLoading } = useQuery<Campus[]>({
    queryKey: ["superadmin-campuses"],
    queryFn: async () => { const { data } = await apiClient.get("/campuses"); return data?.data ?? data ?? []; },
  });

  const createMutation = useMutation({
    mutationFn: async () => { await apiClient.post("/campuses", { name: newName, code: newCode, location: newLocation }); },
    onSuccess: () => { toast.success("University added."); queryClient.invalidateQueries({ queryKey: ["superadmin-campuses"] }); setShowAdd(false); setNewName(""); setNewCode(""); setNewLocation(""); },
    onError: () => toast.error("Failed to add university."),
  });

  const toggleMutation = useMutation({
    mutationFn: async (campus: Campus) => { await apiClient.patch(`/campuses/${campus.id}`, { isActive: !campus.isActive }); },
    onSuccess: () => { toast.success("Status updated."); queryClient.invalidateQueries({ queryKey: ["superadmin-campuses"] }); setToggleModal(null); },
    onError: () => toast.error("Failed to update status."),
  });

  const all = campuses ?? MOCK_CAMPUSES;

  const inputClass = "w-full rounded-[8px] border border-[#EAEAEA] bg-[#F7FFF8] px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32]";

  return (
    <SuperAdminLayout>
      <div className="flex items-center justify-between mb-[28px]">
        <div>
          <h1 className="font-satoshi font-bold text-[24px] text-[#151515]">Universities</h1>
          <p className="font-jakarta text-[13px] text-[#9B9B9B] mt-[2px]">{all.length} registered</p>
        </div>
        <button type="button" onClick={() => setShowAdd(true)}
          className="flex items-center gap-[8px] bg-[#2E7D32] text-white font-jakarta text-[13px] font-semibold px-[16px] h-[40px] rounded-[8px] hover:bg-[#1D5620] transition-colors">
          <Plus size={16} /> Add University
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {[1, 2].map((i) => <div key={i} className="bg-white rounded-[12px] border border-[#EAEAEA] h-[140px] animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {all.map((campus) => (
            <div key={campus.id} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[20px]">
              <div className="flex items-start justify-between mb-[12px]">
                <div>
                  <p className="font-satoshi font-bold text-[15px] text-[#151515]">{campus.name}</p>
                  {campus.code && <p className="font-jakarta text-[11px] text-[#9B9B9B]">{campus.code}</p>}
                </div>
                <StatusBadge status={campus.isActive ? "ACTIVE" : "INACTIVE"} />
              </div>
              {campus.location && <p className="font-jakarta text-[12px] text-[#545454] mb-[12px]">{campus.location}</p>}
              <div className="flex gap-[16px] mb-[16px]">
                <div>
                  <p className="font-satoshi font-bold text-[16px] text-[#2E7D32]">{campus._count?.vendors ?? 0}</p>
                  <p className="font-jakarta text-[11px] text-[#9B9B9B]">Vendors</p>
                </div>
                <div>
                  <p className="font-satoshi font-bold text-[16px] text-[#2E7D32]">{campus._count?.students ?? 0}</p>
                  <p className="font-jakarta text-[11px] text-[#9B9B9B]">Students</p>
                </div>
              </div>
              <div className="flex gap-[8px]">
                <Link href={`/superadmin/universities/${campus.id}`}
                  className="flex-1 h-[36px] rounded-[8px] border border-[#2E7D32] font-jakarta text-[12px] font-semibold text-[#2E7D32] flex items-center justify-center hover:bg-[#D8FFDA] transition-colors">
                  View Details
                </Link>
                <button type="button" onClick={() => setToggleModal(campus)}
                  className="flex-1 h-[36px] rounded-[8px] border border-[#EAEAEA] font-jakarta text-[12px] font-semibold text-[#545454] hover:bg-[#F7FFF8] transition-colors">
                  {campus.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add university modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
            <div className="bg-white rounded-[16px] px-[24px] pt-[24px] pb-[28px] w-full max-w-[440px]">
              <p className="font-satoshi font-bold text-[16px] text-[#151515] mb-[20px]">Add New University</p>
              <div className="flex flex-col gap-[14px] mb-[20px]">
                <div>
                  <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">University Name *</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g Crawford University" className={inputClass} />
                </div>
                <div>
                  <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">Code</label>
                  <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="e.g CRAWFORD" className={inputClass} />
                </div>
                <div>
                  <label className="font-jakarta text-[12px] font-bold text-[#151515] block mb-[6px]">Location</label>
                  <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="City, State" className={inputClass} />
                </div>
              </div>
              <div className="flex gap-[10px]">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 h-[44px] rounded-[8px] border border-[#EAEAEA] font-jakarta text-[13px] font-semibold text-[#545454] hover:bg-[#F7FFF8] transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={() => createMutation.mutate()} disabled={!newName.trim() || createMutation.isPending}
                  className="flex-1 h-[44px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[13px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors">
                  {createMutation.isPending ? "Adding..." : "Add University"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {toggleModal && (
        <ConfirmModal
          title={`${toggleModal.isActive ? "Deactivate" : "Activate"} ${toggleModal.name}?`}
          message={toggleModal.isActive ? "This will disable all vendor activity on this campus." : "This will re-enable activity on this campus."}
          confirmLabel={toggleModal.isActive ? "Deactivate" : "Activate"}
          variant={toggleModal.isActive ? "danger" : "primary"}
          isLoading={toggleMutation.isPending}
          onClose={() => setToggleModal(null)}
          onConfirm={() => toggleMutation.mutate(toggleModal)}
        />
      )}
    </SuperAdminLayout>
  );
}
