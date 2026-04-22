"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormData } from "@/lib/validators/auth.validators";
import SuccessModal from "@/components/shared/SuccessModal";

const REMEMBER_EMAIL_KEY = "shopa_remembered_email";
const REMEMBER_PASSWORD_KEY = "shopa_remembered_password";

function LoginForm() {
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoginPending, loginError } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isVerified = searchParams.get("verified") === "true";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    const savedPassword = localStorage.getItem(REMEMBER_PASSWORD_KEY);
    if (savedEmail && savedPassword) {
      setValue("email", savedEmail);
      setValue("password", savedPassword);
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = (data: LoginFormData) => {
    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, data.email);
      localStorage.setItem(REMEMBER_PASSWORD_KEY, data.password);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
      localStorage.removeItem(REMEMBER_PASSWORD_KEY);
    }
    login(data);
  };

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
      <div className="text-center mb-[10px]">
        <h2 className="font-satoshi font-bold text-[20px] text-[#151515] leading-[1.35]">
          LOGIN
        </h2>
        <p className="text-[#9B9B9B] text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Sign in to your Shopa account
        </p>
        {errorMessage && (
          <p className="text-[#FDC500] text-[14px] font-medium leading-[28px] mt-0">
            Incorrect Email or Password!
          </p>
        )}
      </div>

      <div className="space-y-[10px] mb-[10px]">
        {/* Email or Phone */}
        <div className="space-y-[5px]">
          <label className="label-field">Email or Phone</label>
          <input
            {...register("email")}
            type="text"
            inputMode="email"
            placeholder="Enter your email or phone number"
            className="input-field"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-[#FDC500] text-[11px]">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-[5px]">
          <label className="label-field">Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="input-field pr-10"
              autoComplete="current-password"
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
      </div>

      {/* Remember me + Forgot Password */}
      <div className="flex items-center justify-between mb-6">
        <label className="flex items-center gap-[5px] cursor-pointer py-[10px] pr-[10px]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-[16px] h-[16px] rounded-sm border border-[#9B9B9B] accent-primary"
          />
          <span className="text-[#151515] text-[12px] tracking-[-0.48px]">Remember Me</span>
        </label>
        <Link
          href="/forgot-password"
          className="text-[#FDC500] font-semibold text-[12px] py-[10px] pl-[10px]"
        >
          Forgot Password?
        </Link>
      </div>

      {/* LOGIN button — full width */}
      <button
        type="submit"
        onClick={handleSubmit(onSubmit)}
        disabled={isLoginPending}
        className="w-full h-[45px] bg-[#2E7D32] text-white rounded-[8px] font-semibold text-[14px] text-center hover:bg-[#1D5620] active:bg-[#1D5620] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
      >
        {isLoginPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Logging in...
          </>
        ) : (
          "LOGIN"
        )}
      </button>

      {/* Sign up link */}
      <p className="text-center text-[14px] font-medium tracking-[-0.56px] leading-[28px] text-[#151515]">
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" className="text-[#FDC500] font-semibold underline">
          Sign up here
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
