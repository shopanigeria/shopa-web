"use client";

import Link from "next/link";
import Image from "next/image";
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

const APP_ROLE = process.env.NEXT_PUBLIC_APP_ROLE;

// ── Role-aware copy ───────────────────────────────────────────────────────────

const PORTAL_CONFIG = {
  customer: {
    title: "LOGIN",
    subtitle: "Sign in to your Shopa account",
    emailLabel: "Email or Phone",
    emailPlaceholder: "Enter your email or phone number",
    showSignUpLink: true,
    showVendorLink: true,
    showAdminLink: true,
  },
  vendor: {
    title: "VENDOR LOGIN",
    subtitle: "Sign in to your vendor dashboard",
    emailLabel: "Email",
    emailPlaceholder: "Enter your vendor email",
    showSignUpLink: false,
    showVendorLink: false,
    showAdminLink: false,
  },
  admin: {
    title: "University Admin Portal",
    subtitle: "Sign in with your admin credentials",
    emailLabel: "Email Address",
    emailPlaceholder: "Enter your admin email",
    showSignUpLink: false,
    showVendorLink: false,
    showAdminLink: false,
  },
  superadmin: {
    title: "Super Admin",
    subtitle: "Shopa Platform Administration",
    emailLabel: "Email Address",
    emailPlaceholder: "Enter your super admin email",
    showSignUpLink: false,
    showVendorLink: false,
    showAdminLink: false,
  },
} as const;

type PortalRole = keyof typeof PORTAL_CONFIG;

function getConfig() {
  const role = (APP_ROLE ?? "customer") as PortalRole;
  return PORTAL_CONFIG[role] ?? PORTAL_CONFIG.customer;
}

// ── Shared form fields ────────────────────────────────────────────────────────

function LoginForm() {
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoginPending, loginError, portalError } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isVerified = searchParams.get("verified") === "true";
  const config = getConfig();

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

  const apiError =
    (loginError as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ??
    (loginError as { message?: string })?.message;

  // portalError is set when a user logs into the wrong portal
  const displayError = portalError ?? (apiError ? "Incorrect Email or Password!" : null);

  if (isVerified) {
    return (
      <SuccessModal
        message="Email verified successfully! You can now sign in."
        onClose={() => router.replace("/login")}
      />
    );
  }

  const isAdminPortal = APP_ROLE === "admin" || APP_ROLE === "superadmin";

  return (
    <div>
      {/* Header */}
      <div className={`text-center mb-[10px] ${isAdminPortal ? "mb-[24px]" : ""}`}>
        {isAdminPortal && (
          <div className="flex justify-center mb-[16px]">
            <Image src="/images/logo.svg" alt="Shopa" width={90} height={32} priority />
          </div>
        )}
        <h2 className={`font-satoshi font-bold leading-[1.35] ${isAdminPortal ? "text-[22px] text-[#151515]" : "text-[20px] text-[#151515]"}`}>
          {config.title}
        </h2>
        <p className="text-[#9B9B9B] text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          {config.subtitle}
        </p>
        {displayError && (
          <p className="text-[#E53935] text-[13px] font-medium leading-[24px] mt-[4px] bg-[#FFEBEE] rounded-[6px] px-[12px] py-[6px]">
            {displayError}
          </p>
        )}
      </div>

      <div className="space-y-[10px] mb-[10px]">
        {/* Email / Phone */}
        <div className="space-y-[5px]">
          <label className="label-field">{config.emailLabel}</label>
          <input
            {...register("email")}
            type="text"
            inputMode="email"
            placeholder={config.emailPlaceholder}
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
        <Link href="/forgot-password" className="text-[#FDC500] font-semibold text-[12px] py-[10px] pl-[10px]">
          Forgot Password?
        </Link>
      </div>

      {/* Submit */}
      <button
        type="submit"
        onClick={handleSubmit(onSubmit)}
        disabled={isLoginPending}
        className="w-full h-[45px] bg-[#2E7D32] text-white rounded-[8px] font-semibold text-[14px] text-center hover:bg-[#1D5620] active:bg-[#1D5620] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
      >
        {isLoginPending ? (
          <><Loader2 size={16} className="animate-spin" /> Signing in...</>
        ) : (
          "LOGIN"
        )}
      </button>

      {/* Customer-only links */}
      {config.showSignUpLink && (
        <p className="text-center text-[14px] font-medium tracking-[-0.56px] leading-[28px] text-[#151515]">
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="text-[#FDC500] font-semibold underline">Sign up here</Link>
        </p>
      )}
      {config.showVendorLink && (
        <p className="text-center text-[13px] font-medium tracking-[-0.04em] leading-[28px] text-[#9B9B9B] mt-[4px]">
          Are you a vendor?{" "}
          <Link href="/vendor/login" className="text-[#2E7D32] font-semibold underline">Vendor Login</Link>
        </p>
      )}
      {config.showAdminLink && (
        <p className="text-center text-[13px] font-medium tracking-[-0.04em] leading-[28px] text-[#9B9B9B] mt-[2px]">
          Are you a campus admin?{" "}
          <Link href="/admin/mock-login" className="text-[#2E7D32] font-semibold underline">Admin Login</Link>
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
