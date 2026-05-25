"use client";

import { useRef, useState } from "react";

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
  const [showDemo, setShowDemo] = useState(false);
  const demoVideoRef = useRef<HTMLVideoElement | null>(null);

  async function expandDemoVideo() {
    const video = demoVideoRef.current;
    if (!video) return;

    const mobileVideo = video as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
      webkitSupportsFullscreen?: boolean;
    };

    try {
      if (video.requestFullscreen) {
        await video.requestFullscreen();
        return;
      }

      if (mobileVideo.webkitEnterFullscreen) {
        mobileVideo.webkitEnterFullscreen();
      }
    } catch {
      // Fullscreen can be blocked by some browsers. The modal player still remains usable.
    }
  }

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
        "AI-detected profit leak",
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
        "See which jobs are actually making money",
        "Detect underpriced and underperforming work",
        "Instantly see where job costs are eating margin",
        "Revisit and compare past job performance",
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
        "Catch profit leaks before major losses",
        "Estimate recoverable profit across losing jobs",
        "Automated high-risk alerts (email + dashboard)",
        "Priority actions (what to fix next)",
        "Spot patterns behind your most profitable jobs",
        "Actionable profit recommendations per job",
      ],
    },
  ];

  const faqItems = [
    [
      "What is DropClarity?",
      "DropClarity is a job profitability platform for home service businesses. Upload invoices, exports, spreadsheets, or job files to instantly uncover profit leaks, margin risks, losing jobs, and recommended actions.",
    ],
    [
      "Who is this built for?",
      "DropClarity is built for HVAC, plumbing, roofing, electrical, landscaping, restoration, remodeling, and other home service businesses that want clearer visibility into job profitability.",
    ],
    [
      "What is the difference between Core and Scale?",
      "Core gives you the complete profitability dashboard: job analysis, KPIs, saved history, exports, trends, and cost visibility. Scale adds advanced profit oversight with automated high-risk alerts, recoverable profit insights, benchmarking, and priority actions.",
    ],
    [
      "Why does this matter?",
      "A business can be busy, booked, and growing while still losing profit on certain jobs. DropClarity helps expose underpriced jobs, labor overruns, material cost leaks, and margin problems that are easy to miss.",
    ],
    [
      "How does the analysis work?",
      "You upload job files, invoices, bills, exports, spreadsheets, or PDFs. DropClarity reviews the numbers and produces revenue, cost, margin, net profit, AI insights, and recommended actions automatically.",
    ],
    [
      "What files can I upload?",
      "You can upload invoices, bills, spreadsheets, PDFs, job exports, and other files containing revenue or cost data.",
    ],
    [
      "How quickly can I get results?",
      "Most analyses are completed in seconds. Larger PDF or multi-job uploads may take longer depending on file size and complexity.",
    ],
    [
      "Do I need accounting or financial experience?",
      "No. DropClarity is designed for operators and business owners, not accountants. The platform turns raw job data into simple profitability insights and recommended actions.",
    ],
    [
      "Why use DropClarity instead of ChatGPT or spreadsheets?",
      "ChatGPT is a general-purpose AI tool. DropClarity is purpose-built for job profitability. It automatically structures your financial data, identifies profit leaks, flags losing jobs, and delivers actionable business insights without manual prompting or spreadsheet work.",
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

        <div className="relative mx-auto grid w-full max-w-[1760px] items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.86fr_1.14fr] lg:px-10 lg:py-28 xl:gap-16 2xl:py-32">
          <div className="w-full max-w-[760px]">
            <div className="mb-5 inline-flex rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-xs font-black text-violet-700 shadow-sm shadow-violet-100/70 sm:text-sm">
              Built for home service operators
            </div>

            <h1 className="max-w-[760px] overflow-visible pt-3 pb-3 text-[38px] font-black leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-[48px] sm:leading-[1.06] md:text-[54px] lg:text-[58px] xl:text-[64px] xl:leading-[1.04]">
              <span className="block leading-[1.04]">Find the Jobs</span>
              <span className="block overflow-visible bg-gradient-to-r from-slate-950 via-violet-700 to-slate-950 bg-clip-text pb-[0.16em] pt-[0.02em] leading-[1.04] text-transparent">
                Draining Your Profit.
              </span>
            </h1>

            <p className="mt-5 max-w-[690px] text-[15px] font-semibold leading-7 text-slate-600 sm:text-[17px] sm:leading-8 lg:text-lg">
              Upload invoices, job exports, and cost files to instantly uncover profit leaks, margin risks, and underperforming work.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/app"
                className="rounded-full bg-violet-500 px-8 py-4 text-center text-sm font-black text-white shadow-xl shadow-violet-300 transition hover:-translate-y-0.5 hover:bg-violet-600 hover:shadow-violet-400"
              >
                Run Free Profit Scan
              </a>
              <button
                type="button"
                onClick={() => setShowDemo(true)}
                className="group inline-flex animate-[dc-watch-demo-bounce_2.4s_ease-in-out_infinite] items-center justify-center gap-2 rounded-full border border-violet-200 bg-white px-7 py-4 text-center text-sm font-black text-slate-900 shadow-lg shadow-violet-100 transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow-violet-200 motion-reduce:animate-none"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-500 text-[10px] text-white shadow-sm transition group-hover:bg-violet-600">
                  ▶
                </span>
                Watch Demo
              </button>
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
                ["Losing jobs", "auto detected"],
              ].map(([a, b]) => (
                <div key={a} className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
                  <div className="text-xl font-black text-slate-950">{a}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">{b}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-300/55 via-blue-200/45 to-cyan-100/50 blur-3xl sm:-inset-6" />

            <div className="relative min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-blue-200/60">
              <div className="border-b border-slate-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-950">
                      Scale Profit Control Center
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-400">
                      81 jobs analyzed • target margin 22.0%
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700">
                      ● Live
                    </div>
                    <div className="w-fit rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-black text-rose-700">
                      18 High-Risk Alerts
                    </div>
                    <div className="w-fit rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] font-black text-violet-700">
                      Email Alerts
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Recoverable Profit", "$65,531", "text-orange-600"],
                    ["Net Profit", "$1.19M", "text-emerald-600"],
                    ["Losing Jobs", "6", "text-rose-600"],
                    ["Revenue", "$2.50M", "text-slate-950"],
                  ].map(([label, value, color]) => (
                    <div
                      key={label}
                      className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="text-[10px] font-black uppercase leading-tight tracking-wider text-slate-400">
                        {label}
                      </div>
                      <div
                        className={`mt-2 whitespace-nowrap text-[22px] font-black leading-tight tracking-[-0.035em] ${color}`}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[24px] border border-amber-100 bg-gradient-to-br from-white via-amber-50/55 to-cyan-50/55 p-4 shadow-sm sm:p-5">
                  <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                    <div className="min-w-0">
                      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-cyan-600">
                        Profit leaks first
                      </div>
                      <h3 className="mt-2 text-[24px] font-black leading-none tracking-[-0.04em] text-slate-950 sm:text-[28px]">
                        6 jobs losing money
                      </h3>
                      <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                        Highest-impact risks, recoverable profit, and next steps surfaced automatically.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {["Below target", "Auto-detected", "Ready to review"].map((label) => (
                          <div
                            key={label}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 shadow-sm"
                          >
                            {label}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ["Top Opportunity", "$13,131 gap", "border-violet-100 bg-white"],
                        ["Re-analyze", "Missing cost check", "border-cyan-100 bg-cyan-50/70"],
                        ["Benchmark", "Pricing below range", "border-amber-100 bg-amber-50/70"],
                        ["Alerts", "Owner notified", "border-rose-100 bg-rose-50/70"],
                      ].map(([label, value, cls]) => (
                        <div key={label} className={`rounded-2xl border p-4 ${cls}`}>
                          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                            {label}
                          </div>
                          <div className="mt-2 text-sm font-black leading-5 text-slate-950">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-slate-950">
                          Priority action queue
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-400">
                          Ranked by profit impact
                        </div>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-500">
                        Live
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {[
                        ["#1", "Electrical Job", "$13,131"],
                        ["#2", "Roof Repair", "$8,420"],
                        ["#3", "Plumbing Job", "$5,910"],
                      ].map(([rank, job, amount]) => (
                        <div
                          key={job}
                          className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-100 text-[11px] font-black text-violet-700">
                              {rank}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-black text-slate-950">
                                {job}
                              </div>
                              <div className="mt-0.5 text-[11px] font-bold text-slate-400">
                                Review margin leak
                              </div>
                            </div>
                            <div className="shrink-0 text-xs font-black text-orange-600">
                              {amount}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="font-black text-slate-950">
                      AI profit intelligence
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-400">
                      Alerts, benchmarks, and next steps
                    </div>

                    <div className="mt-4 grid gap-3">
                      {[
                        ["High-risk alerts", "18 active alerts", "border-rose-200 bg-rose-50 text-rose-700"],
                        ["Re-analyze", "Missing invoice check", "border-cyan-100 bg-cyan-50 text-cyan-700"],
                        ["Next action", "Fix top profit leak", "border-violet-100 bg-violet-50 text-violet-700"],
                      ].map(([title, meta, cls]) => (
                        <div key={title} className={`rounded-2xl border p-4 ${cls}`}>
                          <div className="text-sm font-black">{title}</div>
                          <div className="mt-1 text-xs font-bold opacity-80">{meta}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <div className="text-sm font-black">
                        $65,531 recoverable profit identified
                      </div>
                      <div className="mt-1 text-sm font-semibold leading-6 text-white/70">
                        Top risks prioritized and ready for review.
                      </div>
                    </div>
                    <div className="w-full rounded-full bg-white px-4 py-3 text-center text-xs font-black text-slate-950 md:w-fit">
                      Review Profit Leaks
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-[1500px] px-5 py-20 text-center sm:px-8 sm:py-24 lg:px-10 lg:py-28">
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
        <div className="mx-auto w-full max-w-[1500px] px-5 py-20 text-center sm:px-8 sm:py-24 lg:px-10 lg:py-28">
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

      <section className="mx-auto w-full max-w-[1500px] px-5 py-20 text-center sm:px-8 sm:py-24 lg:px-10 lg:py-28">
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
        <div className="mx-auto grid w-full max-w-[1500px] gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10 lg:py-28">
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

          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              ["1", "underpriced job found"],
              ["$14.8k+", "estimated margin opportunity"],
              ["24", "jobs reviewed instantly"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-3xl border border-white/10 bg-white/10 p-5 sm:p-6">
                <div className="text-[26px] font-black leading-none tracking-[-0.03em] sm:text-3xl lg:text-4xl">{a}</div>
                <div className="mt-3 text-[12px] font-bold uppercase leading-5 tracking-wide text-white/50 sm:text-sm">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-[30px] font-black leading-tight tracking-[-0.035em] text-slate-950 sm:text-[38px]">
              Pricing
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-[15px] font-bold leading-7 text-slate-500 sm:text-[16px]">
              Start with one free job scan. Core gives you complete job profitability visibility. Scale adds advanced oversight, alerts, and priority actions.
            </p>
          </div>

          <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 xl:grid xl:snap-none xl:grid-cols-3 xl:gap-6 xl:overflow-visible xl:px-0 xl:pb-0">
            {pricing.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex min-h-[560px] w-[86vw] max-w-[360px] flex-none snap-center flex-col rounded-[28px] border bg-white p-6 shadow-[0_18px_60px_rgba(2,6,23,.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(2,6,23,.11)] sm:w-[390px] sm:max-w-[390px] sm:p-7 md:w-[420px] md:max-w-[420px] lg:w-[430px] lg:max-w-[430px] xl:min-h-[610px] xl:w-auto xl:max-w-none xl:p-8 ${
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

      <section id="faq" className="bg-slate-50/80 px-5 pt-20 pb-28 sm:px-8 sm:pt-24 sm:pb-32 lg:px-10 lg:pt-28 lg:pb-36">
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

      {showDemo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-2 py-3 backdrop-blur-md sm:px-5 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-label="DropClarity demo video"
          onClick={() => setShowDemo(false)}
        >
          <div
            className="relative w-full max-w-[min(96vw,1400px)] overflow-hidden rounded-2xl bg-black shadow-2xl shadow-slate-950/50 sm:rounded-[1.75rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4">
              <button
                type="button"
                onClick={expandDemoVideo}
                aria-label="Expand demo video"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/65 backdrop-blur transition hover:bg-white/15 hover:text-white sm:h-10 sm:w-10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 sm:h-5 sm:w-5"
                >
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setShowDemo(false)}
                aria-label="Close demo video"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 backdrop-blur transition hover:bg-white/15 hover:text-white sm:h-10 sm:w-10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <video
              ref={demoVideoRef}
              src="/videos/dropclarity-demo.mp4"
              controls
              autoPlay
              playsInline
              className="aspect-video max-h-[88vh] w-full bg-black object-contain"
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes dc-watch-demo-bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>

    </main>
  );
}
