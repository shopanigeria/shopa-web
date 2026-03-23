import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: { default: "Shopa", template: "%s | Shopa" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary-dark relative overflow-x-hidden">
      {/* Background SVG pattern — covers full screen always */}
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
      <div className="relative z-10 flex flex-col min-h-screen w-full md:max-w-[430px] md:mx-auto md:min-h-screen">
        {/* Logo area */}
        <div className="flex-1 flex items-center justify-center min-h-[220px] py-10">
          <h1 className="font-satoshi font-bold text-secondary text-[52px] leading-none">
            Shopa
          </h1>
        </div>

        {/* White bottom-sheet card */}
        <div className="bg-white rounded-t-[24px] animate-slide-up shrink-0">
          <div className="px-6 pt-8 pb-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
