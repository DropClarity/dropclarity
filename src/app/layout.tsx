import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "DropClarity",
  description:
    "Job profitability analysis for contractors, trades, and service operators.",
  icons: {
    icon: "/logo-icon.svg",
    shortcut: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-950">
        <ClerkProvider>
          <SiteHeader />

          <main>{children}</main>

          <footer className="border-t border-slate-100 bg-white">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-10 sm:px-8 sm:py-12">
              <img src="/logo.svg" alt="DropClarity" className="h-7 w-auto" />

              <div className="flex gap-3">
                <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-950">
                  in
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-950">
                  𝕏
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-950">
                  ◎
                </div>
              </div>
            </div>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}