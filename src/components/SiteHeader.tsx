"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useClerk, useUser } from "@clerk/nextjs";

type VisiblePlan = "free" | "core" | "scale";

const navItems = [
  { label: "Home", href: "/" },
  { label: "App", href: "/app" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Dashboard", href: "/dashboard" },
];

const PLAN_LABELS: Record<VisiblePlan, string> = {
  free: "Free",
  core: "Core",
  scale: "Scale",
};

function normalizePlan(rawPlan: unknown): VisiblePlan {
  const plan = String(rawPlan || "free").toLowerCase().trim();

  // Legacy support: old "pro" plan now maps to "core".
  if (plan === "pro" || plan === "core") return "core";
  if (plan === "scale") return "scale";

  return "free";
}

async function openBillingPortal() {
  try {
    const res = await fetch("/api/billing-portal", { method: "POST" });
    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    alert(data.error || "Could not open billing portal.");
  } catch {
    alert("Could not open billing portal.");
  }
}

function getPlanFromUser(user: ReturnType<typeof useUser>["user"]): VisiblePlan {
  const rawPlan = user?.publicMetadata?.plan;
  const subscriptionStatus = String(
    user?.publicMetadata?.subscriptionStatus || "inactive"
  )
    .toLowerCase()
    .trim();

  const hasPaidAccess = ["active", "trialing"].includes(subscriptionStatus);

  if (!hasPaidAccess) return "free";

  return normalizePlan(rawPlan);
}

function AccountButton() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox:
            "h-10 w-10 ring-2 ring-slate-200 transition hover:ring-slate-300",
        },
      }}
    >
      <UserButton.MenuItems>
        <UserButton.Action
          label="Manage Billing"
          labelIcon={<span className="text-base">💳</span>}
          onClick={openBillingPortal}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}

function PlanBadge({ plan }: { plan: VisiblePlan }) {
  const isPaid = plan !== "free";

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">
      <span
        className={
          isPaid
            ? "h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-200"
            : "h-1.5 w-1.5 rounded-full bg-slate-300"
        }
      />
      {PLAN_LABELS[plan]}
    </div>
  );
}

function AuthButtons({
  fullWidth = false,
  compact = false,
  onAction,
}: {
  fullWidth?: boolean;
  compact?: boolean;
  onAction?: () => void;
}) {
  const { openSignIn, openSignUp } = useClerk();

  return (
    <div
      className={
        fullWidth
          ? "flex w-full flex-col gap-2"
          : compact
            ? "flex items-center gap-2"
            : "flex items-center gap-3"
      }
    >
      <button
        type="button"
        onClick={() => {
          onAction?.();
          openSignIn();
        }}
        className={
          fullWidth
            ? "w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm"
            : compact
              ? "rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-900 transition hover:bg-slate-50"
              : "rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
        }
      >
        Login
      </button>

      <button
        type="button"
        onClick={() => {
          onAction?.();
          openSignUp();
        }}
        className={
          fullWidth
            ? "w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-black text-white shadow"
            : compact
              ? "rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white shadow transition hover:bg-slate-800"
              : "rounded-full bg-slate-900 px-5 py-2.5 text-sm font-black text-white shadow transition hover:bg-slate-800"
        }
      >
        Sign Up
      </button>
    </div>
  );
}

function NavLinks({
  pathname,
  mobile = false,
  onNavigate,
}: {
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={
              mobile
                ? isActive
                  ? "rounded-xl bg-slate-100 px-4 py-3 font-black text-slate-950"
                  : "rounded-xl px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                : isActive
                  ? "rounded-full bg-slate-100 px-3.5 py-2 text-slate-950"
                  : "rounded-full px-3.5 py-2 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function MenuButton({
  menuOpen,
  setMenuOpen,
}: {
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <button
      type="button"
      aria-label={menuOpen ? "Close menu" : "Open menu"}
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen((open) => !open)}
      className="flex cursor-pointer list-none items-center justify-center rounded-xl border border-slate-300 bg-white p-2.5 shadow-sm transition hover:bg-slate-50 lg:hidden"
    >
      <div className="flex flex-col gap-[4px]">
        <span
          className={`block h-[2px] w-5 rounded-full bg-slate-900 transition ${
            menuOpen ? "translate-y-[6px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-5 rounded-full bg-slate-900 transition ${
            menuOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-[2px] w-5 rounded-full bg-slate-900 transition ${
            menuOpen ? "-translate-y-[6px] -rotate-45" : ""
          }`}
        />
      </div>
    </button>
  );
}

function MobileMenu({
  pathname,
  plan,
  isLoaded,
  isSignedIn,
  menuOpen,
  closeMenu,
}: {
  pathname: string;
  plan: VisiblePlan;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  menuOpen: boolean;
  closeMenu: () => void;
}) {
  if (!menuOpen) return null;

  return (
    <div className="fixed left-4 right-4 top-[104px] z-[10000] max-h-[calc(100vh-128px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl lg:hidden">
      <div className="flex flex-col gap-1">
        {!isLoaded || !isSignedIn ? (
          <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="text-sm font-black text-slate-950">
              Welcome to DropClarity
            </div>
            <div className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
              Log in or create an account to access uploads, dashboard, billing,
              and saved job history.
            </div>

            <div className="mt-3">
              <AuthButtons fullWidth onAction={closeMenu} />
            </div>
          </div>
        ) : (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <AccountButton />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-slate-950">
                My account
              </div>
              <div className="truncate text-xs font-bold text-slate-400">
                Tap your profile photo to manage account or billing.
              </div>
            </div>
            <PlanBadge plan={plan} />
          </div>
        )}

        <NavLinks pathname={pathname} mobile onNavigate={closeMenu} />
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, user } = useUser();
  const plan = getPlanFromUser(user);

  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-[9999] h-[88px] border-b border-slate-200 bg-white sm:h-[96px]">
      <div className="mx-auto h-full max-w-[1600px] px-5 sm:px-8">
        <div className="grid h-full grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-6">
          <div className="flex min-w-0 justify-start">
            <Link href="/" className="flex items-center" onClick={closeMenu}>
              <img
                src="/logo.svg"
                alt="DropClarity"
                className="h-8 w-auto sm:h-9"
              />
            </Link>
          </div>

          <nav className="hidden min-w-0 items-center justify-center gap-1 text-sm font-semibold text-slate-900 lg:flex xl:gap-3">
            <NavLinks pathname={pathname} />
          </nav>

          <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 lg:gap-4">
            {!isLoaded ? null : isSignedIn ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:block">
                  <PlanBadge plan={plan} />
                </div>

                <div className="hidden text-right leading-tight 2xl:block">
                  <div className="text-xs font-black text-slate-950">
                    {user?.firstName ? `Hi, ${user.firstName}` : "My account"}
                  </div>
                  <div className="text-[11px] font-bold text-slate-400">
                    Dashboard ready
                  </div>
                </div>

                <AccountButton />
              </div>
            ) : (
              <div className="hidden md:block">
                <AuthButtons compact />
              </div>
            )}

            <MenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          </div>
        </div>

        <MobileMenu
          pathname={pathname}
          plan={plan}
          isLoaded={isLoaded}
          isSignedIn={isSignedIn}
          menuOpen={menuOpen}
          closeMenu={closeMenu}
        />
      </div>
    </header>
  );
}
