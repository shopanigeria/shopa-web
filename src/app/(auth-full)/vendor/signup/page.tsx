"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown, Eye, EyeOff, Loader2, Check, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/lib/api/client";
import { authService } from "@/lib/api";
import SuccessModal from "@/components/shared/SuccessModal";
import { toast } from "sonner";

interface Campus {
  id: string;
  name: string;
}

const SELLING_CATEGORIES = [
  "Fashion & Clothing",
  "Gadgets & Electronics",
  "Body Care & Beauty",
  "Food & Provisions",
  "Books & Stationery",
  "Sports & Fitness",
  "Accessories",
  "Others",
];

const STOCK_TYPE_OPTIONS = [
  { value: "preorder", label: "Pre-order" },
  { value: "in-stock", label: "In-stock" },
  { value: "both", label: "Both" },
] as const;

const MAX_PREORDER_OPTIONS = [
  "1 week", "2 weeks", "3 weeks", "4 weeks", "More than 4 weeks",
];

const step1Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  phone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number"),
  email: z.string().email("Enter a valid email address"),
  campusId: z.string().optional(),
});

const step3Schema = z
  .object({
    matricNumber: z.string().min(3, "Matric/student number is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
    agreedToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the Terms and Conditions" }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Step1Data = z.infer<typeof step1Schema>;
type Step3Data = z.infer<typeof step3Schema>;

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center mb-[20px]">
      {([1, 2, 3] as const).map((n, i) => {
        const done = current > n;
        const active = current === n;
        return (
          <div key={n} className="flex items-center">
            <div
              className={`w-[28px] h-[28px] rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-colors
                ${done ? "bg-[#2E7D32] border-[#2E7D32] text-white" : active ? "border-[#2E7D32] text-[#2E7D32] bg-white" : "border-[#EAEAEA] text-[#9B9B9B] bg-white"}`}
            >
              {done ? <Check size={14} strokeWidth={3} /> : n}
            </div>
            {i < 2 && (
              <div className={`w-[32px] h-[2px] ${current > n ? "bg-[#2E7D32]" : "bg-[#EAEAEA]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function VendorSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusesLoading, setCampusesLoading] = useState(true);
  const FALLBACK_CAMPUSES: Campus[] = [{ id: "", name: "Crawford University" }];

  // Step 2 state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [stockType, setStockType] = useState<"preorder" | "in-stock" | "both" | null>(null);
  const [maxPreorderTime, setMaxPreorderTime] = useState("");
  const [longerPreorderDetail, setLongerPreorderDetail] = useState("");
  const [description, setDescription] = useState("");
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  // Step 3 state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [studentIdPreview, setStudentIdPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    apiClient
      .get<Campus[]>("/campuses", { signal: controller.signal })
      .then((res) => setCampuses(res.data?.length ? res.data : FALLBACK_CAMPUSES))
      .catch(() => setCampuses(FALLBACK_CAMPUSES))
      .finally(() => { clearTimeout(timeout); setCampusesLoading(false); });
    return () => { controller.abort(); clearTimeout(timeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudentIdFile(file);
    setStudentIdPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (selectedCategories.length === 0) errs.categories = "Select at least one category";
    if (!description.trim() || description.trim().length < 10)
      errs.description = "Please describe your items (min 10 characters)";
    if (!stockType) errs.stockType = "Select a stock type";
    if ((stockType === "preorder" || stockType === "both") && !maxPreorderTime)
      errs.maxPreorderTime = "Select maximum preorder time";
    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Next = form1.handleSubmit((data) => {
    setStep1Data(data);
    setStep(2);
  });

  const handleStep2Next = () => {
    if (validateStep2()) setStep(3);
  };

  const handleFinish = form3.handleSubmit(async (data) => {
    if (!step1Data) return;
    if (!studentIdFile) { toast.error("Please upload your student ID"); return; }

    setIsLoading(true);
    try {
      await apiClient.post("/auth/register", {
        firstName: step1Data.firstName,
        lastName: step1Data.lastName,
        phone: step1Data.phone,
        email: step1Data.email,
        password: data.password,
        ...(step1Data.campusId ? { campusId: step1Data.campusId } : {}),
      });

      await authService.login({ email: step1Data.email, password: data.password });

      let studentIdUrl = "";
      try {
        const formData = new FormData();
        formData.append("image", studentIdFile);
        const uploadRes = await apiClient.post<{ url: string }>("/upload/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        studentIdUrl = uploadRes.data?.url ?? "";
      } catch { /* non-fatal */ }

      await apiClient.post("/vendors/apply", {
        storeName: step1Data.storeName,
        description,
        categories: selectedCategories,
        stockType,
        ...(maxPreorderTime ? { maxPreorderTime } : {}),
        ...(longerPreorderDetail ? { longerPreorderDetail } : {}),
        matricNumber: data.matricNumber,
        ...(studentIdUrl ? { studentIdUrl } : {}),
      });

      setShowSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Something went wrong. Please try again.";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsLoading(false);
    }
  });

  if (showSuccess) {
    return (
      <SuccessModal
        message="Application submitted! Our team will review your details and reach out within 48 hours."
        onClose={() => router.push("/vendor/login")}
      />
    );
  }

  const titles: Record<1 | 2 | 3, string> = {
    1: "VENDOR SIGN UP",
    2: "YOUR STORE",
    3: "VERIFICATION",
  };
  const subtitles: Record<1 | 2 | 3, string> = {
    1: "Create your vendor account",
    2: "Tell us about what you sell",
    3: "Confirm your identity",
  };

  return (
    <div>
      {/* Header */}
      <div className="relative text-center mb-[10px]">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-[#151515]"
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <h2 className="font-satoshi font-bold text-[20px] text-[#151515] leading-[1.35]">
          {titles[step]}
        </h2>
        <p className="text-[#9B9B9B] text-[14px] font-medium tracking-[-0.04em] leading-[28px]">
          {subtitles[step]}
        </p>
      </div>

      <StepIndicator current={step} />

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="space-y-[8px]">
          <div className="space-y-[5px]">
            <label className="label-field">First name<span className="text-[#FDC500]">*</span></label>
            <input {...form1.register("firstName")} type="text" placeholder="Enter first name" className="input-field" autoComplete="given-name" />
            {form1.formState.errors.firstName && <p className="text-[#FDC500] text-[11px]">{form1.formState.errors.firstName.message}</p>}
          </div>

          <div className="space-y-[5px]">
            <label className="label-field">Last name<span className="text-[#FDC500]">*</span></label>
            <input {...form1.register("lastName")} type="text" placeholder="Enter last name" className="input-field" autoComplete="family-name" />
            {form1.formState.errors.lastName && <p className="text-[#FDC500] text-[11px]">{form1.formState.errors.lastName.message}</p>}
          </div>

          <div className="space-y-[5px]">
            <label className="label-field">Store name<span className="text-[#FDC500]">*</span></label>
            <input {...form1.register("storeName")} type="text" placeholder="Enter your store name" className="input-field" />
            {form1.formState.errors.storeName && <p className="text-[#FDC500] text-[11px]">{form1.formState.errors.storeName.message}</p>}
          </div>

          <div className="space-y-[5px]">
            <label className="label-field">Phone number<span className="text-[#FDC500]">*</span></label>
            <input {...form1.register("phone")} type="tel" inputMode="tel" placeholder="0XXXXXXXXXX" className="input-field" autoComplete="tel" />
            {form1.formState.errors.phone && <p className="text-[#FDC500] text-[11px]">{form1.formState.errors.phone.message}</p>}
          </div>

          <div className="space-y-[5px]">
            <label className="label-field">Email address<span className="text-[#FDC500]">*</span></label>
            <input {...form1.register("email")} type="email" placeholder="example@mail.com" className="input-field" autoComplete="email" />
            {form1.formState.errors.email && <p className="text-[#FDC500] text-[11px]">{form1.formState.errors.email.message}</p>}
          </div>

          <div className="space-y-[5px]">
            <label className="label-field">Select your university<span className="text-[#FDC500]">*</span></label>
            <div className="relative">
              <select {...form1.register("campusId")} className="input-field appearance-none pr-10" defaultValue="" disabled={campusesLoading} aria-label="Select university" title="Select university">
                {campusesLoading ? (
                  <option value="" disabled>Loading universities...</option>
                ) : (
                  <>
                    {campuses.length > 1 && <option value="" disabled>Select your university</option>}
                    {campuses.map((c) => <option key={c.id || "fallback"} value={c.id}>{c.name}</option>)}
                  </>
                )}
              </select>
              <ChevronDown size={24} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#151515] pointer-events-none" />
            </div>
          </div>

          <button type="button" onClick={handleStep1Next} className="w-full h-[45px] bg-[#2E7D32] text-white rounded-[8px] font-semibold text-[14px] hover:bg-[#1D5620] transition-colors mt-[8px]">
            NEXT
          </button>

          <p className="text-center text-[14px] font-medium tracking-[-0.04em] leading-[28px] text-[#151515] mt-[8px]">
            Already have an account?{" "}
            <Link href="/vendor/login" className="text-[#FDC500] font-semibold underline">Sign in here</Link>
          </p>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="space-y-[16px]">
          <div className="space-y-[8px]">
            <label className="font-jakarta text-[14px] font-medium text-[#333333] tracking-[-0.04em]">
              What are you selling?<span className="text-[#FDC500]">*</span>
            </label>
            <div className="flex flex-wrap gap-[8px]">
              {SELLING_CATEGORIES.map((cat) => {
                const selected = selectedCategories.includes(cat);
                return (
                  <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                    className={`px-[12px] py-[6px] rounded-[6px] text-[13px] font-jakarta font-medium tracking-[-0.04em] border transition-colors
                      ${selected ? "bg-[#2E7D32] text-white border-[#2E7D32]" : "bg-white text-[#333333] border-[#EAEAEA] hover:border-[#2E7D32]"}`}>
                    {selected && <Check size={12} className="inline mr-[4px]" strokeWidth={3} />}{cat}
                  </button>
                );
              })}
            </div>
            {step2Errors.categories && <p className="text-[#FDC500] text-[11px]">{step2Errors.categories}</p>}
          </div>

          <div className="space-y-[5px]">
            <label className="font-jakarta text-[14px] font-medium text-[#333333] tracking-[-0.04em]">
              Briefly describe your items<span className="text-[#FDC500]">*</span>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you sell..."
              className="w-full rounded-[8px] border border-[#EAEAEA] bg-[#EAEAEA] px-[10px] py-[12px] font-jakarta text-[14px] text-[#333333] placeholder:text-[#C2C2C2] min-h-[90px] resize-none focus:outline-none focus:border-[#2E7D32] focus:bg-white transition-colors" />
            {step2Errors.description && <p className="text-[#FDC500] text-[11px]">{step2Errors.description}</p>}
          </div>

          <div className="space-y-[8px]">
            <label className="font-jakarta text-[14px] font-medium text-[#333333] tracking-[-0.04em]">
              Do you sell preorder, in-stock, or both?<span className="text-[#FDC500]">*</span>
            </label>
            <div className="flex gap-[8px]">
              {STOCK_TYPE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setStockType(opt.value)}
                  className={`flex-1 h-[40px] rounded-[8px] text-[13px] font-jakarta font-medium border transition-colors tracking-[-0.04em]
                    ${stockType === opt.value ? "bg-[#2E7D32] text-white border-[#2E7D32]" : "bg-white text-[#333333] border-[#EAEAEA] hover:border-[#2E7D32]"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            {step2Errors.stockType && <p className="text-[#FDC500] text-[11px]">{step2Errors.stockType}</p>}
          </div>

          {(stockType === "preorder" || stockType === "both") && (
            <div className="space-y-[5px]">
              <label className="font-jakarta text-[14px] font-medium text-[#333333] tracking-[-0.04em]">
                Maximum preorder time<span className="text-[#FDC500]">*</span>
              </label>
              <div className="relative">
                <select value={maxPreorderTime} onChange={(e) => setMaxPreorderTime(e.target.value)}
                  className="input-field appearance-none pr-10" aria-label="Maximum preorder time" title="Maximum preorder time">
                  <option value="" disabled>Select time range</option>
                  {MAX_PREORDER_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <ChevronDown size={20} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#151515] pointer-events-none" />
              </div>
              {step2Errors.maxPreorderTime && <p className="text-[#FDC500] text-[11px]">{step2Errors.maxPreorderTime}</p>}
            </div>
          )}

          {maxPreorderTime === "More than 4 weeks" && (
            <div className="space-y-[5px]">
              <label className="font-jakarta text-[14px] font-medium text-[#333333] tracking-[-0.04em]">Please specify</label>
              <input type="text" value={longerPreorderDetail} onChange={(e) => setLongerPreorderDetail(e.target.value)}
                placeholder="e.g. 6-8 weeks for custom orders" className="input-field" />
            </div>
          )}

          <button type="button" onClick={handleStep2Next} className="w-full h-[45px] bg-[#2E7D32] text-white rounded-[8px] font-semibold text-[14px] hover:bg-[#1D5620] transition-colors">
            NEXT
          </button>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <form onSubmit={handleFinish} className="space-y-[10px]">
          <div className="space-y-[5px]">
            <label className="label-field">Matric / Student number<span className="text-[#FDC500]">*</span></label>
            <input {...form3.register("matricNumber")} type="text" placeholder="Enter your matric number" className="input-field" />
            {form3.formState.errors.matricNumber && <p className="text-[#FDC500] text-[11px]">{form3.formState.errors.matricNumber.message}</p>}
          </div>

          <div className="space-y-[5px]">
            <label className="label-field">Create Password<span className="text-[#FDC500]">*</span></label>
            <div className="relative">
              <input {...form3.register("password")} type={showPassword ? "text" : "password"} placeholder="Enter your password" className="input-field pr-10" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#9B9B9B]" aria-label={showPassword ? "Hide" : "Show"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form3.formState.errors.password && <p className="text-[#FDC500] text-[11px]">{form3.formState.errors.password.message}</p>}
          </div>

          <div className="space-y-[5px]">
            <label className="label-field">Confirm Password<span className="text-[#FDC500]">*</span></label>
            <div className="relative">
              <input {...form3.register("confirmPassword")} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" className="input-field pr-10" autoComplete="new-password" />
              <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#9B9B9B]" aria-label={showConfirmPassword ? "Hide" : "Show"}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form3.formState.errors.confirmPassword && <p className="text-[#FDC500] text-[11px]">{form3.formState.errors.confirmPassword.message}</p>}
          </div>

          <div className="space-y-[8px]">
            <label className="font-jakarta text-[14px] font-medium text-[#333333] tracking-[-0.04em]">
              Upload Student ID<span className="text-[#FDC500]">*</span>
            </label>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" aria-label="Upload student ID" title="Upload student ID" className="hidden" onChange={handleFileSelect} />
            {!studentIdFile ? (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full h-[80px] rounded-[8px] border-2 border-dashed border-[#EAEAEA] flex flex-col items-center justify-center gap-[6px] hover:border-[#2E7D32] transition-colors">
                <Upload size={20} className="text-[#9B9B9B]" />
                <span className="font-jakarta text-[13px] text-[#9B9B9B] tracking-[-0.04em]">Click to upload your student ID</span>
              </button>
            ) : (
              <div className="flex items-center gap-[10px] p-[10px] rounded-[8px] border border-[#EAEAEA] bg-white">
                {studentIdPreview && studentIdFile.type.startsWith("image/") ? (
                  <div className="w-[50px] h-[50px] rounded-[6px] overflow-hidden shrink-0 relative">
                    <Image src={studentIdPreview} alt="Student ID" fill className="object-cover" sizes="50px" />
                  </div>
                ) : (
                  <div className="w-[50px] h-[50px] rounded-[6px] bg-[#EAEAEA] flex items-center justify-center shrink-0">
                    <Upload size={20} className="text-[#9B9B9B]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-jakarta text-[13px] text-[#333333] truncate tracking-[-0.04em]">{studentIdFile.name}</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="font-jakarta text-[12px] text-[#2E7D32] underline tracking-[-0.04em]">Change</button>
                </div>
                <button type="button" aria-label="Remove file" onClick={() => { setStudentIdFile(null); setStudentIdPreview(null); }}>
                  <X size={18} className="text-[#9B9B9B]" />
                </button>
              </div>
            )}
          </div>

          <label className="flex items-start gap-[5px] cursor-pointer py-[8px]">
            <input type="checkbox" {...form3.register("agreedToTerms")} className="w-[16px] h-[16px] mt-[4px] rounded-sm border border-[#9B9B9B] accent-primary shrink-0" />
            <span className="text-[#151515] text-[14px] font-medium tracking-[-0.04em] leading-[24px]">
              Yes, I agree to the{" "}
              <Link href="/terms" className="text-[#FDC500] underline">Terms and Conditions</Link>{" "}
              &amp; Privacy Policy
            </span>
          </label>
          {form3.formState.errors.agreedToTerms && <p className="text-[#FDC500] text-[11px]">{form3.formState.errors.agreedToTerms.message}</p>}

          <button type="submit" disabled={isLoading}
            className="w-full h-[45px] bg-[#2E7D32] text-white rounded-[8px] font-semibold text-[14px] hover:bg-[#1D5620] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-[4px]">
            {isLoading ? (<><Loader2 size={16} className="animate-spin" />Submitting...</>) : "FINISH"}
          </button>
        </form>
      )}
    </div>
  );
}
