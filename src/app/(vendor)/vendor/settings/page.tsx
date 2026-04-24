"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, User, Store, Lock, Bell, Landmark, LogOut, X, Check, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface VendorProfile {
  storeName: string;
  description?: string;
  logoUrl?: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

type Section = "menu" | "store" | "personal" | "password" | "notifications" | "bank" | "signout";

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_VENDOR: VendorProfile = { storeName: "Lorem Stores", description: "We sell quality fashion items." };
const MOCK_USER: UserProfile = { firstName: "Lorem", lastName: "Stores", phone: "08012345678", email: "vendor@shopa.test" };

// ── Shared components ──────────────────────────────────────────────────────

function SectionHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="bg-[#2E7D32] rounded-b-[12px] h-[90px] flex items-center px-[20px] gap-[12px]">
      <button type="button" aria-label="Go back" onClick={onBack} className="text-white">
        <ChevronLeft size={24} strokeWidth={2} />
      </button>
      <span className="font-jakarta text-[16px] font-semibold text-white leading-[1.26] tracking-[-0.04em]">
        {title}
      </span>
    </div>
  );
}

function Backdrop({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />;
}

function SuccessModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] border border-[#2E7D32] px-[32px] pt-[32px] pb-[32px] w-full max-w-[360px] relative flex flex-col items-center">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>
          <div className="w-[72px] h-[72px] rounded-full bg-[#2E7D32] flex items-center justify-center mb-[20px]">
            <Check size={36} className="text-white" strokeWidth={3} />
          </div>
          <p className="font-jakarta text-[14px] font-semibold text-[#2E7D32] text-center leading-[1.6] tracking-[-0.04em]">
            {message}
          </p>
        </div>
      </div>
    </>
  );
}

const inputClass = "w-full rounded-[8px] border border-[#EAEAEA] bg-white px-[14px] py-[14px] font-jakarta text-[14px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32]";
const labelClass = "font-jakarta text-[13px] font-bold text-[#151515] tracking-[-0.04em] mb-[8px] block";

// ── Store profile section ──────────────────────────────────────────────────

function StoreProfile({ vendor, isMock, onBack }: { vendor: VendorProfile; isMock: boolean; onBack: () => void }) {
  const queryClient = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const [storeName, setStoreName] = useState(vendor.storeName);
  const [description, setDescription] = useState(vendor.description ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(vendor.logoUrl ?? null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!storeName.trim()) { toast.error("Store name is required."); return; }
    if (isMock) { setSuccess(true); return; }
    setSubmitting(true);
    try {
      let logoUrl: string | undefined;
      if (logoFile) {
        const fd = new FormData();
        fd.append("image", logoFile);
        const { data } = await apiClient.post("/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
        logoUrl = data?.url ?? data?.data?.url;
      }
      await apiClient.patch("/vendors/me", {
        storeName: storeName.trim(),
        description: description.trim(),
        ...(logoUrl && { logoUrl }),
      });
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
      setSuccess(true);
    } catch {
      toast.error("Failed to save store profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <SectionHeader title="Store Profile" onBack={onBack} />
      <div className="px-[20px] pt-[24px] pb-[40px] flex flex-col gap-[20px]">
        {/* Logo */}
        <div className="flex flex-col items-center gap-[12px]">
          <div
            className="w-[80px] h-[80px] rounded-full bg-[#EAEAEA] overflow-hidden relative cursor-pointer border-2 border-[#2E7D32]"
            onClick={() => logoRef.current?.click()}
          >
            {logoPreview
              ? <Image src={logoPreview} alt="Store logo" fill className="object-cover" sizes="80px" />
              : <div className="w-full h-full flex items-center justify-center"><Store size={32} className="text-[#9B9B9B]" /></div>
            }
          </div>
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" aria-label="Upload store logo" title="Upload store logo" />
          <button type="button" onClick={() => logoRef.current?.click()}
            className="font-jakarta text-[13px] font-semibold text-[#2E7D32] underline tracking-[-0.04em]">
            {logoPreview ? "Change logo" : "Upload store logo"}
          </button>
        </div>

        {/* Store name */}
        <div>
          <label className={labelClass}>Store Name <span className="text-[#FDC500]">*</span></label>
          <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Enter store name" className={inputClass} />
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Store Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell customers about your store..."
            rows={4}
            title="Store description"
            className="w-full rounded-[8px] border border-[#EAEAEA] bg-white px-[14px] py-[14px] font-jakarta text-[14px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:border-[#2E7D32] resize-none"
          />
        </div>

        <button type="button" onClick={handleSave} disabled={submitting}
          className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors mt-[8px]">
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
      {success && <SuccessModal message="Store profile updated successfully!" onClose={() => { setSuccess(false); onBack(); }} />}
    </div>
  );
}

// ── Personal info section ──────────────────────────────────────────────────

function PersonalInfo({ user, isMock, onBack }: { user: UserProfile; isMock: boolean; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/users/me", { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setSuccess(true);
    },
    onError: () => toast.error("Failed to update personal info."),
  });

  function handleSave() {
    if (!firstName.trim() || !lastName.trim()) { toast.error("Name fields are required."); return; }
    if (isMock) { setSuccess(true); return; }
    mutation.mutate();
  }

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <SectionHeader title="Personal Information" onBack={onBack} />
      <div className="px-[20px] pt-[24px] pb-[40px] flex flex-col gap-[20px]">
        <div>
          <label className={labelClass}>First Name <span className="text-[#FDC500]">*</span></label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Last Name <span className="text-[#FDC500]">*</span></label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email Address</label>
          <input type="email" value={user.email} disabled placeholder="Email address" title="Email address" className={cn(inputClass, "opacity-50 cursor-not-allowed")} />
          <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em] mt-[6px]">Email cannot be changed.</p>
        </div>
        <button type="button" onClick={handleSave} disabled={mutation.isPending}
          className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors mt-[8px]">
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
      {success && <SuccessModal message="Personal info updated successfully!" onClose={() => { setSuccess(false); onBack(); }} />}
    </div>
  );
}

