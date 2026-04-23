"use client";

import { Gift, Copy } from "lucide-react";
import ScreenHeader from "@/components/layout/ScreenHeader";
import BackButton from "@/components/layout/BackButton";
import { toast } from "sonner";

const REFERRAL_LINK = "https://shoppa.ng/ref/esther123";

export default function ReferralsPage() {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_LINK);
      toast.success("Referral link copied to clipboard.");
    } catch {
      toast.error("Could not copy link. Please copy it manually.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FFF8] flex flex-col md:max-w-[720px] md:mx-auto">
      <ScreenHeader title="Referrals" showBack />
      <div className="md:px-6 lg:px-8 md:pt-[20px]"><BackButton label="Referrals" /></div>

      <div className="flex-1 flex flex-col items-center justify-center px-[24px] py-[40px]">
        <Gift size={120} className="text-[#2E7D32] mb-[16px]" />
        <p className="font-jakarta text-[16px] font-medium text-[#9B9B9B] text-center mt-[4px] tracking-[-0.04em]">
          Refer friends and earn rewards!
        </p>
      </div>

      <div className="px-[24px] pb-[100px]">
        <button
          type="button"
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-[8px] bg-[#2E7D32] rounded-[8px] py-[16px] hover:bg-[#1D5620] transition-colors"
        >
          <Copy size={20} className="text-white" />
          <span className="font-jakarta text-[14px] font-bold text-white tracking-[-0.04em]">
            COPY REFERRAL LINK
          </span>
        </button>
      </div>
    </div>
  );
}
