import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: { default: "Shopa", template: "%s | Shopa" },
};

const APP_ROLE = process.env.NEXT_PUBLIC_APP_ROLE;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // ── Admin portal — clean white layout ──────────────────────────────────────
  if (APP_ROLE === "admin") {
    return (
      <div className="min-h-screen bg-[#F7FFF8] flex flex-col items-center justify-center px-[24px]">
        <div className="w-full max-w-[440px]">
          <div className="flex flex-col items-center mb-[32px]">
            <Image src="/images/logo.svg" alt="Shopa" width={100} height={36} priority />
            <p className="font-jakarta text-[12px] font-bold text-[#9B9B9B] uppercase tracking-[0.08em] mt-[8px]">
              Admin Portal
            </p>
          </div>
          <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] px-[40px] py-[40px]">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ── Super admin portal — dark sidebar layout ───────────────────────────────
  if (APP_ROLE === "superadmin") {
    return (
      <div className="min-h-screen flex">
        {/* Dark sidebar */}
        <div className="hidden md:flex flex-col w-[280px] bg-[#1D5620] px-[32px] py-[40px]">
          <div className="mb-[48px]">
            <Image src="/images/logo.svg" alt="Shopa" width={80} height={28} priority />
          </div>
          <p className="font-satoshi font-bold text-[22px] text-white mb-[8px]">Super Admin</p>
          <p className="font-jakarta text-[13px] text-white/60 leading-[1.6]">Shopa Platform Administration</p>
          <div className="mt-auto pt-[40px]">
            <div className="border-t border-white/10 pt-[24px] flex flex-col gap-[12px]">
              {[
                { label: "All Universities", placeholder: true },
                { label: "All Vendors", placeholder: true },
                { label: "All Students", placeholder: true },
              ].map(({ label }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="font-jakarta text-[12px] text-white/50">{label}</span>
                  <div className="w-[32px] h-[14px] bg-white/10 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Form area */}
        <div className="flex-1 flex items-center justify-center bg-[#F0F4F0] px-[24px]">
          <div className="w-full max-w-[440px]">
            <div className="md:hidden flex items-center gap-[10px] mb-[28px]">
              <Image src="/images/logo.svg" alt="Shopa" width={72} height={26} priority />
              <span className="font-jakarta text-[12px] font-bold text-[#9B9B9B] uppercase tracking-[0.06em]">
                Super Admin
              </span>
            </div>
            <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.10)] px-[40px] py-[40px]">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Customer + vendor — green branding panel (default) ────────────────────
  return (
    <div className="min-h-screen bg-primary-dark relative overflow-x-hidden">
      {/* Background SVG pattern */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <Image src="/images/auth-bg.svg" alt="" fill className="object-cover object-center" priority />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col md:flex-row">
        {/* Logo area */}
        <div className="flex-1 flex items-center justify-center py-8 md:min-h-screen md:py-0">
          <Image
            src="/images/logo.svg"
            alt="Shopa"
            width={160}
            height={60}
            priority
            className="md:w-[200px] md:h-auto"
          />
        </div>

        {/* Form card */}
        <div className="mt-auto md:mt-0 bg-white rounded-t-[24px] md:rounded-none md:rounded-l-[32px] animate-slide-up md:animate-none md:w-[480px] lg:w-[520px] md:min-h-screen md:flex md:items-center md:shadow-[-8px_0_32px_rgba(0,0,0,0.15)]">
          <div className="px-[24px] md:px-[48px] lg:px-[64px] pt-[38px] pb-[32px] w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
