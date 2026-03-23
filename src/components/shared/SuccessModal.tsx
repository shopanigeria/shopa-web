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
      {/* Card */}
      <div className="relative z-10 w-full max-w-[340px] bg-white rounded-[20px] px-6 py-10">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-neutral-gray flex items-center justify-center text-neutral-gray hover:border-neutral-black hover:text-neutral-black transition-colors"
        >
          <X size={14} />
        </button>
        {/* Check icon */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-[80px] h-[80px] rounded-full bg-primary flex items-center justify-center">
            <Check size={40} strokeWidth={3} className="text-white" />
          </div>
          <p className="text-primary text-[15px] font-medium text-center leading-[26px] tracking-[-0.3px]">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
