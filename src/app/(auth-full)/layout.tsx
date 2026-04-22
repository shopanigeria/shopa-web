import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: { default: "Shopa", template: "%s | Shopa" },
};

export default function AuthFullLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh bg-primary-dark relative overflow-hidden">
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

      {/* On mobile: full-width column. On desktop: centred phone-frame */}
      <div className="relative z-10 flex flex-col justify-end h-full w-full md:max-w-[430px] md:mx-auto">
        {/* White card — anchored to bottom, scrollable if content overflows */}
        <div className="bg-white rounded-t-[24px] animate-slide-up max-h-[calc(100dvh-54px)] overflow-y-auto">
          <div className="px-[24px] pt-[38px] pb-[38px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
