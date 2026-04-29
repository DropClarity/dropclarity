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
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,.16),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,.14),transparent_32%),linear-gradient(180deg,#ffffff,#f8fbff)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-20 text-center sm:px-8 sm:py-24">
          <div className="mx-auto mb-6 inline-flex rounded-full border border-violet-200 bg-white px-4 py-2 text-xs font-black text-violet-700 shadow-sm sm:text-sm">
            Premium job profitability intelligence
          </div>

          <h1 className="mx-auto max-w-5xl text-[30px] font-black leading-[1.06] tracking-[-0.04em] text-slate-950 sm:text-[38px] md:text-[44px] lg:text-[50px]">
            Pricing built around finding profit leaks before they keep costing you.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
            Start with a free analysis, then upgrade when you want ongoing visibility into every job’s revenue, costs, margin, and next-step recommendations.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex min-h-[690px] w-full max-w-[420px] flex-col rounded-3xl border bg-white p-8 shadow-xl shadow-slate-100 ${
                  plan.featured ? "border-violet-400 ring-2 ring-violet-300" : "border-slate-200"
                }`}
              >
                {plan.featured && (
                  <div className="absolute left-8 right-8 top-0 -translate-y-1/2 rounded-full bg-violet-500 px-4 py-2 text-center text-xs font-black text-white shadow-lg shadow-violet-200">
                    Most businesses start here
                  </div>
                )}

                <div className="flex h-full flex-col pt-4">
                  <div className="min-h-[190px]">
                    <h2 className="whitespace-nowrap text-[26px] font-black leading-tight tracking-[-0.02em] text-slate-950">
                      {plan.name}
                    </h2>

                    <p className="mt-3 min-h-[24px] text-sm font-bold text-slate-400">
                      {plan.subtitle}
                    </p>

                    <p className="mt-5 min-h-[76px] text-sm font-semibold leading-6 text-slate-500">
                      {plan.description}
                    </p>
                  </div>

                  <div className="min-h-[78px]">
                    <div className="text-[40px] font-black leading-none tracking-[-0.04em] text-slate-950">
                      {plan.price}
                    </div>
                  </div>

                  <ul className="mt-3 flex-1 space-y-3 text-sm font-semibold leading-6 text-slate-600">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <span className="shrink-0 text-emerald-600">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-10">
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

      <section className="bg-slate-50 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              What every paid plan helps you answer
            </h2>
            <p className="mx-auto mt-5 max-w-2xl font-semibold leading-7 text-slate-500">
              DropClarity is built to turn messy job data into clear operating decisions.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ["Which jobs are profitable?", "See revenue, costs, profit, and margin by job instead of guessing from totals."],
              ["Where are costs leaking?", "Spot labor, material, and other cost categories that are hurting margin."],
              ["What should I fix next?", "Get operator-ready recommendations instead of staring at spreadsheets."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-4 font-semibold leading-7 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
        <h2 className="text-center text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Pricing questions
        </h2>

        <div className="mt-10 space-y-3">
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

      <section className="bg-slate-50 px-4 py-12 sm:px-6 sm:py-14">
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
