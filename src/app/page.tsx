"use client";

type PlanId = "core" | "scale";

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
    "Identify exactly where you're losing money across jobs",
    "Recoverable profit identified automatically",
    "Real-time high-risk job alerts (email + dashboard)",
    "Priority action items (what to fix next)",
    "Advanced job benchmarking",
    "Team visibility",
  ],
},
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
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(139,92,246,.18),transparent_32%),radial-gradient(circle_at_82%_72%,rgba(59,130,246,.18),transparent_36%),linear-gradient(135deg,#ffffff,#ffffff,#f8fbff)]" />

        <div className="relative mx-auto grid max-w-[1600px] items-center gap-16 px-5 py-16 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:py-24 xl:gap-20">
          <div className="w-full max-w-[720px]">
            <div className="mb-6 inline-flex rounded-full border border-violet-200 bg-white px-4 py-2 text-xs font-black text-violet-700 shadow-sm sm:text-sm">
              Built for HVAC, plumbing, roofing, electrical, and home service operators
            </div>

            <h1 className="max-w-[720px] pb-2 text-4xl font-black leading-[1.14] tracking-[-0.035em] text-slate-950 sm:text-5xl md:text-[52px] lg:text-[54px] xl:text-[58px]">
              Find the Jobs
              <span className="block bg-gradient-to-r from-slate-950 via-violet-700 to-slate-950 bg-clip-text pb-1 text-transparent">
                Draining Your Profit.
              </span>
            </h1>

            <p className="mt-7 max-w-[650px] text-base font-semibold leading-8 text-slate-600 sm:text-lg">
              DropClarity shows you exactly which jobs are making money and which ones are quietly losing it.
              Upload job exports, invoices, bills, or cost files and turn messy numbers into instant job-level profit clarity.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/app"
                className="rounded-full bg-violet-500 px-8 py-4 text-center text-sm font-black text-white shadow-xl shadow-violet-300 transition hover:bg-violet-600 hover:shadow-violet-400"
              >
                Run Free Profit Scan
              </a>
              <a
                href="#pricing"
                className="rounded-full border border-slate-200 bg-white px-7 py-4 text-center text-sm font-black text-slate-800 shadow-sm transition hover:border-violet-200"
              >
                View Pricing
              </a>
            </div>

            <div className="mt-4 text-sm font-bold text-slate-400">
              No setup required • Works with your existing job files
            </div>

            <div className="mt-8 grid max-w-[650px] grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                ["20–30%", "jobs underpriced"],
                ["$5k–$20k+", "profit lost monthly"],
                ["Job-level", "profit visibility"],
              ].map(([a, b]) => (
                <div key={a} className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm">
                  <div className="text-xl font-black text-slate-950">{a}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{b}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-violet-300/70 via-blue-200/60 to-cyan-100/70 blur-3xl" />

            <div className="relative min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-blue-200/70">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <div className="text-sm font-black text-slate-950">DropClarity Job Profitability</div>
                  <div className="mt-1 text-xs font-bold text-slate-400">Latest upload • 24 jobs analyzed</div>
                </div>
                <div className="w-fit rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black text-rose-700 shadow-sm shadow-rose-100">
                  ⚠ 5 Profit Leaks Detected
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
                    ["Losing Jobs", "5", "text-rose-600"],
                  ].map(([label, value, color]) => (
                    <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="text-[10px] font-black uppercase leading-tight tracking-wider text-slate-400">{label}</div>
                      <div className={`mt-2 whitespace-nowrap text-[17px] font-black leading-tight ${color || "text-slate-950"}`}>{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
                  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="font-black text-slate-950">Profit by Job</div>
                    <div className="mt-1 text-xs font-bold text-slate-400">Green = profitable, red = losing money</div>

                    <div className="mt-6 flex h-48 items-end justify-center gap-8 border-b border-slate-100 px-4 sm:gap-12 sm:px-8">
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
                        ["HVAC Install", "$18,420", "Revenue $42,500 • Costs $24,080"],
                        ["Roof Repair", "$9,740", "Revenue $28,900 • Costs $19,160"],
                        ["Plumbing Job", "-$3,250", "Labor overrun • Materials above estimate"],
                        ["Electrical Job", "-$1,180", "Underpriced service package"],
                      ].map(([name, profit, meta]) => {
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
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="font-black text-slate-950">Smart Insights</div>
                    <div className="mt-1 text-xs font-bold text-slate-400">Operator-ready recommendations</div>

                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm shadow-rose-100">
                        <div className="text-sm font-black text-rose-700">5 jobs are leaking profit</div>
                        <div className="mt-1 text-xs font-bold leading-5 text-rose-700/80">
                          Labor and material costs pushed several jobs below target margin.
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                        <div className="text-sm font-black text-amber-700">Pricing may be too low</div>
                        <div className="mt-1 text-xs font-bold leading-5 text-amber-700/80">
                          Similar jobs should be quoted higher before the next dispatch or install.
                        </div>
                      </div>

                      <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                        <div className="text-sm font-black text-violet-700">Recommended next step</div>
                        <div className="mt-1 text-xs font-bold leading-5 text-violet-700/80">
                          Review the bottom 5 jobs and adjust labor assumptions, materials markup, or service pricing.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <div className="text-sm font-black">Operator summary</div>
                      <div className="mt-1 text-sm font-semibold leading-6 text-white/70">
                        24 jobs analyzed. 5 jobs need attention. Estimated recoverable margin opportunity: $14,800+.
                      </div>
                    </div>
                    <div className="w-full rounded-full bg-white px-4 py-3 text-center text-xs font-black text-slate-950 md:w-fit">
                      View Full Report
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mx-auto max-w-3xl text-[28px] font-black leading-[1.2] tracking-tight text-slate-950 sm:text-3xl md:text-[36px]">
            You think the job made money.{" "}
            <span className="text-violet-600">
              DropClarity shows if it actually did.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-[15px] font-medium leading-7 text-slate-500 sm:text-[16px] sm:leading-7">
            Home service businesses stay busy and bring in revenue, but still lose margin from hidden labor, materials, and missed costs.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-xl shadow-slate-100">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-lg font-black text-violet-600">!</div>
              <h3 className="text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-4 font-semibold leading-7 text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Built for the home service businesses where job margins matter most
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-500 sm:text-lg">
            Whether you run HVAC, plumbing, roofing, electrical, landscaping, restoration, or another trade, the problem is the same:
            you need to know which jobs are actually making money.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-24">
        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">How it Works</h2>
        <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-500 sm:text-lg">
          DropClarity turns messy job files into a clean profitability dashboard so you can stop guessing and start making better pricing decisions.
        </p>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map(([title, desc], i) => (
            <div key={title} className="relative text-center">
              <div className="mx-auto mb-4 w-fit rounded-full bg-violet-50 px-4 py-1 text-xs font-black text-violet-600">
                {String(i + 1).padStart(2, "0")}
              </div>

              <h3 className="text-xl font-black text-slate-950">{title}</h3>

              <div className="mx-auto mt-3 h-[2px] w-10 rounded-full bg-violet-400/60" />

              <p className="mx-auto mt-4 max-w-[300px] text-sm font-semibold leading-7 text-slate-500">
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
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white">
              ROI-focused profitability clarity
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              One fixed profit leak can pay for DropClarity many times over.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-white/65 sm:text-lg">
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

      <section id="pricing" className="mx-auto max-w-[1320px] px-5 py-20 text-center sm:px-8 sm:py-24">
        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Pricing</h2>
        <p className="mx-auto mt-5 max-w-3xl text-base font-semibold text-slate-500 sm:text-lg">
          Start with one free job scan. Core gives you complete job profitability visibility. Scale adds advanced oversight, alerts, and priority actions.
        </p>

        <div className="mt-14 grid items-stretch gap-6 text-left lg:grid-cols-3">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex min-h-[650px] min-w-0 flex-col rounded-3xl border bg-white p-8 shadow-xl shadow-slate-100 ${
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
                  <h3 className="whitespace-nowrap text-[26px] font-black leading-tight tracking-[-0.02em] text-slate-950">
                    {plan.name}
                  </h3>

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
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Frequently Asked Questions
        </h2>

        <div className="mt-12 space-y-3">
          {[
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
            [
              "Can I cancel anytime?",
              "Yes. The pricing is designed to be simple and flexible.",
            ],
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
    </main>
  );
}
