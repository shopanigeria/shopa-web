"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
        message="Check your mail inbox for a Password reset email!"
        onClose={() => router.push("/login")}
      />
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="font-satoshi font-bold text-[20px] text-neutral-black leading-none mb-1">
          Forgot Password
        </h2>
        <p className="text-neutral-gray text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Recover your Password
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[12px]">
          {error}
        </div>
      )}

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
            <p className="text-red-500 text-[11px]">{errors.email.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        onClick={handleSubmit(onSubmit)}
        disabled={isLoading}
        className="btn-primary"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Sending...
          </span>
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );
}
