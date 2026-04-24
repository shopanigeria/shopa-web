import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: { default: "Shopa", template: "%s | Shopa" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary-dark relative overflow-x-hidden">
      {/* Background SVG pattern */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <Image
          src="/images/auth-bg.svg"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Mobile: single column. Tablet/Desktop: side-by-side */}
      {/* Mobile: stack logo on top, card below. Desktop: side by side */}
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

        {/* Form card — pinned to bottom on mobile, side panel on desktop */}
        <div className="mt-auto md:mt-0 bg-white rounded-t-[24px] md:rounded-none md:rounded-l-[32px] animate-slide-up md:animate-none md:w-[480px] lg:w-[520px] md:min-h-screen md:flex md:items-center md:shadow-[-8px_0_32px_rgba(0,0,0,0.15)]">
          <div className="px-[24px] md:px-[48px] lg:px-[64px] pt-[38px] pb-[32px] w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
