"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginFormData } from "@/lib/validators/auth.validators";
import { authService } from "@/lib/api";
const REMEMBER_EMAIL_KEY = "shopa_vendor_remembered_email";
const REMEMBER_PASSWORD_KEY = "shopa_vendor_remembered_password";

function VendorLoginForm() {
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    const savedPassword = localStorage.getItem(REMEMBER_PASSWORD_KEY);
    if (savedEmail && savedPassword) {
      setValue("email", savedEmail);
      setValue("password", savedPassword);
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.login(data);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, data.email);
        localStorage.setItem(REMEMBER_PASSWORD_KEY, data.password);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
        localStorage.removeItem(REMEMBER_PASSWORD_KEY);
      }
      router.replace("/vendor/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Incorrect email or password";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-[10px]">
        <h2 className="font-satoshi font-bold text-[20px] text-[#151515] leading-[1.35]">
          VENDOR LOGIN
        </h2>
        <p className="text-[#9B9B9B] text-[14px] font-medium tracking-[-0.04em] leading-[28px]">
          Sign in to your vendor account
        </p>
        {error && (
          <p className="text-[#FDC500] text-[14px] font-medium leading-[28px] mt-1">{error}</p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-[10px] mb-[10px]">
        <div className="space-y-[5px]">
          <label className="label-field">
            Email<span className="text-[#FDC500]">*</span>
          </label>
          <input
            {...register("email")}
            type="email"
            inputMode="email"
            placeholder="Enter your email address"
            className="input-field"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-[#FDC500] text-[11px]">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-[5px]">
          <label className="label-field">
            Password<span className="text-[#FDC500]">*</span>
          </label>
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

        <div className="flex items-center justify-between pt-[4px]">
          <label className="flex items-center gap-[5px] cursor-pointer py-[10px] pr-[10px]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-[16px] h-[16px] rounded-sm border border-[#9B9B9B] accent-primary"
            />
            <span className="text-[#151515] text-[12px] tracking-[-0.04em]">Remember Me</span>
          </label>
          <Link
            href="/vendor/forgot-password"
            className="text-[#FDC500] font-semibold text-[12px] py-[10px] pl-[10px] tracking-[-0.04em]"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[45px] bg-[#2E7D32] text-white rounded-[8px] font-semibold text-[14px] hover:bg-[#1D5620] active:bg-[#1D5620] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Logging in...
            </>
          ) : (
            "LOGIN"
          )}
        </button>
      </form>

      {/* Sign-up link only shown in dev/monorepo — hidden on the vendor subdomain */}
      {process.env.NEXT_PUBLIC_APP_ROLE !== "vendor" && (
        <p className="text-center text-[14px] font-medium tracking-[-0.04em] leading-[28px] text-[#151515] mt-[10px]">
          Don&apos;t have a vendor account?{" "}
          <Link href="/vendor/signup" className="text-[#FDC500] font-semibold underline">
            Sign up here
          </Link>
        </p>
      )}

      <p className="text-center text-[13px] font-medium tracking-[-0.04em] leading-[28px] text-[#9B9B9B] mt-[4px]">
        Are you a customer?{" "}
        <Link href="/login" className="text-[#2E7D32] font-semibold underline">
          Customer Login
        </Link>
      </p>
    </div>
  );
}

export default function VendorLoginPage() {
  return (
    <Suspense>
      <VendorLoginForm />
    </Suspense>
  );
}
