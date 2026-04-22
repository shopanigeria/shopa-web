"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Loader2 } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validators/auth.validators";
import { authService } from "@/lib/api";
import { useRouter } from "next/navigation";
import SuccessModal from "@/components/shared/SuccessModal";

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <SuccessModal
        message="Check your mail inbox for a password reset email!"
        onClose={() => router.push("/login")}
      />
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="flex items-center gap-1 text-[#151515] text-[14px] font-medium mb-[10px] -ml-1"
        aria-label="Back to login"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <div className="text-center mb-[10px]">
        <h2 className="font-satoshi font-bold text-[20px] text-[#151515] leading-[1.35]">
          Forgot Password
        </h2>
        <p className="text-[#9B9B9B] text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Recover your password
        </p>
        {error && (
          <p className="text-[#FDC500] text-[14px] font-medium leading-[28px]">{error}</p>
        )}
      </div>

      <div className="space-y-[10px] mb-6">
        <div className="space-y-[5px]">
          <label className="label-field">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="Enter your email"
            className="input-field"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-[#FDC500] text-[11px]">{errors.email.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        onClick={handleSubmit(onSubmit)}
        disabled={isLoading}
        className="w-full h-[45px] bg-[#2E7D32] text-white rounded-[8px] font-semibold text-[14px] text-center hover:bg-[#1D5620] active:bg-[#1D5620] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Sending...
          </>
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );
}
