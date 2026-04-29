"use client";

type PlanId = "core" | "scale";

const pricing = [
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
      "Cost breakdown (labor, materials, other)",
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
      "Identify where you're losing money",
      "Recoverable profit identified automatically",
      "Real-time high-risk job alerts",
      "Priority actions (what to fix next)",
      "Advanced job benchmarking",
      "Team visibility",
    ],
  },
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
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-100 bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(124,58,237,.11),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(34,211,238,.12),transparent_34%),radial-gradient(circle_at_50%_105%,rgba(52,211,153,.08),transparent_48%),linear-gradient(180deg,#ffffff,#ffffff)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-12 pt-12 text-center sm:px-6 sm:pb-14 sm:pt-14 md:px-8 md:pb-16 md:pt-16 lg:pb-18 lg:pt-18">
          <div className="mb-4 inline-flex rounded-full border border-cyan-200/80 bg-white/85 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-cyan-700 shadow-sm shadow-cyan-100 sm:mb-5 sm:text-xs">
            Premium job profitability intelligence
          </div>

          <h1 className="mx-auto max-w-4xl text-[31px] font-black leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-[40px] md:text-[46px] lg:text-[52px]">
            Pricing built around finding profit leaks before they keep costing you.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-[15px] font-semibold leading-7 text-slate-600 sm:mt-5 sm:text-base md:text-[17px] md:leading-8">
            Start with a free analysis, then upgrade when you want ongoing visibility into every job’s revenue, costs, margin, and next-step recommendations.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-14 md:px-8 lg:py-16">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex min-h-[0] w-full flex-col rounded-[28px] border bg-white p-6 shadow-xl shadow-slate-100 sm:p-7 lg:min-h-[650px] lg:p-8 ${
                  plan.featured ? "border-violet-400 ring-2 ring-violet-300" : "border-slate-200"
                }`}
              >
                {plan.featured && (
                  <div className="absolute left-6 right-6 top-0 -translate-y-1/2 rounded-full bg-violet-500 px-4 py-2 text-center text-[11px] font-black text-white shadow-lg shadow-violet-200 sm:left-8 sm:right-8 sm:text-xs">
                    Most businesses start here
                  </div>
                )}

                <div className="flex h-full flex-col pt-4">
                  <div className="lg:min-h-[178px]">
                    <h2 className="text-[23px] font-black leading-tight tracking-[-0.025em] text-slate-950 sm:text-[25px] lg:whitespace-nowrap lg:text-[26px]">
                      {plan.name}
                    </h2>

                    <p className="mt-3 text-sm font-bold leading-6 text-slate-400 lg:min-h-[48px]">
                      {plan.subtitle}
                    </p>

                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-500 lg:min-h-[76px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mt-7 lg:mt-0 lg:min-h-[74px]">
                    <div className="text-[36px] font-black leading-none tracking-[-0.04em] text-slate-950 sm:text-[38px] lg:text-[40px]">
                      {plan.price}
                    </div>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3 text-sm font-semibold leading-6 text-slate-600">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <span className="shrink-0 text-emerald-600">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-8 lg:pt-10">
                    {plan.id === "free" ? (
                      <a
                        href="/app"
                        className="flex justify-center rounded-xl bg-slate-900 px-5 py-4 text-center text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                      >
                        {plan.cta}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startCheckout(plan.id as PlanId)}
                        className={`flex w-full justify-center rounded-xl px-5 py-4 text-center text-sm font-black text-white shadow-lg transition ${
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
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-14 sm:px-6 sm:py-16 md:px-8 lg:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-[28px] font-black leading-tight tracking-tight text-slate-950 sm:text-3xl md:text-4xl">
              What every paid plan helps you answer
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-500 sm:text-base">
              DropClarity is built to turn messy job data into clear operating decisions.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6 lg:mt-12">
            {[
              ["Which jobs are profitable?", "See revenue, costs, profit, and margin by job instead of guessing from totals."],
              ["Where are costs leaking?", "Spot labor, material, and other cost categories that are hurting margin."],
              ["What should I fix next?", "Get operator-ready recommendations instead of staring at spreadsheets."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <h3 className="text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-4 font-semibold leading-7 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16 md:px-8 lg:py-18">
        <h2 className="text-center text-[28px] font-black tracking-tight text-slate-950 sm:text-3xl md:text-4xl">
          Pricing questions
        </h2>

        <div className="mt-9 space-y-3 lg:mt-10">
          {[
            ["Can I start for free?", "Yes. The free trial is meant to help you test a one-time profitability scan before committing to an ongoing plan."],
            ["Do I need integrations?", "No. You can start with uploads. Integrations and automated workflows can come later."],
            ["Which plan should I choose?", "Most operators should start with Core if they want serious ongoing job profitability visibility. Scale is best when you want alerts, benchmarks, priority actions, and team visibility."],
            ["Can I cancel anytime?", "Yes. The pricing is designed to be simple and flexible."],
          ].map(([q, a]) => (
            <details key={q} className="rounded-xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer list-none font-black text-slate-950">
                {q} <span className="float-right">+</span>
              </summary>
              <p className="mt-4 font-semibold leading-7 text-slate-500">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-12 sm:px-6 sm:py-14 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <h2 className="max-w-3xl text-xl font-bold leading-snug tracking-tight text-slate-950 sm:text-2xl lg:text-[26px]">
            Start with one job profitability scan.
            <br className="hidden sm:block" />
            Upgrade <span className="font-normal text-slate-700">when you’re ready for ongoing clarity.</span>
          </h2>

          <a
            href="/app"
            className="w-full rounded-full bg-violet-500 px-8 py-3 text-center text-sm font-black text-white shadow-xl shadow-violet-200 transition hover:bg-violet-600 sm:w-auto sm:px-14"
          >
            Run a Free Scan
          </a>
        </div>
      </section>
    </main>
  );
}
