"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { ordersService } from "@/lib/api/services/orders.service";
import { ROUTES } from "@/lib/constants";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("success");
      setMessage("Your order has been placed!");
      return;
    }

    ordersService
      .verifyPayment(reference)
      .then((result) => {
        if (result.status === "HELD" || result.status === "success") {
          setStatus("success");
          setMessage("Payment successful! Your order has been placed and the vendor has been notified.");
        } else {
          setStatus("error");
          setMessage("Payment is being processed. Check your order history for status updates.");
        }
      })
      .catch(() => {
        setStatus("success");
        setMessage("Your order has been placed! You will receive a confirmation once payment is verified.");
      });
  }, [reference]);

  return (
    <div className="min-h-screen bg-[#F7FFF8] flex flex-col items-center justify-center px-[24px]">
      {status === "loading" ? (
        <div className="h-12 w-12 rounded-full border-4 border-[#2E7D32] border-t-transparent animate-spin" />
      ) : status === "success" ? (
        <>
          <CheckCircle size={80} className="text-[#2E7D32] mb-[24px]" />
          <h1 className="font-jakarta text-[20px] font-semibold text-[#151515] text-center mb-[12px] leading-[1.35] tracking-[-0.04em]">
            Order Placed!
          </h1>
          <p className="font-jakarta text-[14px] text-[#545454] text-center leading-[2] tracking-[-0.04em] mb-[32px]">
            {message}
          </p>
          <button
            type="button"
            onClick={() => router.replace(ROUTES.HOME)}
            className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white hover:bg-[#1D5620] transition-colors tracking-[-0.04em]"
          >
            Back to Home
          </button>
          <button
            type="button"
            onClick={() => router.replace(ROUTES.ORDERS)}
            className="mt-[12px] font-jakarta text-[14px] text-[#2E7D32] underline tracking-[-0.04em]"
          >
            View Order History
          </button>
        </>
      ) : (
        <>
          <XCircle size={80} className="text-[#9B9B9B] mb-[24px]" />
          <h1 className="font-jakarta text-[20px] font-semibold text-[#151515] text-center mb-[12px] tracking-[-0.04em]">
            Payment Pending
          </h1>
          <p className="font-jakarta text-[14px] text-[#545454] text-center leading-[2] mb-[32px]">
            {message}
          </p>
          <button
            type="button"
            onClick={() => router.replace(ROUTES.ORDERS)}
            className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white hover:bg-[#1D5620] transition-colors tracking-[-0.04em]"
          >
            View Order History
          </button>
        </>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
