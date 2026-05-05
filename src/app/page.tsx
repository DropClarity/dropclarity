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

export default function Home() {
  const steps = [
    [
      "Upload your job data",
      "Upload invoices, bills, job exports, estimates, spreadsheets, PDFs, or cost files from your home service business.",
    ],
    [
      "Find hidden profit leaks",
      "DropClarity breaks down revenue, labor, materials, costs, margin, and flags the jobs quietly eating your profit.",
    ],
    [
      "Know what to fix next",
      "Get AI insights, recommended actions, saved report history, and a clearer view of which jobs to price, quote, or manage differently.",
    ],
  ];

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

  const faqItems = [
    [
      "What is DropClarity?",
      "DropClarity is a job profitability tool for home service businesses. It turns uploaded revenue and cost data into clear profit insights, margin risks, losing job flags, and recommended actions.",
    ],
    [
      "Who is this built for?",
      "DropClarity is built for HVAC, plumbing, roofing, electrical, landscaping, restoration, remodeling, and other home service operators who want to understand which jobs are actually profitable.",
    ],
    [
      "What is the difference between Core and Scale?",
      "Core gives you the complete profitability dashboard: job analysis, KPIs, saved history, trends, exports, and cost mix visibility. Scale adds the advanced oversight layer: priority actions, high-risk alerts, benchmarks, recoverable profit estimates, team visibility, and future integrations.",
    ],
    [
      "Why does this matter?",
      "A business can be busy, booked, and growing while still losing profit on certain jobs. DropClarity helps expose underpriced jobs, labor overruns, material cost leaks, and margin problems that are easy to miss.",
    ],
    [
      "How does the analysis work?",
      "You upload job files, invoices, bills, exports, spreadsheets, or PDFs. DropClarity reviews the numbers and produces revenue, cost, margin, net profit, AI insights, and recommendations.",
    ],
    [
      "What files can I upload?",
      "You can start with invoices, bills, job exports, spreadsheets, PDFs, or other files that show revenue and cost details.",
    ],
    [
      "Why use DropClarity instead of ChatGPT or spreadsheets?",
      "ChatGPT is a general-purpose tool. You still have to prompt it, structure your data, and interpret the results yourself. DropClarity is built specifically for job profitability. It automatically turns raw job data into structured financial outputs, highlights profit leaks, flags losing jobs, and delivers operator-ready decisions without manual setup.",
    ],
    ["Can I cancel anytime?", "Yes. The pricing is designed to be simple and flexible."],
  ];

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

    if (data?.url) window.location.href = data.url;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950 [font-family:ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Arial]">
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(139,92,246,.18),transparent_32%),radial-gradient(circle_at_82%_72%,rgba(59,130,246,.18),transparent_36%),linear-gradient(135deg,#ffffff,#ffffff,#f8fbff)]" />

        <div className="relative mx-auto grid w-full max-w-[1760px] items-center gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[0.86fr_1.14fr] lg:px-10 lg:py-24 xl:gap-16 2xl:py-28">
          <div className="w-full max-w-[760px]">
            <div className="mb-5 inline-flex rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-xs font-black text-violet-700 shadow-sm shadow-violet-100/70 sm:text-sm">
              Built for HVAC, plumbing, roofing, electrical, and home service operators
            </div>

            <h1 className="max-w-[760px] pb-2 text-[38px] font-black leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-[48px] md:text-[54px] lg:text-[58px] xl:text-[64px]">
              Find the Jobs
              <span className="block bg-gradient-to-r from-slate-950 via-violet-700 to-slate-950 bg-clip-text pb-1 text-transparent">
                Draining Your Profit.
              </span>
            </h1>

            <p className="mt-5 max-w-[690px] text-[15px] font-semibold leading-7 text-slate-600 sm:text-[17px] sm:leading-8 lg:text-lg">
              DropClarity shows you exactly which jobs are making money and which ones are quietly losing it.
              Upload job exports, invoices, bills, or cost files and turn messy numbers into instant job-level profit clarity.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/app"
                className="rounded-full bg-violet-500 px-8 py-4 text-center text-sm font-black text-white shadow-xl shadow-violet-300 transition hover:-translate-y-0.5 hover:bg-violet-600 hover:shadow-violet-400"
              >
                Run Free Profit Scan
              </a>
              <a
                href="#pricing"
                className="rounded-full border border-slate-200 bg-white px-7 py-4 text-center text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/50"
              >
                View Pricing
              </a>
            </div>

            <div className="mt-4 text-sm font-bold text-slate-400">
              No setup required • Works with your existing job files
            </div>

            <div className="mt-7 grid max-w-[690px] grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["20–30%", "jobs underpriced"],
                ["$5k–$20k+", "profit lost monthly"],
                ["Job-level", "profit visibility"],
              ].map(([a, b]) => (
                <div key={a} className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
                  <div className="text-xl font-black text-slate-950">{a}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{b}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-violet-300/70 via-blue-200/60 to-cyan-100/70 blur-3xl sm:-inset-8" />

            <div className="relative min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-blue-200/70">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <div className="text-sm font-black text-slate-950">Live Profit Intelligence</div>
                  <div className="mt-1 text-xs font-bold text-slate-400">Latest upload • 24 jobs analyzed</div>
                  <div className="mt-1 text-xs font-black text-emerald-600">● Live monitoring active: tracking new jobs automatically</div>
                </div>
                <div className="w-fit rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 shadow-sm shadow-rose-100">
                  🚨 5 High-Risk Jobs Detected — alerts sent
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
                  {[
                    ["Revenue", "$284,650", ""],
                    ["Costs", "$216,920", ""],
                    ["Net Profit", "$67,730", "text-emerald-600"],
                    ["Margin", "23.8%", ""],
                    ["Jobs", "24", ""],
                    ["High-Risk Jobs", "5", "text-rose-600"],
                  ].map(([label, value, color]) => (
                    <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="text-[10px] font-black uppercase leading-tight tracking-wider text-slate-400">{label}</div>
                      <div className={`mt-2 whitespace-nowrap text-[17px] font-black leading-tight ${color || "text-slate-950"}`}>{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="font-black text-slate-950">Job Profit Visualized</div>
                    <div className="mt-1 text-xs font-bold text-slate-400">Shows which jobs are profitable, thin, or actively losing money</div>

                    <div className="mt-6 flex h-44 items-end justify-center gap-8 border-b border-slate-100 px-4 sm:h-48 sm:gap-12 sm:px-8">
                      <div className="flex min-w-0 flex-col items-center">
                        <div className="mb-2 text-sm font-black text-emerald-600">$18.4k</div>
                        <div className="h-32 w-12 rounded-t-xl bg-emerald-400 shadow-lg shadow-emerald-100" />
                      </div>
                      <div className="flex min-w-0 flex-col items-center">
                        <div className="mb-2 text-sm font-black text-emerald-600">$9.7k</div>
                        <div className="h-24 w-12 rounded-t-xl bg-emerald-400 shadow-lg shadow-emerald-100" />
                      </div>
                      <div className="flex min-w-0 flex-col items-center">
                        <div className="mb-2 text-sm font-black text-rose-600">-$3.2k</div>
                        <div className="h-14 w-12 rounded-t-xl bg-rose-400 shadow-lg shadow-rose-100" />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ["HVAC Install", "$18,420", "Revenue $42,500 • Costs $24,080", "Healthy"],
                        ["Roof Repair", "$9,740", "Revenue $28,900 • Costs $19,160", "Healthy"],
                        ["Plumbing Job", "-$3,250", "Labor overrun", "Critical"],
                        ["Electrical Job", "-$1,180", "Underpriced service package", "Critical"],
                      ].map(([name, profit, meta, status]) => {
                        const losing = profit.includes("-");
                        return (
                          <div key={name} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div className="text-sm font-black text-slate-950">{name}</div>
                              <div className={`whitespace-nowrap text-sm font-black ${losing ? "text-rose-600" : "text-emerald-600"}`}>
                                {profit}
                              </div>
                            </div>
                            <div className={`mt-1 break-words text-[11px] font-bold ${losing ? "text-rose-500/80" : "text-slate-400"}`}>
                              {meta}
                            </div>
                            <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${losing ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                              {status}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="font-black text-slate-950">AI Profit Intelligence Engine</div>
                    <div className="mt-1 text-xs font-bold text-slate-400">Continuously analyzing job performance, benchmarks, and risk signals</div>

                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm shadow-rose-100">
                        <div className="text-sm font-black text-rose-700">5 jobs actively losing margin</div>
                        <div className="mt-1 text-xs font-bold leading-5 text-rose-700/80">
                          Triggered by labor overruns and material cost variance.
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                        <div className="text-sm font-black text-amber-700">Pricing below benchmark range</div>
                        <div className="mt-1 text-xs font-bold leading-5 text-amber-700/80">
                          Similar jobs are closing at higher margins across your service mix.
                        </div>
                      </div>

                      <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                        <div className="text-sm font-black text-violet-700">Immediate action recommended</div>
                        <div className="mt-1 text-xs font-bold leading-5 text-violet-700/80">
                          Adjust pricing, labor assumptions, and material markup before the next dispatch.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black text-slate-500">
                      {["Live Alerts", "Benchmarks", "Profit Signals"].map((label) => (
                        <div
                          key={label}
                          className="inline-flex min-w-fit flex-1 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center leading-none sm:flex-none"
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <div className="text-sm font-black">$14,800+ in recoverable profit identified this week</div>
                      <div className="mt-1 text-sm font-semibold leading-6 text-white/70">
                        5 jobs need immediate attention before more margin is lost.
                      </div>
                    </div>
                    <div className="w-full rounded-full bg-white px-4 py-3 text-center text-xs font-black text-slate-950 md:w-fit">
                      Review High-Risk Jobs
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-[1500px] px-5 py-16 text-center sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mx-auto max-w-3xl text-[28px] font-black leading-[1.16] tracking-[-0.035em] text-slate-950 sm:text-[34px] lg:text-[38px]">
            You think the job made money.{" "}
            <span className="text-violet-600">
              DropClarity shows if it actually did.
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-[15px] font-semibold leading-7 text-slate-500 sm:text-[16px]">
            Home service businesses stay busy and bring in revenue, but still lose margin from hidden labor, materials, and missed costs.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            [
              "Underpriced jobs",
              "Find jobs where the quote looked fine upfront but actual costs destroyed the margin.",
            ],
            [
              "Labor overruns",
              "See when labor hours or subcontractor costs are eating more profit than expected.",
            ],
            [
              "Material cost leaks",
              "Catch material-heavy jobs where equipment, parts, or supplies are reducing margin.",
            ],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-[24px] border border-slate-200 bg-white p-6 text-left shadow-xl shadow-slate-100 sm:p-7">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-lg font-black text-violet-600">!</div>
              <h3 className="text-xl font-black tracking-[-0.01em] text-slate-950">{title}</h3>
              <p className="mt-4 text-[15px] font-semibold leading-7 text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto w-full max-w-[1500px] px-5 py-16 text-center sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <h2 className="mx-auto max-w-4xl text-[28px] font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-[34px]">
            Built for the home service businesses where job margins matter most
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-[15px] font-semibold leading-7 text-slate-500 sm:text-[16px]">
            Whether you run HVAC, plumbing, roofing, electrical, landscaping, restoration, or another trade, the problem is the same:
            you need to know which jobs are actually making money.
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "HVAC",
              "Plumbing",
              "Roofing",
              "Electrical",
              "Landscaping",
              "Restoration",
              "Remodeling",
              "General home services",
            ].map((trade) => (
              <div key={trade} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-800 shadow-sm">
                {trade}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1500px] px-5 py-16 text-center sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <h2 className="text-[28px] font-black tracking-[-0.035em] text-slate-950 sm:text-[34px]">How it Works</h2>
        <p className="mx-auto mt-4 max-w-3xl text-[15px] font-semibold leading-7 text-slate-500 sm:text-[16px]">
          DropClarity turns messy job files into a clean profitability dashboard so you can stop guessing and start making better pricing decisions.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map(([title, desc], i) => (
            <div key={title} className="relative text-center">
              <div className="mx-auto mb-4 w-fit rounded-full bg-violet-50 px-4 py-1 text-xs font-black text-violet-600">
                {String(i + 1).padStart(2, "0")}
              </div>

              <h3 className="text-xl font-black text-slate-950">{title}</h3>

              <div className="mx-auto mt-3 h-[2px] w-10 rounded-full bg-violet-400/60" />

              <p className="mx-auto mt-4 max-w-[320px] text-sm font-semibold leading-7 text-slate-500">
                {desc}
              </p>

              {i !== steps.length - 1 && (
                <div className="absolute right-[-20px] top-1/2 hidden h-16 w-px -translate-y-1/2 bg-slate-200 md:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-950 text-white">
        <div className="mx-auto grid w-full max-w-[1500px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10 lg:py-24">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white">
              ROI-focused profitability clarity
            </div>
            <h2 className="text-[28px] font-black tracking-[-0.035em] sm:text-[34px]">
              One fixed profit leak can pay for DropClarity many times over.
            </h2>
            <p className="mt-4 text-[15px] font-semibold leading-7 text-white/65 sm:text-[16px]">
              If one underpriced job costs your business $3,000, $8,000, or $15,000 in missed profit, the software is not the expense.
              The hidden margin leak is.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["1", "underpriced job found"],
              ["$14.8k+", "estimated margin opportunity"],
              ["24", "jobs reviewed instantly"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-3xl border border-white/10 bg-white/10 p-6">
                <div className="text-3xl font-black">{a}</div>
                <div className="mt-2 text-sm font-bold uppercase tracking-wide text-white/50">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-[30px] font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-[38px]">
              Pricing
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-[15px] font-bold leading-7 text-slate-500 sm:text-[16px]">
              Start with one free job scan. Core gives you complete job profitability visibility. Scale adds advanced oversight, alerts, and priority actions.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
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
                    <h3 className="text-[23px] font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-[25px]">
                      {plan.name}
                    </h3>

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

      <section id="faq" className="bg-slate-50/80 px-5 pt-16 pb-24 sm:px-8 sm:pt-20 sm:pb-28 lg:px-10 lg:pt-24 lg:pb-32">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-xs font-black text-violet-700 shadow-sm shadow-violet-100/70 sm:text-sm">
              Frequently asked questions
            </div>

            <h2 className="text-[30px] font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-[38px]">
              Common questions before you upload
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] font-bold leading-7 text-slate-500 sm:text-[16px]">
              Quick answers about the product, uploads, pricing, and how DropClarity helps operators act on job profitability.
            </p>
          </div>

          <div className="mt-9 grid gap-3 lg:grid-cols-2">
            {faqItems.map(([q, a]) => (
              <details
                key={q}
                className="group rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md hover:shadow-slate-100 open:shadow-[0_16px_44px_rgba(2,6,23,.07)] sm:p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-black leading-6 text-slate-950 sm:text-base">
                  <span>{q}</span>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-lg font-black text-slate-700 transition group-open:rotate-45 group-open:bg-violet-50 group-open:text-violet-700">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm font-semibold leading-7 text-slate-500 sm:text-[15px]">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
