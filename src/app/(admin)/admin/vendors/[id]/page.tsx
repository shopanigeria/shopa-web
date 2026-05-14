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

interface VendorDetail {
  id: string;
  storeName: string;
  description?: string;
  status: string;
  logo?: string;
  logoUrl?: string;
  phone?: string;
  itemsSold?: string[];
  saleType?: string;
  createdAt: string;
  bankAccount?: { accountNumber: string; bankName: string; accountName: string };
  user?: { firstName: string; lastName: string; email: string; phone?: string; matricNumber?: string; studentIdUrl?: string };
  categories?: { id: string; name: string }[];
  products?: Product[];
}
interface Product { id: string; name: string; price: number; stock: number; isAvailable?: boolean; saleType?: string; images?: string[]; imageUrls?: string[]; }


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
    enabled: !!vendor,
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

  if (!vendor && !products) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-2 border-[#2E7D32] border-t-transparent animate-spin" /></div></AdminLayout>;
  }

  const v = vendor!;
  const prods = products ?? vendor?.products ?? [];

  return (
    <AdminLayout >
      <button type="button" onClick={() => router.back()} className="flex items-center gap-[6px] text-[#2E7D32] mb-[20px] hover:opacity-70 transition-opacity">
        <ChevronLeft size={18} /> <span className="font-jakarta text-[13px] font-semibold">Back to Vendors</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
        {/* Profile card */}
        <div className="lg:col-span-1 bg-white rounded-[12px] border border-[#EAEAEA] p-[24px]">
          <div className="flex flex-col items-center text-center mb-[20px]">
            <div className="w-[72px] h-[72px] rounded-full bg-[#D8FFDA] flex items-center justify-center mb-[12px] overflow-hidden relative">
              {(v.logo ?? v.logoUrl) ? <Image src={v.logo ?? v.logoUrl!} alt="logo" fill className="object-cover" sizes="72px" /> :
                <span className="font-satoshi font-bold text-[24px] text-[#2E7D32]">{v.storeName[0]}</span>}
            </div>
            <p className="font-satoshi font-bold text-[16px] text-[#151515]">{v.storeName}</p>
            <StatusBadge status={v.status} className="mt-[6px]" />
          </div>

          <div className="flex flex-col gap-[12px] text-left">
            {[
              { label: "Owner", value: `${v.user?.firstName ?? ""} ${v.user?.lastName ?? ""}`.trim() || "—" },
              { label: "Email", value: v.user?.email ?? "—" },
              { label: "Phone", value: v.user?.phone ?? v.phone ?? "—" },
              { label: "Matric No.", value: v.user?.matricNumber ?? "—" },
              { label: "Categories", value: v.categories?.map((c) => c.name).join(", ") || (v.itemsSold ?? []).join(", ") || "—" },
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.user.studentIdUrl}
                  alt="Student ID card"
                  className="w-full h-[180px] object-cover object-top rounded-[10px] border-2 border-[#2E7D32]/20 hover:border-[#2E7D32] transition-colors cursor-zoom-in"
                />
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

        {/* Products / Items description */}
        <div className="lg:col-span-2 space-y-[16px]">
          {/* What they plan to sell — always shown for pending vendors */}
          {(v.itemsSold?.length || v.description) && (
            <div className="bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden">
              <div className="px-[20px] py-[16px] border-b border-[#EAEAEA]">
                <p className="font-satoshi font-bold text-[15px] text-[#151515]">What they plan to sell</p>
                <p className="font-jakarta text-[11px] text-[#9B9B9B] mt-[2px]">Provided during registration</p>
              </div>
              <div className="px-[20px] py-[16px]">
                {v.itemsSold && v.itemsSold.length > 0 && (
                  <div className="flex flex-wrap gap-[8px] mb-[12px]">
                    {v.itemsSold.map((item) => (
                      <span key={item} className="bg-[#D8FFDA] text-[#2E7D32] font-jakarta text-[12px] font-medium px-[10px] py-[4px] rounded-[5px]">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                {v.description && (
                  <p className="font-jakarta text-[13px] text-[#545454] leading-[1.6]">{v.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Actual listed products */}
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden">
            <div className="px-[20px] py-[16px] border-b border-[#EAEAEA]">
              <p className="font-satoshi font-bold text-[15px] text-[#151515]">Listed Products ({prods.length})</p>
            </div>
            {prods.length === 0 ? (
              <p className="px-[20px] py-[24px] font-jakarta text-[13px] text-[#9B9B9B]">No products listed yet.</p>
            ) : (
              <div className="divide-y divide-[#EAEAEA]">
                {prods.map((p) => {
                  const img = p.images?.[0] ?? p.imageUrls?.[0];
                  return (
                    <div key={p.id} className="px-[20px] py-[12px] flex items-center gap-[12px]">
                      <div className="w-[48px] h-[48px] rounded-[8px] bg-[#EAEAEA] overflow-hidden shrink-0 relative">
                        {img
                          ? <Image src={img} alt={p.name} fill className="object-cover" sizes="48px" />
                          : <span className="flex items-center justify-center h-full font-jakarta text-[10px] text-[#9B9B9B]">—</span>
                        }
                      </div>
                      <p className="font-jakarta font-semibold text-[13px] text-[#151515] flex-1">{p.name}</p>
                      <span className="font-jakarta text-[11px] text-[#9B9B9B] bg-[#EAEAEA] px-[8px] py-[3px] rounded-full shrink-0">
                        {p.saleType === "PREORDER" ? "Preorder" : "In Stock"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
