"use client";

import ScreenHeader from "@/components/layout/ScreenHeader";

export default function TermsPoliciesPage() {
  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <ScreenHeader title="Terms & Policies" showBack />

      <div className="px-[24px] pt-[24px] pb-[100px]">
        <h1 className="font-jakarta text-[18px] font-bold text-[#151515] tracking-[-0.04em] mb-[16px]">
          Terms & Policies
        </h1>
        <p className="font-jakarta text-[14px] text-[#545454] leading-[2] tracking-[-0.04em]">
          By using Shopa, you agree to our terms of service. Shopa is a student marketplace
          for Nigerian university students to buy and sell products within the campus community.
        </p>
        <p className="font-jakarta text-[14px] text-[#545454] leading-[2] tracking-[-0.04em] mt-[16px]">
          All transactions are protected by our escrow payment system through Paystack. Funds
          are only released to vendors after successful delivery confirmation.
        </p>
        <p className="font-jakarta text-[14px] text-[#545454] leading-[2] tracking-[-0.04em] mt-[16px]">
          A service fee of 7.5% applies to all orders. Disputes must be raised within 24 hours
          of receiving your order.
        </p>
        <p className="font-jakarta text-[14px] font-bold text-[#545454] leading-[2] tracking-[-0.04em] mt-[16px]">
          For more information, contact us at shopanigeria@gmail.com.
        </p>
      </div>
    </div>
  );
}
