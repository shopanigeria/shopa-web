"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Eye, EyeOff, Loader2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { signupSchema, type SignupFormData } from "@/lib/validators/auth.validators";
import { apiClient } from "@/lib/api";
import SuccessModal from "@/components/shared/SuccessModal";
import { toast } from "sonner";

interface Campus {
  id: string;
  name: string;
}

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusesLoading, setCampusesLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const FALLBACK_CAMPUSES: Campus[] = [{ id: "", name: "Crawford University" }];

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    apiClient.get<Campus[]>("/campuses", { signal: controller.signal }).then((res) => {
      if (res.data && res.data.length > 0) {
        setCampuses(res.data);
      } else {
        setCampuses(FALLBACK_CAMPUSES);
      }
    }).catch(() => {
      setCampuses(FALLBACK_CAMPUSES);
    }).finally(() => {
      clearTimeout(timeout);
      setCampusesLoading(false);
    });

    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const handleNext = async () => {
    const valid = await trigger(["firstName", "lastName", "phone"]);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms and Conditions");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        password: data.password,
        ...(data.campusId ? { campusId: data.campusId } : {}),
      };
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
      <div className="relative text-center mb-[10px]">
        {step === 2 && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-[#151515]"
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <h2 className="font-satoshi font-bold text-[20px] text-[#151515] leading-[1.35]">
          SIGN UP
        </h2>
        <p className="text-[#9B9B9B] text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
          {step === 1 ? "Create a new Shopa account" : "Set up your login details"}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-[6px] mb-[20px]">
        <div className="h-[4px] w-[40px] rounded-full bg-[#2E7D32]" />
        <div className={`h-[4px] w-[40px] rounded-full ${step === 2 ? "bg-[#2E7D32]" : "bg-[#EAEAEA]"}`} />
      </div>

      {error && (
        <p className="text-[#FDC500] text-[14px] font-medium text-center mb-[10px]">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit, (errs) => {
        const first = Object.values(errs)[0];
        toast.error((first?.message as string) ?? "Please fill in all required fields");
      })}>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="space-y-[5px] mb-[10px]">
            {/* First name */}
            <div className="space-y-[5px]">
              <label className="label-field">
                First name<span className="text-[#FDC500]">*</span>
              </label>
              <input
                {...register("firstName")}
                type="text"
                placeholder="Enter first name"
                className="input-field"
                autoComplete="given-name"
              />
              {errors.firstName && (
                <p className="text-[#FDC500] text-[11px]">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last name */}
            <div className="space-y-[5px]">
              <label className="label-field">
                Last name<span className="text-[#FDC500]">*</span>
              </label>
              <input
                {...register("lastName")}
                type="text"
                placeholder="Enter last name"
                className="input-field"
                autoComplete="family-name"
              />
              {errors.lastName && (
                <p className="text-[#FDC500] text-[11px]">{errors.lastName.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-[5px]">
              <label className="label-field">
                Phone number<span className="text-[#FDC500]">*</span>
              </label>
              <input
                {...register("phone")}
                type="tel"
                inputMode="tel"
                placeholder="0XXXXXXXXXX"
                className="input-field"
                autoComplete="tel"
              />
              {errors.phone && (
                <p className="text-[#FDC500] text-[11px]">{errors.phone.message}</p>
              )}
            </div>

            {/* University */}
            <div className="space-y-[5px]">
              <label className="label-field">
                Select your university<span className="text-[#FDC500]">*</span>
              </label>
              <div className="relative">
                <select
                  {...register("campusId")}
                  className="input-field appearance-none pr-10"
                  defaultValue=""
                  disabled={campusesLoading}
                >
                  {campusesLoading ? (
                    <option value="" disabled>Loading universities...</option>
                  ) : (
                    <>
                      {campuses.length > 1 && <option value="" disabled>Select your university</option>}
                      {campuses.map((c) => (
                        <option key={c.id || "fallback"} value={c.id}>{c.name}</option>
                      ))}
                    </>
                  )}
                </select>
                <ChevronDown
                  size={24}
                  className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#151515] pointer-events-none"
                />
              </div>
              {errors.campusId && (
                <p className="text-[#FDC500] text-[11px]">{errors.campusId.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full h-[45px] bg-[#2E7D32] text-white rounded-[8px] font-semibold text-[14px] hover:bg-[#1D5620] active:bg-[#1D5620] transition-colors duration-150 mt-[10px]"
            >
              NEXT
            </button>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="space-y-[5px] mb-[10px]">
            {/* Email */}
            <div className="space-y-[5px]">
              <label className="label-field">
                Email address<span className="text-[#FDC500]">*</span>
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="example@mail.com"
                className="input-field"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-[#FDC500] text-[11px]">{errors.email.message}</p>
              )}
            </div>

            {/* Confirm Email */}
            <div className="space-y-[5px]">
              <label className="label-field">
                Confirm Email address<span className="text-[#FDC500]">*</span>
              </label>
              <input
                {...register("confirmEmail")}
                type="email"
                placeholder="Re-enter your email"
                className="input-field"
                autoComplete="email"
              />
              {errors.confirmEmail && (
                <p className="text-[#FDC500] text-[11px]">{errors.confirmEmail.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-[5px]">
              <label className="label-field">
                Create Password<span className="text-[#FDC500]">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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

            {/* Confirm Password */}
            <div className="space-y-[5px]">
              <label className="label-field">
                Confirm Password<span className="text-[#FDC500]">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
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

            {/* Terms checkbox */}
            <label className="flex items-start gap-[5px] cursor-pointer py-[10px] pr-[10px]">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-[16px] h-[16px] mt-[2px] rounded-sm border border-[#9B9B9B] accent-primary shrink-0"
              />
              <span className="text-[#151515] text-[14px] font-medium tracking-[-0.56px] leading-[28px]">
                Yes, I agree to the Terms and Conditions &amp; Privacy Policy
              </span>
            </label>

            {/* Sign Up button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[45px] bg-[#2E7D32] text-white rounded-[8px] font-semibold text-[14px] text-center hover:bg-[#1D5620] active:bg-[#1D5620] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                "SIGN UP"
              )}
            </button>
          </div>
        )}

        {/* Sign in link */}
        <p className="text-center text-[14px] font-medium tracking-[-0.56px] leading-[28px] text-[#151515] mt-[10px]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#FDC500] font-semibold underline">
            Sign in here
          </Link>
        </p>
      </form>
    </div>
  );
}
