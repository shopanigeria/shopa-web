"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validators/auth.validators";
import { authService } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ForgotPasswordFormData>({
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
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <CheckCircle2 size={64} className="text-primary" />
        </div>
        <p className="text-neutral-black text-[14px] font-medium tracking-[-0.56px] leading-[28px] mb-6">
          Check your mail inbox for a password reset email!
        </p>
        <Link href="/login" className="btn-primary inline-block">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2
          className="text-[20px] text-neutral-black leading-none mb-1"
          style={{ fontFamily: "Satoshi, sans-serif", fontWeight: 700 }}
        >
          Forgot Password
        </h2>
        <p className="text-neutral-gray text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Recover your password
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
        onClick={handleSubmit(onSubmit)}
        disabled={isLoading}
        className="btn-primary mb-6"
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

      <p className="text-center text-[14px] font-medium tracking-[-0.56px] leading-[28px] text-neutral-black">
        Remember your password?{" "}
        <Link href="/login" className="link-yellow">Sign in here</Link>
      </p>
    </div>
  );
}
