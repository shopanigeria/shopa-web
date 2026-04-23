"use client";

import { Mail } from "lucide-react";
import ScreenHeader from "@/components/layout/ScreenHeader";
import BackButton from "@/components/layout/BackButton";

const SUPPORT_EMAIL = "shopanigeria@gmail.com";

export default function HelpSupportPage() {
  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <ScreenHeader title="Help & Support" showBack />
      <div className="md:px-6 lg:px-8 md:pt-[20px]"><BackButton label="Help & Support" /></div>

      <div className="px-[24px] md:px-6 lg:px-8 pt-[24px] md:max-w-[720px] md:mx-auto">
        <h1 className="font-jakarta text-[18px] font-bold text-[#151515] mb-[24px] tracking-[-0.04em]">
          Need help?
        </h1>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="flex items-center gap-[16px]"
        >
          <div className="w-[56px] h-[56px] rounded-full bg-[#2E7D32] flex items-center justify-center shrink-0">
            <Mail size={24} className="text-white" />
          </div>
          <div>
            <p className="font-jakarta text-[14px] font-medium text-[#151515] mb-[4px] tracking-[-0.04em]">
              Send us an email
            </p>
            <p className="font-jakarta text-[14px] font-bold text-[#151515] tracking-[-0.04em]">
              {SUPPORT_EMAIL}
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}
