"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { signupSchema, type SignupFormData } from "@/lib/validators/auth.validators";
import { apiClient } from "@/lib/api";
import SuccessModal from "@/components/shared/SuccessModal";

interface University {
  id: string;
  name: string;
}

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiClient.get<University[]>("/universities").then((res) => {
      setUniversities(res.data);
    }).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    if (!agreedToTerms) return;
    setIsLoading(true);
    setError(null);
    try {
      const { confirmPassword, ...payload } = data;
      await apiClient.post("/auth/register", payload);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <SuccessModal
        message="Sign up successful! Check your mail inbox for a verification email."
        onClose={() => router.push("/login")}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-satoshi font-bold text-[20px] text-neutral-black leading-none mb-1">
          SIGN UP
        </h2>
        <p className="text-neutral-gray text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          Create a new Shopa account
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[12px]">
          {error}
        </div>
      )}

      <div className="space-y-[10px] mb-[10px]">
        {/* Full name */}
        <div className="space-y-[5px]">
          <label className="label-field">
            Enter your full name<span className="text-secondary">*</span>
          </label>
          <input
            {...register("firstName")}
            type="text"
            placeholder="Enter full name"
            className="input-field"
            autoComplete="name"
          />
          {errors.firstName && (
            <p className="text-red-500 text-[11px]">{errors.firstName.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-[5px]">
          <label className="label-field">
            Enter your contact phone number<span className="text-secondary">*</span>
          </label>
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
          <label className="label-field">
            Enter your contact email address<span className="text-secondary">*</span>
          </label>
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

        {/* Create Password */}
        <div className="space-y-[5px]">
          <label className="label-field">
            Create Password<span className="text-secondary">*</span>
          </label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your 4-digit password"
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

        {/* Confirm Password */}
        <div className="space-y-[5px]">
          <label className="label-field">
            Confirm Password<span className="text-secondary">*</span>
          </label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm your 4-digit password"
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

        {/* University */}
        <div className="space-y-[5px]">
          <label className="label-field">
            Select your university<span className="text-secondary">*</span>
          </label>
          <div className="relative">
            <select
              {...register("university")}
              className="input-field appearance-none pr-10"
              defaultValue=""
            >
              <option value="" disabled>Select your university</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-gray pointer-events-none"
            />
          </div>
          {errors.university && (
            <p className="text-red-500 text-[11px]">{errors.university.message}</p>
          )}
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-[6px] cursor-pointer mb-6 mt-3">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="w-[14px] h-[14px] mt-1 rounded-sm border border-neutral-gray accent-primary shrink-0"
        />
        <span className="text-neutral-black text-[12px] tracking-[-0.48px] leading-[22px]">
          Yes, I agree to the{" "}
          <Link href="/terms" className="link-yellow">Terms and Conditions</Link>
          {" "}& {" "}
          <Link href="/terms" className="link-yellow">Privacy Policy</Link>
        </span>
      </label>

      {/* Sign up button */}
      <button
        type="submit"
        onClick={handleSubmit(onSubmit)}
        disabled={isLoading || !agreedToTerms}
        className="btn-primary mb-4"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Creating account...
          </span>
        ) : (
          "SIGN UP"
        )}
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
