"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validators/auth.validators";
import { authService } from "@/lib/api";
import SuccessModal from "@/components/shared/SuccessModal";

function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) { setError("Invalid reset link."); return; }
    setIsLoading(true);
    setError(null);
    try {
      await authService.resetPassword(token, data.password);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <XCircle size={64} className="text-red-500 mb-4" />
        <p className="text-neutral-black text-[14px] font-medium tracking-[-0.56px] leading-[28px] mb-6 text-center">
          This reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="btn-primary inline-block text-center">
          Request new link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <SuccessModal
        message="Your Password has been successfully reset!"
        onClose={() => router.push("/login")}
      />
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="font-satoshi font-bold text-[20px] text-neutral-black leading-none mb-1">
          Create New Password
        </h2>
        <p className="text-neutral-gray text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Enter a new Password
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[12px]">
          {error}
        </div>
      )}

      <div className="space-y-[10px] mb-6">
        <div className="space-y-[5px]">
          <label className="label-field">Enter New Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new 4-digit password"
              className="input-field pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-gray"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-[11px]">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-[5px]">
          <label className="label-field">Confirm New Password</label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm your new 4-digit password"
              className="input-field pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-gray"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-[11px]">{errors.confirmPassword.message}</p>
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
            Resetting...
          </span>
        ) : (
          "CONFIRM"
        )}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}
