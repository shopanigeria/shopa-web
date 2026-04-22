"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import SuccessModal from "@/components/shared/SuccessModal";

function VerifyOtpForm() {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setHasError(false);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    const next = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const lastFilled = Math.min(pasted.length, 3);
    inputRefs.current[lastFilled]?.focus();
  };

  const otp = digits.join("");

  const handleSubmit = async () => {
    if (otp.length < 4) return;
    setIsLoading(true);
    setHasError(false);
    try {
      await apiClient.post("/auth/verify-otp", { email, otp });
      setIsVerified(true);
    } catch {
      setHasError(true);
      setDigits(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await apiClient.post("/auth/resend-otp", { email });
    } catch {
      // silently ignore
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <SuccessModal
        message="Email verified successfully! You can now proceed to sign in to your Shopa account."
        onClose={() => router.push("/login")}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-[10px]">
        <h2 className="font-satoshi font-bold text-[20px] text-[#151515] leading-[1.35]">
          Enter OTP
        </h2>
        <p className="text-[#9B9B9B] text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Enter the 4-digit OTP sent to your mail
        </p>
        {hasError && (
          <p className="text-[#FDC500] text-[14px] font-medium leading-[28px]">Incorrect OTP!</p>
        )}
      </div>

      {/* 4-digit boxes */}
      <div
        className="flex justify-center gap-4 mb-[10px]"
        role="group"
        aria-label="One-time password"
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            aria-label={`OTP digit ${i + 1}`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className={[
              "w-[64px] h-[64px] rounded-[12px] bg-[#EAEAEA] text-center text-[20px] font-bold text-[#151515]",
              "focus:outline-none transition-all duration-150",
              hasError
                ? "border border-[#FDC500]"
                : "border border-transparent focus:border-[#2E7D32]/40",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Resend */}
      <div className="mb-6">
        <p className="text-[#151515] text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-[#151515] font-medium underline decoration-solid disabled:opacity-60"
          >
            {isResending ? "Resending..." : "Resend code"}
          </button>
        </p>
      </div>

      <button
        type="submit"
        onClick={handleSubmit}
        disabled={isLoading || otp.length < 4}
        className="w-full h-[45px] bg-[#2E7D32] text-white rounded-[8px] font-semibold text-[14px] text-center hover:bg-[#1D5620] active:bg-[#1D5620] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Verifying...
          </>
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );
}

export default function VerifyOtpPage() {
  return <Suspense><VerifyOtpForm /></Suspense>;
}
