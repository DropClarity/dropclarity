export default function FAQPage() {
  const faqGroups = [
    {
      title: "Product",
      id: "product",
      items: [
        [
          "What is DropClarity?",
          "DropClarity is a job profitability analysis tool for contractors, trades, and service operators. It helps turn invoices, vendor bills, and job exports into a clear readout of revenue, costs, margin, risks, and recommended actions.",
        ],
        [
          "Who is this built for?",
          "DropClarity is built for operators who want to understand which jobs are making money, which jobs are losing money, and what to fix next without needing spreadsheets, dashboards, or a finance background.",
        ],
        [
          "How is this different from a regular dashboard?",
          "Most dashboards show numbers and leave you to interpret them. DropClarity focuses on clear explanations, job-level profitability, margin risks, and next steps you can act on.",
        ],
      ],
    },
    {
      title: "Uploads & analysis",
      id: "uploads",
      items: [
        [
          "What files can I upload?",
          "You can start with job invoices, vendor bills, revenue exports, cost exports, and similar job-related files. The goal is to match revenue and costs to jobs so DropClarity can calculate profitability.",
        ],
        [
          "How does the analysis work?",
          "DropClarity reads the uploaded files, identifies revenue and cost details, groups them by job when possible, and produces a profitability readout with KPIs, job-level comparisons, risks, and recommendations.",
        ],
        [
          "What if the model gets something wrong?",
          "You can review the job-level details and adjust fields manually. This is important because real-world job data can be messy, inconsistent, or missing details.",
        ],
      ],
    },
    {
      title: "Pricing",
      id: "pricing",
      items: [
        [
          "Can I start for free?",
          "Yes. The free option is designed for a one-time profitability preview so you can test the value before upgrading.",
        ],
        [
          "Is this a one-time analysis or ongoing tracking?",
          "Both are possible. You can start with a one-time scan, then upgrade to ongoing monitoring if you want visibility into profitability trends, problem jobs, and margin leaks.",
        ],
        [
          "Can I cancel anytime?",
          "Yes. The pricing is designed to be simple and flexible.",
        ],
      ],
    },
    {
      title: "Security & privacy",
      id: "security",
      items: [
        [
          "Is my data secure and private?",
          "DropClarity is designed to handle business files carefully. As the product matures, stronger account controls, data retention settings, and security policies should be clearly shown before selling to larger customers.",
        ],
        [
          "Do I need to connect integrations?",
          "No. You can start with uploads. Integrations and automated workflows can be added later once the core analysis experience is working smoothly.",
        ],
        [
          "Are files stored forever?",
          "The product can be configured so uploaded files are deleted after analysis or retained for report history depending on the plan and user preferences.",
        ],
      ],
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(139,92,246,.20),transparent_34%),radial-gradient(circle_at_82%_8%,rgba(124,58,237,.14),transparent_34%),radial-gradient(circle_at_50%_95%,rgba(168,85,247,.08),transparent_42%),linear-gradient(180deg,#ffffff,#fbf7ff)]" />

        <div className="relative mx-auto max-w-6xl px-5 py-16 text-center sm:px-8 sm:py-20 lg:py-24">
          <div className="mx-auto mb-5 inline-flex rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-violet-700 shadow-sm sm:text-xs">
            Frequently asked questions
          </div>

          <h1 className="mx-auto max-w-5xl text-[30px] font-black leading-[1.06] tracking-[-0.04em] text-slate-950 text-balance sm:text-[38px] md:text-[44px] lg:text-[50px]">
            Questions before you upload?
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-[15px] font-semibold leading-7 text-slate-600 sm:text-base md:text-lg md:leading-8">
            Here’s what operators usually want to know before using DropClarity for job profitability analysis.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="/app"
              className="rounded-full bg-violet-500 px-7 py-4 text-center text-sm font-black text-white shadow-xl shadow-violet-200 transition hover:bg-violet-600"
            >
              Run a Free Profitability Scan
            </a>
            <a
              href="/pricing"
              className="rounded-full border border-slate-200 bg-white px-7 py-4 text-center text-sm font-black text-slate-800 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-20">
          <aside className="lg:block">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 lg:sticky lg:top-28 lg:p-7">
              <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                FAQ topics
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500 sm:text-base sm:leading-7">
                Browse common questions about the product, uploads, pricing, and security.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {faqGroups.map((group) => (
                  <a
                    key={group.id}
                    href={`#${group.id}`}
                    className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  >
                    {group.title}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-12 lg:space-y-14">
            {faqGroups.map((group) => (
              <section key={group.id} id={group.id} className="scroll-mt-32">
                <h2 className="text-[26px] font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
                  {group.title}
                </h2>

                <div className="mt-5 space-y-3 sm:mt-6">
                  {group.items.map(([question, answer]) => (
                    <details
                      key={question}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/50"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-black leading-6 text-slate-950 sm:text-base">
                        <span>{question}</span>
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-50 text-lg font-black text-violet-700 transition group-open:rotate-45">
                          +
                        </span>
                      </summary>

                      <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-500 sm:text-base">
                        {answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,.14),transparent_34%),linear-gradient(180deg,#faf7ff,#f8fafc)] px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <h2 className="max-w-3xl text-xl font-bold leading-snug tracking-tight text-slate-950 sm:text-2xl lg:text-[26px]">
            Ready to see which jobs are helping or hurting profit?
            <br className="hidden sm:block" />
            Start <span className="font-normal text-slate-700">with a simple upload.</span>
          </h2>

          <a
            href="/pricing"
            className="w-full rounded-full bg-violet-500 px-8 py-3 text-center text-sm font-black text-white shadow-xl shadow-violet-200 transition hover:bg-violet-600 sm:w-auto sm:px-14"
          >
            View Pricing
          </a>
        </div>
      </section>
    </main>
  );
}
