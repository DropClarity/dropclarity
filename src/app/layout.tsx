import type { Metadata } from "next";
import Link from "next/link";
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

const footerLinks = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Billing Policy", href: "/billing-policy" },
];

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
            <div className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8 sm:py-12">
              <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50/40 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.07)] sm:p-8">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-xl">
                    <img
                      src="/logo.svg"
                      alt="DropClarity"
                      className="h-8 w-auto"
                    />

                    <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-slate-600">
                      Job profitability analysis for contractors, trades, and
                      service operators who want to find the jobs quietly
                      draining profit.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                        Revenue
                      </span>
                      <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                        Costs
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                        Margin
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                        Profit Leaks
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1fr_auto] lg:gap-12">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Company
                      </div>

                      <nav className="mt-4 grid gap-3">
                        {footerLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-bold text-slate-600 transition hover:text-slate-950"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </nav>
                    </div>

                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Social
                      </div>

                      <div className="mt-4 flex gap-3">
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 shadow-sm">
                          in
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 shadow-sm">
                          𝕏
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 shadow-sm">
                          ◎
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-200 pt-5">
                  <div className="flex flex-col gap-3 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      © {new Date().getFullYear()} DropClarity. All rights
                      reserved.
                    </p>

                    <p>
                      AI-generated insights are informational only and should be
                      reviewed before business decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}