// ── Change password section ────────────────────────────────────────────────

function ChangePassword({ isMock, onBack }: { isMock: boolean; onBack: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/auth/change-password", { currentPassword: current, newPassword: next });
    },
    onSuccess: () => setSuccess(true),
    onError: () => toast.error("Failed to change password. Check your current password."),
  });

  function handleSave() {
    if (!current || !next || !confirm) { toast.error("All fields are required."); return; }
    if (next.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    if (next !== confirm) { toast.error("Passwords do not match."); return; }
    if (isMock) { setSuccess(true); return; }
    mutation.mutate();
  }

  function PasswordInput({ value, onChange, show, onToggle, placeholder }: {
    value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string;
  }) {
    return (
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(inputClass, "pr-[44px]")}
        />
        <button type="button" onClick={onToggle} aria-label="Toggle password visibility"
          className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#9B9B9B]">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <SectionHeader title="Change Password" onBack={onBack} />
      <div className="px-[20px] pt-[24px] pb-[40px] flex flex-col gap-[20px]">
        <div>
          <label className={labelClass}>Current Password</label>
          <PasswordInput value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} placeholder="Enter current password" />
        </div>
        <div>
          <label className={labelClass}>New Password</label>
          <PasswordInput value={next} onChange={setNext} show={showNext} onToggle={() => setShowNext(!showNext)} placeholder="Enter new password (min 8 chars)" />
        </div>
        <div>
          <label className={labelClass}>Confirm New Password</label>
          <PasswordInput value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} placeholder="Re-enter new password" />
          {confirm && next && confirm !== next && (
            <p className="font-jakarta text-[11px] text-[#E53935] tracking-[-0.04em] mt-[6px]">Passwords do not match.</p>
          )}
        </div>
        <button type="button" onClick={handleSave} disabled={mutation.isPending}
          className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors mt-[8px]">
          {mutation.isPending ? "Updating..." : "Update Password"}
        </button>
      </div>
      {success && <SuccessModal message="Password updated successfully!" onClose={() => { setSuccess(false); onBack(); }} />}
    </div>
  );
}

// ── Notification preferences ───────────────────────────────────────────────

