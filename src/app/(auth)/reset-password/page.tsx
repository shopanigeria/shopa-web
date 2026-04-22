"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validators/auth.validators";
import { authService } from "@/lib/api";
import SuccessModal from "@/components/shared/SuccessModal";

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      <div className="flex flex-col items-center justify-center py-8 gap-6">
        <p className="text-[#151515] text-[14px] font-medium tracking-[-0.56px] leading-[28px] text-center">
          This reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="w-full h-[45px] bg-[#2E7D32] text-white rounded-[8px] font-semibold text-[14px] text-center flex items-center justify-center"
        >
          Request new link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <SuccessModal
        message="Your password has been successfully reset!"
        onClose={() => router.push("/login")}
      />
    );
  }

  return (
    <div>
      <div className="text-center mb-[10px]">
        <h2 className="font-satoshi font-bold text-[20px] text-[#151515] leading-[1.35]">
          Create New Password
        </h2>
        <p className="text-[#9B9B9B] text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Enter a new password
        </p>
        {error && (
          <p className="text-[#FDC500] text-[14px] font-medium leading-[28px]">{error}</p>
        )}
      </div>

      <div className="space-y-[10px] mb-6">
        <div className="space-y-[5px]">
          <label className="label-field">Enter New Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              className="input-field pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#9B9B9B]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[#FDC500] text-[11px]">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-[5px]">
          <label className="label-field">Confirm New Password</label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your new password"
              className="input-field pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#9B9B9B]"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[#FDC500] text-[11px]">{errors.confirmPassword.message}</p>
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
            Resetting...
          </>
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
