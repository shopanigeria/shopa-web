"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  label?: string;
}

export default function BackButton({ label }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="hidden md:flex items-center gap-[6px] text-[#2E7D32] hover:opacity-70 transition-opacity mb-[16px]"
      aria-label="Go back"
    >
      <ChevronLeft size={20} />
      <span className="font-jakarta text-[14px] font-medium tracking-[-0.04em]">
        {label ?? "Back"}
      </span>
    </button>
  );
}