function NotificationPrefs({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState({
    newOrder: true,
    orderStatus: true,
    newDispute: true,
    withdrawalUpdate: true,
    promotions: false,
  });
  const [success, setSuccess] = useState(false);

  function Toggle({ value, onChange, label, sub }: { value: boolean; onChange: () => void; label: string; sub: string }) {
    return (
      <div className="flex items-center justify-between py-[14px] border-b border-[#EAEAEA]">
        <div>
          <p className="font-jakarta text-[14px] font-semibold text-[#151515] tracking-[-0.04em]">{label}</p>
          <p className="font-jakarta text-[12px] text-[#9B9B9B] tracking-[-0.04em] mt-[2px]">{sub}</p>
        </div>
        <button type="button" onClick={onChange} aria-label={`Toggle ${label}`}
          className={cn("w-[44px] h-[24px] rounded-full transition-colors relative shrink-0", value ? "bg-[#2E7D32]" : "bg-[#EAEAEA]")}>
          <div className={cn("absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow transition-all", value ? "left-[22px]" : "left-[2px]")} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <SectionHeader title="Notification Preferences" onBack={onBack} />
      <div className="px-[20px] pt-[24px] pb-[40px]">
        <div className="bg-white rounded-[12px] border border-[#EAEAEA] px-[16px] mb-[24px]">
          <Toggle value={prefs.newOrder} onChange={() => setPrefs((p) => ({ ...p, newOrder: !p.newOrder }))}
            label="New Orders" sub="Get notified when a customer places an order" />
          <Toggle value={prefs.orderStatus} onChange={() => setPrefs((p) => ({ ...p, orderStatus: !p.orderStatus }))}
            label="Order Status Updates" sub="Track changes to your order statuses" />
          <Toggle value={prefs.newDispute} onChange={() => setPrefs((p) => ({ ...p, newDispute: !p.newDispute }))}
            label="New Disputes" sub="Get notified when a customer raises a dispute" />
          <Toggle value={prefs.withdrawalUpdate} onChange={() => setPrefs((p) => ({ ...p, withdrawalUpdate: !p.withdrawalUpdate }))}
            label="Withdrawal Updates" sub="Track your withdrawal request status" />
          <Toggle value={prefs.promotions} onChange={() => setPrefs((p) => ({ ...p, promotions: !p.promotions }))}
            label="Promotions & Tips" sub="Receive tips on boosting your sales" />
        </div>
        <button type="button" onClick={() => setSuccess(true)}
          className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white hover:bg-[#1D5620] transition-colors">
          Save Preferences
        </button>
      </div>
      {success && <SuccessModal message="Notification preferences saved!" onClose={() => { setSuccess(false); onBack(); }} />}
    </div>
  );
}

// ── Bank account section ───────────────────────────────────────────────────

function BankAccount({ isMock, onBack }: { isMock: boolean; onBack: () => void }) {
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/vendors/me", { bankAccount: { accountNumber, bankName, accountName } });
    },
    onSuccess: () => setSuccess(true),
    onError: () => toast.error("Failed to save bank details."),
  });

  function handleSave() {
    if (!accountNumber.trim() || !bankName.trim() || !accountName.trim()) {
      toast.error("All bank fields are required.");
      return;
    }
    if (isMock) { setSuccess(true); return; }
    mutation.mutate();
  }

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <SectionHeader title="Bank Account Details" onBack={onBack} />
      <div className="px-[20px] pt-[24px] pb-[40px] flex flex-col gap-[20px]">
        <p className="font-jakarta text-[13px] text-[#9B9B9B] tracking-[-0.04em] leading-[1.6]">
          These details will be used to process all your withdrawal requests.
        </p>
        <div>
          <label className={labelClass}>Account Number</label>
          <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Enter 10-digit account number" maxLength={10} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Bank Name</label>
          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g Access Bank, GTB, etc" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Name on Account</label>
          <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Enter account name" className={inputClass} />
        </div>
        <button type="button" onClick={handleSave} disabled={mutation.isPending}
          className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors mt-[8px]">
          {mutation.isPending ? "Saving..." : "Save Bank Details"}
        </button>
      </div>
      {success && <SuccessModal message="Bank details saved successfully!" onClose={() => { setSuccess(false); onBack(); }} />}
    </div>
  );
}

// ── Sign out confirm ───────────────────────────────────────────────────────

