"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useClerk, useUser } from "@clerk/nextjs";

type VisiblePlan = "free" | "core" | "scale";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Analyze", href: "/app" },
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
          userButtonPopoverCard: "z-[1000000]",
          userButtonPopoverActionButton: "z-[1000000]",
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
    <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">
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
  onAction,
}: {
  fullWidth?: boolean;
  onAction?: () => void;
}) {
  const { openSignIn, openSignUp } = useClerk();

  return (
    <div
      className={
        fullWidth ? "flex w-full flex-col gap-2" : "flex items-center gap-3"
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
                  ? "rounded-full bg-slate-100 px-4 py-2 text-slate-950"
                  : "rounded-full px-4 py-2 text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function HamburgerButton({
  menuOpen,
  setMenuOpen,
}: {
  menuOpen: boolean;
  setMenuOpen: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={menuOpen ? "Close menu" : "Open menu"}
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen(!menuOpen)}
      className="flex cursor-pointer list-none items-center justify-center rounded-xl border border-slate-300 bg-white p-2.5 shadow-sm"
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

function DesktopHeader({
  pathname,
  plan,
  isLoaded,
  isSignedIn,
  user,
}: {
  pathname: string;
  plan: VisiblePlan;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  user: ReturnType<typeof useUser>["user"];
}) {
  return (
    <div className="hidden h-full grid-cols-[1fr_auto_1fr] items-center gap-6 xl:grid">
      <div className="flex justify-start">
        <Link href="/" className="flex items-center">
          <img src="/logo.svg" alt="DropClarity" className="h-9 w-auto" />
        </Link>
      </div>

      <nav className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-900">
        <NavLinks pathname={pathname} />
      </nav>

      <div className="flex items-center justify-end gap-4">
        {!isLoaded ? null : isSignedIn ? (
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan} />

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
          <AuthButtons />
        )}
      </div>
    </div>
  );
}

function TabletHeader({
  pathname,
  plan,
  isLoaded,
  isSignedIn,
  menuOpen,
  setMenuOpen,
}: {
  pathname: string;
  plan: VisiblePlan;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  menuOpen: boolean;
  setMenuOpen: (value: boolean) => void;
}) {
  return (
    <div className="hidden h-full grid-cols-[1fr_auto_1fr] items-center gap-4 sm:grid xl:hidden">
      <div className="flex justify-start">
        <Link href="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
          <img src="/logo.svg" alt="DropClarity" className="h-9 w-auto" />
        </Link>
      </div>

      <nav className="hidden items-center justify-center gap-2 text-sm font-semibold text-slate-900 lg:flex">
        <NavLinks pathname={pathname} />
      </nav>

      <div className="flex items-center justify-end gap-3">
        {!isLoaded ? null : isSignedIn ? (
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan} />
            <AccountButton />
          </div>
        ) : (
          <div className="hidden md:block">
            <AuthButtons />
          </div>
        )}

        <div className="lg:hidden">
          <HamburgerButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        </div>
      </div>
    </div>
  );
}

function MobileHeader({
  pathname,
  plan,
  isLoaded,
  isSignedIn,
  menuOpen,
  setMenuOpen,
}: {
  pathname: string;
  plan: VisiblePlan;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  menuOpen: boolean;
  setMenuOpen: (value: boolean) => void;
}) {
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex h-full items-center justify-between sm:hidden">
      <Link href="/" className="flex items-center" onClick={closeMenu}>
        <img src="/logo.svg" alt="DropClarity" className="h-8 w-auto" />
      </Link>

      <div className="flex items-center gap-3">
        {!isLoaded ? null : isSignedIn ? <PlanBadge plan={plan} /> : null}

        <HamburgerButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      </div>
    </div>
  );
}

function MobileMenu({
  pathname,
  plan,
  isLoaded,
  isSignedIn,
  user,
  menuOpen,
  closeMenu,
}: {
  pathname: string;
  plan: VisiblePlan;
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  user: ReturnType<typeof useUser>["user"];
  menuOpen: boolean;
  closeMenu: () => void;
}) {
  if (!menuOpen) return null;

  return (
    <div className="fixed left-4 right-4 top-[104px] z-[100000] max-h-[calc(100vh-128px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl xl:hidden">
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
                {user?.firstName ? `Hi, ${user.firstName}` : "My account"}
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
    <>
      <header className="fixed left-0 right-0 top-0 z-[99999] h-[88px] border-b border-slate-200 bg-white sm:h-[96px]">
        <div className="mx-auto h-full max-w-[1600px] px-5 sm:px-8">
          <DesktopHeader
            pathname={pathname}
            plan={plan}
            isLoaded={isLoaded}
            isSignedIn={isSignedIn}
            user={user}
          />

          <TabletHeader
            pathname={pathname}
            plan={plan}
            isLoaded={isLoaded}
            isSignedIn={isSignedIn}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />

          <MobileHeader
            pathname={pathname}
            plan={plan}
            isLoaded={isLoaded}
            isSignedIn={isSignedIn}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
        </div>

        <MobileMenu
          pathname={pathname}
          plan={plan}
          isLoaded={isLoaded}
          isSignedIn={isSignedIn}
          user={user}
          menuOpen={menuOpen}
          closeMenu={closeMenu}
        />
      </header>

      <div className="h-[88px] sm:h-[96px]" aria-hidden="true" />
    </>
  );
}