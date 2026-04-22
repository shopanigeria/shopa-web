"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Check, X, Paperclip } from "lucide-react";
import ScreenHeader from "@/components/layout/ScreenHeader";
import { useOrders } from "@/hooks/useOrders";
import { useCreateDispute } from "@/hooks/useOrders";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import type { Order } from "@/types";

const DISPUTABLE_STATUSES = ["PAID", "CONFIRMED", "SHIPPED", "DELIVERED"];

const orderLabel = (order: Order) => {
  const short = (order.orderNumber ?? order.id).slice(-8).toUpperCase();
  const store = order.vendor?.storeName ?? "";
  return `#${short}${store ? ` — ${store}` : ""}`;
};

export default function RaiseDisputePage() {
  const router = useRouter();
  const { data: allOrders, isLoading: ordersLoading } = useOrders();
  const createDispute = useCreateDispute();

  const orders = (allOrders ?? []).filter((o) => DISPUTABLE_STATUSES.includes(o.status as string));

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [complaint, setComplaint] = useState("");
  const [accountDetails, setAccountDetails] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newFiles = files.map((f) => ({ name: f.name }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    // Reset input so same file can be re-added
    e.target.value = "";
  };

  const removeFile = (name: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const isDisabled =
    createDispute.isPending ||
    !selectedOrder ||
    !complaint.trim() ||
    !accountDetails.trim() ||
    uploadedFiles.length === 0;

  const handleSubmit = async () => {
    if (!selectedOrder) return;

    try {
      await createDispute.mutateAsync({
        orderId: selectedOrder.id,
        reason: complaint.trim(),
        description: complaint.trim(),
        accountDetails: accountDetails.trim() || undefined,
        proofUrls: [],
      });

      toast.success("Dispute raised! You will get a response in your mail within 72 hours.");
      router.replace(ROUTES.PROFILE);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to submit dispute. Please try again.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <ScreenHeader title="Raise Order Dispute" showBack />

      <div className="px-[24px] pt-[24px] pb-[120px]">

        {/* Order picker */}
        <div className="mb-[24px]">
          <label className="font-jakarta text-[14px] font-medium text-[#333333] mb-[8px] block tracking-[-0.04em]">
            Select Order <span className="text-[#FDC500]">*</span>
          </label>

          {ordersLoading ? (
            <div className="border border-[#EAEAEA] rounded-[8px] px-[16px] py-[16px] flex justify-center">
              <div className="h-5 w-5 rounded-full border-2 border-[#2E7D32] border-t-transparent animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="border border-[#EAEAEA] rounded-[8px] px-[16px] py-[16px] bg-white">
              <p className="font-jakarta text-[13px] text-[#9B9B9B] leading-[1.5] tracking-[-0.04em]">
                No eligible orders found. Disputes can only be raised for paid, confirmed, shipped, or delivered orders.
              </p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="w-full border border-[#EAEAEA] rounded-[8px] px-[16px] py-[14px] flex items-center justify-between bg-white"
              >
                <span className={`font-jakarta text-[14px] tracking-[-0.04em] ${selectedOrder ? "text-[#333333]" : "text-[#C2C2C2]"}`}>
                  {selectedOrder ? orderLabel(selectedOrder) : "Choose an order..."}
                </span>
                {pickerOpen ? (
                  <ChevronUp size={18} className="text-[#9B9B9B]" />
                ) : (
                  <ChevronDown size={18} className="text-[#9B9B9B]" />
                )}
              </button>

              {pickerOpen && (
                <div className="border border-[#EAEAEA] rounded-[8px] bg-white mt-[4px] overflow-hidden">
                  {orders.map((order, idx) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => { setSelectedOrder(order); setPickerOpen(false); }}
                      className={`w-full flex items-center justify-between px-[16px] py-[12px] text-left ${idx < orders.length - 1 ? "border-b border-[#EAEAEA]" : ""}`}
                    >
                      <div className="flex-1">
                        <p className="font-jakarta text-[14px] font-medium text-[#333333] tracking-[-0.04em]">
                          {orderLabel(order)}
                        </p>
                        <p className="font-jakarta text-[12px] text-[#9B9B9B] mt-[2px] tracking-[-0.04em]">
                          {order.status} · ₦{Number(order.totalAmount).toLocaleString()}
                        </p>
                      </div>
                      {selectedOrder?.id === order.id && (
                        <Check size={18} className="text-[#2E7D32]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Complaint */}
        <div className="mb-[24px]">
          <label className="font-jakarta text-[14px] font-medium text-[#333333] mb-[8px] block tracking-[-0.04em]">
            What is the issue with the order? <span className="text-[#FDC500]">*</span>
          </label>
          <textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Describe your complaint..."
            className="w-full border border-[#EAEAEA] rounded-[8px] px-[12px] py-[12px] font-jakarta text-[14px] text-[#333333] placeholder:text-[#C2C2C2] min-h-[120px] resize-none focus:outline-none focus:border-[#2E7D32]"
          />
        </div>

        {/* Account details */}
        <div className="mb-[24px]">
          <label className="font-jakarta text-[14px] font-medium text-[#333333] mb-[8px] block tracking-[-0.04em]">
            Provide account details in case of refund <span className="text-[#FDC500]">*</span>
          </label>
          <input
            type="text"
            value={accountDetails}
            onChange={(e) => setAccountDetails(e.target.value)}
            placeholder="e.g 0000000000, UBA bank, Esther Esther"
            className="w-full border border-[#EAEAEA] rounded-[8px] px-[12px] py-[14px] font-jakarta text-[14px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32]"
          />
        </div>

        {/* Upload proof */}
        <div className="mb-[32px]">
          <label className="font-jakarta text-[14px] font-medium text-[#333333] mb-[8px] block tracking-[-0.04em]">
            Upload proof <span className="text-[#FDC500]">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple={false}
            aria-label="Upload proof of dispute"
            title="Upload proof of dispute"
            className="hidden"
            onChange={handleFileSelect}
          />

          {uploadedFiles.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-[6px]"
            >
              <Paperclip size={16} className="text-[#2E7D32]" />
              <span className="font-jakarta text-[14px] font-semibold text-[#2E7D32] underline tracking-[-0.04em]">
                Click to upload proof (PDF, JPEG, PNG, etc)
              </span>
            </button>
          ) : (
            <div>
              {uploadedFiles.map((file) => (
                <div key={file.name} className="flex items-center justify-between py-[8px]">
                  <span className="font-jakarta text-[14px] text-[#333333] flex-1 mr-[8px] truncate tracking-[-0.04em]">
                    {file.name}
                  </span>
                  <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(file.name)}>
                    <X size={18} className="text-[#9B9B9B]" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-jakarta text-[14px] font-bold text-[#2E7D32] underline mt-[8px] tracking-[-0.04em]"
              >
                + Upload additional proof
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isDisabled}
          className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1D5620] transition-colors tracking-[-0.04em]"
        >
          {createDispute.isPending ? "Submitting..." : "Submit Order Dispute"}
        </button>
      </div>
    </div>
  );
}
