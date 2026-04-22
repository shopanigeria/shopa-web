"use client";

import { Check, X } from "lucide-react";

interface SuccessModalProps {
  message: string;
  onClose: () => void;
}

export default function SuccessModal({ message, onClose }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-primary-dark">
      {/* Background SVG pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/auth-bg.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Card — fully rounded, matches Figma borderRadius: 24px */}
      <div className="relative z-10 w-full bg-white rounded-[24px] px-[24px] py-[38px]">
        {/* x-circle close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#9B9B9B] hover:text-[#151515] transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        {/* Check icon + message */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-[80px] h-[80px] rounded-full bg-[#2E7D32] flex items-center justify-center">
            <Check size={40} strokeWidth={3} className="text-white" />
          </div>
          <p className="text-[#2E7D32] text-[14px] font-medium text-center leading-[28px] tracking-[-0.56px]">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
