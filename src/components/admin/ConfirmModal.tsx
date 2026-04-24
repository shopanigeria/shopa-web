"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  isLoading?: boolean;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export function ConfirmModal({
  title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "primary", requireReason = false, reasonLabel = "Reason",
  reasonPlaceholder = "Enter reason...", isLoading = false, onConfirm, onClose,
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[24px] pb-[28px] w-full max-w-[400px] relative">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>
          <p className="font-satoshi font-bold text-[16px] text-[#151515] mb-[8px] pr-[36px]">{title}</p>
          {message && <p className="font-jakarta text-[13px] text-[#9B9B9B] tracking-[-0.04em] mb-[16px]">{message}</p>}
          {requireReason && (
            <div className="mb-[20px]">
              <label className="font-jakarta text-[13px] font-bold text-[#151515] tracking-[-0.04em] block mb-[8px]">{reasonLabel}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                rows={3}
                title={reasonLabel}
                className="w-full rounded-[8px] border border-[#EAEAEA] bg-[#F7FFF8] px-[12px] py-[10px] font-jakarta text-[13px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32] resize-none"
              />
            </div>
          )}
          <div className="flex gap-[10px]">
            <button type="button" onClick={onClose}
              className="flex-1 h-[44px] rounded-[8px] border border-[#EAEAEA] font-jakarta text-[13px] font-semibold text-[#545454] hover:bg-[#F7FFF8] transition-colors">
              {cancelLabel}
            </button>
            <button type="button"
              onClick={() => onConfirm(requireReason ? reason : undefined)}
              disabled={isLoading || (requireReason && !reason.trim())}
              className={cn("flex-1 h-[44px] rounded-[8px] font-jakarta text-[13px] font-semibold text-white disabled:opacity-50 transition-colors",
                variant === "danger" ? "bg-[#E53935] hover:bg-[#C62828]" : "bg-[#2E7D32] hover:bg-[#1D5620]"
              )}>
              {isLoading ? "Processing..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
