"use client";

import { Ticket } from "lucide-react";
import ScreenHeader from "@/components/layout/ScreenHeader";
import BackButton from "@/components/layout/BackButton";

export default function VouchersPage() {
  return (
    <div className="min-h-screen bg-[#F7FFF8] md:max-w-[720px] md:mx-auto">
      <ScreenHeader title="Vouchers" showBack />
      <div className="md:px-6 lg:px-8 md:pt-[20px]"><BackButton label="Vouchers" /></div>

      <div className="flex flex-col items-center justify-center py-20 px-[24px]">
        <Ticket size={64} className="text-[#9B9B9B] mb-[16px]" />
        <p className="font-jakarta text-[16px] font-medium text-[#9B9B9B] text-center leading-[1.8] tracking-[-0.04em]">
          You don&apos;t have any available{"\n"}voucher currently
        </p>
      </div>
    </div>
  );
}
