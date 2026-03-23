import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Shopa", template: "%s | Shopa" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary-dark flex flex-col relative overflow-hidden">
      {/* Background pattern — subtle S shapes like in Figma */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute top-[-80px] right-[-60px] w-[320px] h-[320px] rounded-full border-[60px] border-primary/20 opacity-40" />
        <div className="absolute top-[60px] left-[-80px] w-[280px] h-[280px] rounded-full border-[50px] border-primary/20 opacity-30" />
        <div className="absolute top-[200px] right-[40px] w-[200px] h-[200px] rounded-full border-[40px] border-primary/15 opacity-25" />
      </div>

      {/* Logo area */}
      <div className="flex-1 flex items-center justify-center pt-16 pb-8 relative z-10 min-h-[260px]">
        <div className="text-center">
          {/* Shopa wordmark in yellow — matching the Figma exactly */}
          <h1 
            className="text-secondary text-[52px] leading-none"
            style={{ fontFamily: "Satoshi, sans-serif", fontWeight: 700 }}
          >
            Shopa
          </h1>
        </div>
      </div>

      {/* White card slides up from bottom */}
      <div className="relative z-10 bg-white rounded-t-[24px] animate-slide-up">
        <div className="px-6 pt-10 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
