"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormData } from "@/lib/validators/auth.validators";
import SuccessModal from "@/components/shared/SuccessModal";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isLoginPending, loginError } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isVerified = searchParams.get("verified") === "true";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => login(data);

  const errorMessage =
    (loginError as any)?.response?.data?.message ?? (loginError as any)?.message;

  if (isVerified) {
    return (
      <SuccessModal
        message="Email verified successfully! You can now proceed to sign in to your Shopa account."
        onClose={() => router.replace("/login")}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-satoshi font-bold text-[20px] text-neutral-black leading-none mb-1">
          LOGIN
        </h2>
        <p className="text-neutral-gray text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Sign in to your Shopa account
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[12px]">
          {errorMessage}
        </div>
      )}

      <div className="space-y-[10px] mb-[10px]">
        {/* Email or Phone */}
        <div className="space-y-[5px]">
          <label className="label-field">Email or Phone</label>
          <input
            {...register("email")}
            type="email"
            placeholder="Enter your email or phone number"
            className="input-field"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-red-500 text-[11px]">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-[5px]">
          <label className="label-field">Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your 4-digit password"
              className="input-field pr-10"
              autoComplete="current-password"
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
      </div>

      {/* Remember me + Forgot Password */}
      <div className="flex items-center justify-between mb-6">
        <label className="flex items-center gap-[6px] cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-[14px] h-[14px] rounded-sm border border-neutral-gray accent-primary"
          />
          <span className="text-neutral-black text-[12px] tracking-[-0.48px]">Remember Me</span>
        </label>
        <Link href="/forgot-password" className="text-secondary font-semibold text-[12px]">
          Forgot Password?
        </Link>
      </div>

      {/* Login button */}
      <button
        type="submit"
        onClick={handleSubmit(onSubmit)}
        disabled={isLoginPending}
        className="btn-primary mb-4"
      >
        {isLoginPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Logging in...
          </span>
        ) : (
          "LOGIN"
        )}
      </button>

      {/* Sign up link */}
      <p className="text-center text-[14px] font-medium tracking-[-0.56px] leading-[28px] text-neutral-black">
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" className="link-yellow">
          Sign up here
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
