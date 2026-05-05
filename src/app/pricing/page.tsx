"use client";

type PlanId = "core" | "scale";

type PricingPlan = {
  id: "free" | PlanId;
  name: string;
  price: string;
  subtitle: string;
  description: string;
  cta: string;
  href?: string;
  featured: boolean;
  features: string[];
};

const pricing: PricingPlan[] = [
  {
    id: "free",
    name: "Free Trial",
    price: "$0",
    subtitle: "One-time Profit Preview",
    description: "Best for testing DropClarity with one job before upgrading.",
    cta: "Run Free Profit Scan",
    href: "/app",
    featured: false,
    features: [
      "1 job profitability scan",
      "Revenue, cost, and margin summary",
      "Top AI insight",
      "AI-generated recommended action",
      "No saved report history",
    ],
  },
  {
    id: "core",
    name: "DropClarity Core",
    price: "$499/mo",
    subtitle: "See exactly where your profit is made and lost",
    description:
      "For home service businesses that want full visibility into job profitability to identify margin issues, cost leaks, and underperforming work.",
    cta: "Start Core",
    featured: true,
    features: [
      "Job profitability analysis (revenue, costs, margin)",
      "Full dashboard with KPIs + profit trends",
      "Profit by job + losing job detection",
      "Cost breakdown (labor, materials, subs, other)",
      "Saved report history",
      "Exportable job reports",
    ],
  },
  {
    id: "scale",
    name: "DropClarity Scale",
    price: "$999/mo",
    subtitle: "Real-time profit protection & automated alerts",
    description:
      "For growing home service teams that want to automatically detect profit leaks, flag high-risk jobs, and take action before losses grow.",
    cta: "Start Scale",
    featured: false,
    features: [
      "Everything in Core",
      "Instantly see where you're losing money",
      "Recoverable profit opportunity tracking",
      "Automated high-risk alerts (email + dashboard)",
      "Priority actions (what to fix next)",
      "Smart job benchmarking",
      "Actionable profit recommendations per job",
    ],
  },
];

const outcomes = [
  [
    "Which jobs are profitable?",
    "See revenue, costs, profit, and margin by job instead of guessing from totals.",
  ],
  [
    "Where are costs leaking?",
    "Spot labor, materials, subs, and other cost categories that are hurting margin.",
  ],
  [
    "What should I fix next?",
    "Get operator-ready recommendations instead of staring at spreadsheets.",
  ],
];

const pricingQuestions = [
  [
    "Can I start for free?",
    "Yes. The free trial is meant to help you test a one-time profitability scan before committing to an ongoing plan.",
  ],
  [
    "Do I need integrations?",
    "No. You can start with uploads. Integrations and automated workflows can come later.",
  ],
  [
    "Which plan should I choose?",
    "Most operators should start with Core if they want serious ongoing job profitability visibility. Scale is best when you want alerts, benchmarks, priority actions, and team visibility.",
  ],
  [
    "Can I cancel anytime?",
    "Yes. The pricing is designed to be simple and flexible.",
  ],
];