function SignOutConfirm({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[28px] pb-[28px] w-full max-w-[360px] relative">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>
          <p className="font-jakarta font-bold text-[16px] text-[#151515] tracking-[-0.04em] mb-[8px] mt-[8px]">Sign Out</p>
          <p className="font-jakarta text-[13px] text-[#9B9B9B] tracking-[-0.04em] mb-[24px]">Are you sure you want to sign out of your vendor account?</p>
          <button type="button" onClick={onConfirm}
            className="w-full h-[50px] rounded-[8px] bg-[#E53935] font-jakarta text-[14px] font-semibold text-white hover:bg-[#C62828] transition-colors mb-[12px]">
            Sign Out
          </button>
          <button type="button" onClick={onClose}
            className="w-full font-jakarta text-[14px] text-[#9B9B9B] underline tracking-[-0.04em]">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main settings menu ─────────────────────────────────────────────────────

const MENU_ITEMS: { key: string; icon: React.ElementType; label: string; sub: string; danger?: boolean }[] = [
  { key: "store",         icon: Store,    label: "Store Profile",              sub: "Update your store name, logo and description" },
  { key: "personal",      icon: User,     label: "Personal Information",       sub: "Edit your name and phone number" },
  { key: "password",      icon: Lock,     label: "Change Password",            sub: "Update your account password" },
  { key: "notifications", icon: Bell,     label: "Notification Preferences",   sub: "Control which alerts you receive" },
  { key: "bank",          icon: Landmark, label: "Bank Account Details",       sub: "Manage your withdrawal bank account" },
  { key: "signout",       icon: LogOut,   label: "Sign Out",                   sub: "Log out of your vendor account", danger: true },
];

export default function VendorSettingsPage() {
  const router = useRouter();
  const { user, logout: signOut } = useAuthStore();
  const isMock = user?.id === "mock-vendor-001";
  const [section, setSection] = useState<Section>("menu");
  const [showSignOut, setShowSignOut] = useState(false);

  const { data: vendorProfile } = useQuery<VendorProfile>({
    queryKey: ["vendor-profile"],
    queryFn: async () => { const { data } = await apiClient.get("/vendors/me"); return data?.data ?? data; },
    enabled: !isMock,
  });

  const { data: userProfile } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: async () => { const { data } = await apiClient.get("/users/me"); return data?.data ?? data; },
    enabled: !isMock,
  });

  const vendor = isMock ? MOCK_VENDOR : (vendorProfile ?? MOCK_VENDOR);
  const userInfo = isMock ? MOCK_USER : (userProfile ?? MOCK_USER);

  function handleSignOut() {
    signOut();
    router.replace("/vendor/login");
  }

  // Sub-section views
  if (section === "store")         return <StoreProfile vendor={vendor} isMock={isMock} onBack={() => setSection("menu")} />;
  if (section === "personal")      return <PersonalInfo user={userInfo} isMock={isMock} onBack={() => setSection("menu")} />;
  if (section === "password")      return <ChangePassword isMock={isMock} onBack={() => setSection("menu")} />;
  if (section === "notifications") return <NotificationPrefs onBack={() => setSection("menu")} />;
  if (section === "bank")          return <BankAccount isMock={isMock} onBack={() => setSection("menu")} />;

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      {/* Mobile header */}
      <div className="md:hidden bg-[#2E7D32] rounded-b-[12px] h-[90px] flex items-center px-[20px] gap-[12px]">
        <button type="button" aria-label="Go back" onClick={() => router.back()} className="text-white">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <span className="font-jakarta text-[16px] font-semibold text-white leading-[1.26] tracking-[-0.04em]">
          Settings
        </span>
      </div>
      {/* Desktop top bar */}
      <div className="hidden md:flex items-center gap-[12px] px-[32px] py-[20px] border-b border-[#EAEAEA] bg-white">
        <button type="button" aria-label="Go back" onClick={() => router.back()} className="text-[#2E7D32] hover:opacity-70 transition-opacity">
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="font-satoshi font-bold text-[20px] text-[#151515]">Settings</h1>
      </div>

      {/* Store identity card */}
      <div className="mx-[20px] md:mx-[32px] lg:mx-[40px] mt-[20px] bg-white rounded-[12px] border border-[#EAEAEA] p-[16px] flex items-center gap-[14px]">
        <div className="w-[52px] h-[52px] rounded-full bg-[#D8FFDA] overflow-hidden relative shrink-0 flex items-center justify-center">
          {vendor.logoUrl
            ? <Image src={vendor.logoUrl} alt="Store logo" fill className="object-cover" sizes="52px" />
            : <Store size={24} className="text-[#2E7D32]" />
          }
        </div>
        <div>
          <p className="font-jakarta font-bold text-[15px] text-[#151515] tracking-[-0.04em]">{vendor.storeName}</p>
          <p className="font-jakarta text-[12px] text-[#9B9B9B] tracking-[-0.04em]">{userInfo.email}</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="mx-[20px] md:mx-[32px] lg:mx-[40px] mt-[16px] bg-white rounded-[12px] border border-[#EAEAEA] overflow-hidden md:max-w-[600px]">
        {MENU_ITEMS.map(({ key, icon: Icon, label, sub, danger }, idx) => (
          <button
            key={key}
            type="button"
            onClick={() => key === "signout" ? setShowSignOut(true) : setSection(key as Section)}
            className={cn(
              "w-full flex items-center gap-[14px] px-[16px] py-[14px] text-left transition-colors hover:bg-[#F7FFF8]",
              idx < MENU_ITEMS.length - 1 && "border-b border-[#EAEAEA]"
            )}
          >
            <div className={cn("w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0",
              danger ? "bg-[#FFEBEE]" : "bg-[#D8FFDA]")}>
              <Icon size={18} className={danger ? "text-[#E53935]" : "text-[#2E7D32]"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("font-jakarta text-[14px] font-semibold tracking-[-0.04em]", danger ? "text-[#E53935]" : "text-[#151515]")}>
                {label}
              </p>
              <p className="font-jakarta text-[12px] text-[#9B9B9B] tracking-[-0.04em] mt-[1px]">{sub}</p>
            </div>
            {!danger && <ChevronRight size={18} className="text-[#9B9B9B] shrink-0" />}
          </button>
        ))}
      </div>

      {/* Sign out modal */}
      {showSignOut && (
        <SignOutConfirm onClose={() => setShowSignOut(false)} onConfirm={handleSignOut} />
      )}
    </div>
  );
}
