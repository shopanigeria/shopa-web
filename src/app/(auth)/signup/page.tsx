"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signupSchema, type SignupFormData } from "@/lib/validators/auth.validators";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { signup, isSignupPending, signupError, googleAuth } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupFormData) => {
    if (!agreedToTerms) return;
    const { confirmPassword, ...payload } = data;
    signup(payload);
  };

  const errorMessage =
    (signupError as any)?.response?.data?.message ?? (signupError as any)?.message;

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h2
          className="text-[20px] text-neutral-black leading-none mb-1"
          style={{ fontFamily: "Satoshi, sans-serif", fontWeight: 700 }}
        >
          SIGN UP
        </h2>
        <p className="text-neutral-gray text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Create a new Shopa account
        </p>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[12px]">
          {errorMessage}
        </div>
      )}

      <div className="space-y-[10px] mb-[10px]">
        {/* Full name */}
        <div className="space-y-[5px]">
          <label className="label-field">Enter your full name*</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                {...register("firstName")}
                type="text"
                placeholder="First name"
                className="input-field"
                autoComplete="given-name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-[11px] mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div className="flex-1">
              <input
                {...register("lastName")}
                type="text"
                placeholder="Last name"
                className="input-field"
                autoComplete="family-name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-[11px] mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-[5px]">
          <label className="label-field">Enter your contact phone number*</label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="0XXXXXXXXXX"
            className="input-field"
            autoComplete="tel"
          />
          {errors.phone && (
            <p className="text-red-500 text-[11px]">{errors.phone.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-[5px]">
          <label className="label-field">Enter your contact email address*</label>
          <input
            {...register("email")}
            type="email"
            placeholder="example@mail.com"
            className="input-field"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-red-500 text-[11px]">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-[5px]">
          <label className="label-field">Create Password*</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
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

        {/* Confirm password */}
        <div className="space-y-[5px]">
          <label className="label-field">Confirm Password*</label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm your password"
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

      {/* Terms */}
      <label className="flex items-start gap-[5px] cursor-pointer mb-6">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="w-4 h-4 mt-1 accent-primary shrink-0"
        />
        <span className="text-neutral-black text-[12px] tracking-[-0.48px] leading-[28px]">
          Yes, I agree to the{" "}
          <Link href="/terms" className="link-yellow">Terms and Conditions</Link>
          {" "}& {" "}
          <Link href="/terms" className="link-yellow">Privacy Policy</Link>
        </span>
      </label>

      {/* Sign up button */}
      <button
        onClick={handleSubmit(onSubmit)}
        disabled={isSignupPending || !agreedToTerms}
        className="btn-primary mb-4"
      >
        {isSignupPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Creating account...
          </span>
        ) : (
          "SIGN UP"
        )}
      </button>

      {/* Google */}
      <button
        onClick={() => googleAuth()}
        type="button"
        className="w-full flex items-center justify-center gap-3 border border-neutral-light rounded-lg py-[13px] px-[10px] text-neutral-black text-[14px] font-semibold hover:bg-neutral-light/50 transition-colors mb-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Sign in link */}
      <p className="text-center text-[14px] font-medium tracking-[-0.56px] leading-[28px] text-neutral-black">
        Already have an account?{" "}
        <Link href="/login" className="link-yellow">
          Sign in here
        </Link>
      </p>
    </div>
  );
}