export default function PricingPage() {
  async function startCheckout(plan: PlanId) {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Checkout failed. Please sign in and try again.");
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950 [font-family:ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Arial]">
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(1050px_520px_at_12%_-12%,rgba(124,58,237,.13),transparent_58%),radial-gradient(900px_520px_at_92%_4%,rgba(34,211,238,.12),transparent_62%),linear-gradient(180deg,#ffffff,#fbfdff)]" />

        <div className="relative mx-auto w-full max-w-[1600px] px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-18">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-[12px] font-black text-violet-700 shadow-[0_10px_28px_rgba(124,58,237,.10)] sm:text-[13px]">
              Premium job profitability intelligence
            </div>

            <h1 className="mx-auto max-w-5xl text-[30px] font-black leading-[1.07] tracking-[-0.045em] text-slate-950 sm:text-[38px] lg:text-[44px] xl:text-[48px]">
              Pricing built around finding profit leaks before they keep costing you.
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-[15px] font-bold leading-7 text-slate-600 sm:text-[16px] lg:text-[17px]">
              Start with a free analysis, then upgrade when you want ongoing visibility into every job’s revenue, costs, margin, and next-step recommendations.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            {pricing.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex min-h-[610px] flex-col rounded-[28px] border bg-white p-6 shadow-[0_18px_60px_rgba(2,6,23,.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(2,6,23,.11)] sm:p-7 lg:p-8 ${
                  plan.featured
                    ? "border-violet-400 ring-2 ring-violet-200"
                    : "border-slate-200"
                }`}
              >
                {plan.featured ? (
                  <div className="absolute left-6 right-6 top-0 -translate-y-1/2 rounded-full bg-violet-500 px-4 py-2 text-center text-xs font-black text-white shadow-lg shadow-violet-200 sm:left-8 sm:right-8">
                    Most businesses start here
                  </div>
                ) : null}

                <div className="flex h-full flex-col pt-4">
                  <div>
                    <h2 className="text-[23px] font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-[25px]">
                      {plan.name}
                    </h2>

                    <p className="mt-3 min-h-[24px] text-sm font-black text-slate-500">
                      {plan.subtitle}
                    </p>

                    <p className="mt-5 min-h-[88px] text-[14px] font-semibold leading-6 text-slate-500 sm:text-[15px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mt-2 border-y border-slate-100 py-6">
                    <div className="text-[38px] font-black leading-none tracking-[-0.045em] text-slate-950 sm:text-[42px]">
                      {plan.price}
                    </div>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3 text-[14px] font-bold leading-6 text-slate-600 sm:text-[15px]">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-600">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-8">
                    {plan.href ? (
                      <a
                        href={plan.href}
                        className="flex w-full justify-center rounded-2xl bg-slate-900 px-5 py-4 text-center text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                      >
                        {plan.cta}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startCheckout(plan.id as PlanId)}
                        className={`flex w-full justify-center rounded-2xl px-5 py-4 text-center text-sm font-black text-white shadow-lg transition ${
                          plan.featured
                            ? "bg-violet-500 shadow-violet-200 hover:bg-violet-600"
                            : "bg-slate-900 shadow-slate-200 hover:bg-slate-800"
                        }`}
                      >
                        {plan.cta}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50/80 px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="mx-auto w-full max-w-[1500px]">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-[26px] font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-[34px]">
              What every paid plan helps you answer
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] font-bold leading-7 text-slate-500 sm:text-[16px]">
              DropClarity is built to turn messy job data into clear operating decisions.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {outcomes.map(([title, desc]) => (
              <div
                key={title}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(2,6,23,.055)] sm:p-7"
              >
                <h3 className="text-[17px] font-black tracking-[-0.01em] text-slate-950 sm:text-lg">
                  {title}
                </h3>
                <p className="mt-4 text-[14px] font-semibold leading-7 text-slate-500 sm:text-[15px]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1100px] px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="text-center">
          <h2 className="text-[26px] font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-[34px]">
            Pricing questions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] font-bold leading-7 text-slate-500 sm:text-[16px]">
            Simple answers before you choose a plan.
          </p>
        </div>

        <div className="mt-9 space-y-3">
          {pricingQuestions.map(([q, a]) => (
            <details
              key={q}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,.035)] transition open:shadow-[0_16px_44px_rgba(2,6,23,.07)] sm:p-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-black text-slate-950 sm:text-[16px]">
                <span>{q}</span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-50 text-lg leading-none text-slate-600 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-[14px] font-semibold leading-7 text-slate-500 sm:text-[15px]">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-12 sm:px-8 sm:py-14 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1300px] flex-col items-start justify-between gap-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(2,6,23,.07)] sm:p-8 lg:flex-row lg:items-center">
          <h2 className="max-w-3xl text-[22px] font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-[28px]">
            Start with one job profitability scan.
            <br className="hidden sm:block" />
            <span className="font-semibold text-slate-600">
              Upgrade when you’re ready for ongoing clarity.
            </span>
          </h2>

          <a
            href="/app"
            className="w-full rounded-full bg-violet-500 px-8 py-4 text-center text-sm font-black text-white shadow-xl shadow-violet-200 transition hover:bg-violet-600 sm:w-auto sm:px-12"
          >
            Run a Free Scan
          </a>
        </div>
      </section>
    </main>
  );
}
