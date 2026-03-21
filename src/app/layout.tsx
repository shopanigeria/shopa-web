import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "./providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Shopa", template: "%s | Shopa" },
  description: "Shop everything you need on campus — fast, easy, and student-friendly.",
  keywords: ["shopa", "student marketplace", "campus shopping", "nigeria", "university"],
  icons: { icon: "/icons/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
