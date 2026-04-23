"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ScreenHeader from "@/components/layout/ScreenHeader";
import BackButton from "@/components/layout/BackButton";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phoneNumber: user?.phone ?? "",
  });
  const [saving, setSaving] = useState(false);

  // Fetch fresh user profile to ensure phone number is up-to-date
  useEffect(() => {
    apiClient.get("/users/me").then(({ data }) => {
      setUser(data);
      setFormData({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        phoneNumber: data.phone ?? "",
      });
    }).catch(() => {/* silently use cached user */});
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: updated } = await apiClient.patch("/users/me", {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phoneNumber.trim() || undefined,
      });
      setUser(updated);
      toast.success("Changes saved successfully.");
      router.back();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to save changes. Please try again.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-[8px] bg-[#F7FFF8] border border-[#9B9B9B] px-[10px] py-[14px] font-jakarta text-[14px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]";

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      <ScreenHeader title="Account Settings" showBack />
      <div className="md:px-6 lg:px-8 md:pt-[20px]"><BackButton label="Account Settings" /></div>

      <div className="md:max-w-[720px] md:mx-auto md:px-6 lg:px-8">
      <div className="px-[24px] md:px-0 pt-[24px] pb-[24px] flex flex-col gap-[16px]">
        <div>
          <label htmlFor="firstName" className="font-jakarta text-[12px] font-medium text-[#333333] mb-[5px] block tracking-[-0.04em]">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Enter first name"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="lastName" className="font-jakarta text-[12px] font-medium text-[#333333] mb-[5px] block tracking-[-0.04em]">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Enter last name"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="font-jakarta text-[12px] font-medium text-[#333333] mb-[5px] block tracking-[-0.04em]">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="Enter phone number"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className="font-jakarta text-[12px] font-medium text-[#333333] mb-[5px] block tracking-[-0.04em]">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={user?.email ?? ""}
            readOnly
            disabled
            onChange={() => {}}
            placeholder="Email address"
            className="w-full rounded-[8px] bg-[#EAEAEA] px-[10px] py-[14px] font-jakarta text-[14px] text-[#9B9B9B] cursor-not-allowed tracking-[-0.04em]"
          />
        </div>

      </div>
      </div>

      {/* Save button — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <div className="w-full max-w-[390px] md:max-w-[720px] px-[24px] pb-[32px] pointer-events-auto">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full h-[53px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1D5620] transition-colors tracking-[-0.04em]"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
