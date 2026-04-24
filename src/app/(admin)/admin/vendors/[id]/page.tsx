"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { formatNaira } from "@/lib/utils";

interface VendorDetail {
  id: string;
  storeName: string;
  description?: string;
  status: string;
  logoUrl?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string; phone?: string; matricNumber?: string; studentIdUrl?: string };
  categories?: string[];
  saleType?: string;
}
interface Product { id: string; name: string; price: number; stock: number; isAvailable: boolean; }

const MOCK_VENDOR: VendorDetail = {
  id: "v1", storeName: "Fresh Provisions", description: "Quality food items for students.", status: "PENDING",
  createdAt: new Date().toISOString(),
  user: {
    firstName: "Tolu", lastName: "Adeyemi", email: "tolu@crawford.edu",
    phone: "08012345678", matricNumber: "CSC/2021/001",
    studentIdUrl: "https://images.unsplash.com/photo-1591278169757-deac26e49555?w=600&q=80",
  },
  categories: ["Provisions"], saleType: "IN_STOCK",
};
const MOCK_PRODUCTS: Product[] = [
  { id: "p1", name: "Indomie Pack (12)", price: 3500, stock: 20, isAvailable: true },
  { id: "p2", name: "Milo Tin 400g", price: 4200, stock: 15, isAvailable: true },
];

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"approve" | "reject" | "delete" | null>(null);

  const { data: vendor } = useQuery<VendorDetail>({
    queryKey: ["admin-vendor", id],
    queryFn: async () => { const { data } = await apiClient.get(`/vendors/${id}`); return data?.data ?? data; },
  });
  const { data: products } = useQuery<Product[]>({
    queryKey: ["admin-vendor-products", id],
    queryFn: async () => { const { data } = await apiClient.get(`/products?vendorId=${id}`); return data?.data ?? data ?? []; },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ status, reason }: { status: string; reason?: string }) => {
      await apiClient.patch(`/vendors/admin/${id}/verify`, { status, ...(reason && { reason }) });
    },
    onSuccess: () => { toast.success("Vendor updated."); queryClient.invalidateQueries({ queryKey: ["admin-vendor", id] }); setModal(null); },
    onError: () => toast.error("Action failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (reason: string) => { await apiClient.post(`/vendors/admin/${id}/deletion-request`, { reason }); },
    onSuccess: () => { toast.success("Deletion request sent."); setModal(null); },
    onError: () => toast.error("Request failed."),
  });

  const v = vendor ?? MOCK_VENDOR;
  const prods = products ?? MOCK_PRODUCTS;

  return (
    <AdminLayout campusName="Crawford University">
      <button type="button" onClick={() => router.back()} className="flex items-center gap-[6px] text-[#2E7D32] mb-[20px] hover:opacity-70 transition-opacity">
        <ChevronLeft size={18} /> <span className="font-jakarta text-[13px] font-semibold">Back to Vendors</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        {/* Profile card */}
        <div className="lg:col-span-1 bg-white rounded-[12px] border border-[#EAEAEA] p-[24px]">
          <div className="flex flex-col items-center text-center mb-[20px]">
            <div className="w-[72px] h-[72px] rounded-full bg-[#D8FFDA] flex items-center justify-center mb-[12px] overflow-hidden relative">
              {v.logoUrl ? <Image src={v.logoUrl} alt="logo" fill className="object-cover" sizes="72px" /> :
                <span className="font-satoshi font-bold text-[24px] text-[#2E7D32]">{v.storeName[0]}</span>}
            </div>
            <p className="font-satoshi font-bold text-[16px] text-[#151515]">{v.storeName}</p>
            <StatusBadge status={v.status} className="mt-[6px]" />
          </div>

          <div className="flex flex-col gap-[12px] text-left">
            {[
              { label: "Owner", value: `${v.user?.firstName} ${v.user?.lastName}` },
              { label: "Email", value: v.user?.email ?? "—" },
              { label: "Phone", value: v.user?.phone ?? "—" },
              { label: "Matric No.", value: v.user?.matricNumber ?? "—" },
              { label: "Categories", value: (v.categories ?? []).join(", ") || "—" },
              { label: "Sale Type", value: v.saleType ?? "—" },
              { label: "Registered", value: new Date(v.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-jakarta text-[11px] text-[#9B9B9B]">{label}</p>
                <p className="font-jakarta text-[13px] font-semibold text-[#333333]">{value}</p>
              </div>
            ))}
          </div>

          {/* Student ID card — always shown, placeholder if not uploaded */}
          <div className="mt-[20px] pt-[16px] border-t border-[#EAEAEA]">
            <div className="flex items-center justify-between mb-[10px]">
              <p className="font-jakarta text-[12px] font-bold text-[#151515]">Student ID Card</p>
              {v.user?.studentIdUrl && (
                <a href={v.user.studentIdUrl} target="_blank" rel="noopener noreferrer"
                  title="View full size student ID"
                  className="font-jakarta text-[11px] font-semibold text-[#2E7D32] underline hover:opacity-70 transition-opacity">
                  View full size ↗
                </a>
              )}
            </div>
            {v.user?.studentIdUrl ? (
              <a href={v.user.studentIdUrl} target="_blank" rel="noopener noreferrer" title="Click to view full size student ID">
                <div className="relative w-full h-[180px] rounded-[10px] overflow-hidden border-2 border-[#2E7D32]/20 hover:border-[#2E7D32] transition-colors cursor-zoom-in">
                  <Image
                    src={v.user.studentIdUrl}
                    alt="Student ID card"
                    fill
                    className="object-cover object-top"
                    sizes="300px"
                  />
                </div>
                <p className="font-jakarta text-[11px] text-[#9B9B9B] text-center mt-[6px]">Click to view full size</p>
              </a>
            ) : (
              <div className="w-full h-[120px] rounded-[10px] border-2 border-dashed border-[#EAEAEA] flex flex-col items-center justify-center gap-[6px]">
                <p className="font-jakarta text-[12px] text-[#9B9B9B]">No ID uploaded</p>
                <p className="font-jakarta text-[11px] text-[#C2C2C2]">Vendor has not uploaded their student ID yet</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {v.status === "PENDING" && (
            <div className="flex gap-[8px] mt-[20px]">
              <button type="button" onClick={() => setModal("approve")}
                className="flex-1 h-[40px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[13px] font-semibold text-white hover:bg-[#1D5620] transition-colors">
                Approve
              </button>
              <button type="button" onClick={() => setModal("reject")}
                className="flex-1 h-[40px] rounded-[8px] bg-[#E53935] font-jakarta text-[13px] font-semibold text-white hover:bg-[#C62828] transition-colors">
                Reject
              </button>
            </div>
          )}
          {v.status === "APPROVED" && (
            <button type="button" onClick={() => setModal("delete")}
              className="w-full h-[40px] rounded-[8px] border border-[#E53935] font-jakarta text-[13px] font-semibold text-[#E53935] hover:bg-[#FFEBEE] transition-colors mt-[20px]">
              Request Deletion
            </button>
          )}
        </div>

        {/* Products */}
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden">
          <div className="px-[20px] py-[16px] border-b border-[#EAEAEA]">
            <p className="font-satoshi font-bold text-[15px] text-[#151515]">Products ({prods.length})</p>
          </div>
          {prods.length === 0 ? (
            <p className="px-[20px] py-[24px] font-jakarta text-[13px] text-[#9B9B9B]">No products listed.</p>
          ) : (
            <div className="divide-y divide-[#EAEAEA]">
              {prods.map((p) => (
                <div key={p.id} className="px-[20px] py-[12px] flex items-center justify-between">
                  <div>
                    <p className="font-jakarta font-semibold text-[13px] text-[#151515]">{p.name}</p>
                    <p className="font-jakarta text-[11px] text-[#9B9B9B]">Stock: {p.stock} · {p.isAvailable ? "Available" : "Out of Stock"}</p>
                  </div>
                  <p className="font-jakarta font-bold text-[13px] text-[#2E7D32]">{formatNaira(p.price)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal === "approve" && (
        <ConfirmModal title={`Approve "${v.storeName}"?`} confirmLabel="Approve"
          isLoading={verifyMutation.isPending} onClose={() => setModal(null)}
          onConfirm={() => verifyMutation.mutate({ status: "APPROVED" })}
        />
      )}
      {modal === "reject" && (
        <ConfirmModal title={`Reject "${v.storeName}"?`} confirmLabel="Reject" variant="danger"
          requireReason reasonLabel="Rejection reason" reasonPlaceholder="Enter reason..."
          isLoading={verifyMutation.isPending} onClose={() => setModal(null)}
          onConfirm={(reason) => verifyMutation.mutate({ status: "REJECTED", reason })}
        />
      )}
      {modal === "delete" && (
        <ConfirmModal title={`Request deletion of "${v.storeName}"?`}
          message="A deletion request will be sent to the super admin." confirmLabel="Send Request" variant="danger"
          requireReason reasonLabel="Reason" reasonPlaceholder="Why should this vendor be deleted?"
          isLoading={deleteMutation.isPending} onClose={() => setModal(null)}
          onConfirm={(reason) => deleteMutation.mutate(reason ?? "")}
        />
      )}
    </AdminLayout>
  );
}
