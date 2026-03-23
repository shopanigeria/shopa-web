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
      <div className="text-center mb-4">
        <h2 className="font-satoshi font-bold text-[20px] text-neutral-black leading-none mb-1">
          Enter OTP
        </h2>
        <p className="text-neutral-gray text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Enter the 4-digit OTP sent to your mail
        </p>
        {hasError && (
          <p className="text-secondary text-[13px] font-semibold mt-1">Incorrect OTP!</p>
        )}
      </div>

      {/* 4 digit boxes */}
      <div className="flex justify-center gap-4 mb-6" role="group" aria-label="One-time password">
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
              "w-[64px] h-[64px] rounded-[12px] bg-neutral-light text-center text-[20px] font-bold text-neutral-black",
              "focus:outline-none transition-all duration-150",
              hasError
                ? "border-2 border-secondary focus:border-secondary"
                : "border-2 border-transparent focus:border-primary/40",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Resend */}
      <p className="text-center text-[13px] font-medium text-neutral-black mb-6">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="text-secondary font-semibold underline decoration-solid disabled:opacity-60"
        >
          {isResending ? "Resending..." : "Resend code"}
        </button>
      </p>

      <button
        type="submit"
        onClick={handleSubmit}
        disabled={isLoading || otp.length < 4}
        className="btn-primary"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Verifying...
          </span>
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
