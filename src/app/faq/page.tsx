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
          "Both are possible. You can start with a one-time scan, then upgrade to ongoing monitoring if you want better visibility into profitability trends and problem jobs.",
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
          "DropClarity is designed to handle business files carefully. Your uploaded files are used to generate the analysis and dashboard results connected to your account.",
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
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950 [font-family:ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,Arial]">
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(1050px_520px_at_12%_-12%,rgba(124,58,237,.13),transparent_58%),radial-gradient(900px_520px_at_92%_4%,rgba(34,211,238,.12),transparent_62%),linear-gradient(180deg,#ffffff,#fbfdff)]" />

        <div className="relative mx-auto w-full max-w-[1600px] px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-18">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-5 inline-flex rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-[12px] font-black text-violet-700 shadow-[0_10px_28px_rgba(124,58,237,.10)] sm:text-[13px]">
              Frequently asked questions
            </div>

            <h1 className="mx-auto max-w-5xl text-[30px] font-black leading-[1.07] tracking-[-0.045em] text-slate-950 sm:text-[38px] lg:text-[44px] xl:text-[48px]">
              Questions before you upload?
            </h1>

            <p className="mx-auto mt-5 max-w-3xl text-[15px] font-bold leading-7 text-slate-600 sm:text-[16px] lg:text-[17px]">
              Here’s what operators usually want to know before using
              DropClarity for job profitability analysis.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/app"
                className="rounded-full bg-violet-500 px-7 py-3.5 text-center text-sm font-black text-white shadow-xl shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-600"
              >
                Run a Free Profitability Scan
              </a>
              <a
                href="/pricing"
                className="rounded-full border border-slate-200 bg-white px-7 py-3.5 text-center text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/50"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="grid gap-8 lg:grid-cols-[290px_minmax(0,1fr)] xl:gap-12">
            <aside>
              <div className="sticky top-28 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(2,6,23,.08)]">
                <h2 className="text-[23px] font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-[25px]">
                  FAQ topics
                </h2>

                <p className="mt-3 text-[14px] font-semibold leading-6 text-slate-500 sm:text-[15px]">
                  Browse common questions about the product, uploads, pricing,
                  and security.
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {faqGroups.map((group) => (
                    <a
                      key={group.id}
                      href={`#${group.id}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                    >
                      {group.title}
                    </a>
                  ))}
                </div>
              </div>
            </aside>

            <div className="space-y-8 lg:space-y-10">
              {faqGroups.map((group) => (
                <section
                  key={group.id}
                  id={group.id}
                  className="scroll-mt-32 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(2,6,23,.08)] sm:p-7 lg:p-8"
                >
                  <div className="mb-6 flex flex-col gap-1 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.08em] text-cyan-600">
                        {group.id}
                      </div>

                      <h2 className="mt-1 text-[23px] font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-[28px]">
                        {group.title}
                      </h2>
                    </div>

                    <div className="text-sm font-bold text-slate-400">
                      {group.items.length} answers
                    </div>
                  </div>

                  <div className="space-y-3">
                    {group.items.map(([question, answer]) => (
                      <details
                        key={question}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(2,6,23,.035)] transition open:shadow-[0_16px_44px_rgba(2,6,23,.07)] sm:p-6"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-black text-slate-950 sm:text-[16px]">
                          <span>{question}</span>
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-50 text-lg leading-none text-slate-600 transition group-open:rotate-45 group-open:bg-violet-50 group-open:text-violet-700">
                            +
                          </span>
                        </summary>

                        <p className="mt-4 max-w-4xl text-[14px] font-semibold leading-7 text-slate-500 sm:text-[15px]">
                          {answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-12 sm:px-8 sm:py-14 lg:px-10">
        <div className="mx-auto flex w-full max-w-[1300px] flex-col items-start justify-between gap-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(2,6,23,.07)] sm:p-8 lg:flex-row lg:items-center">
          <h2 className="max-w-3xl text-[22px] font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-[28px]">
            Ready to see which jobs are helping or hurting profit?
            <br className="hidden sm:block" />
            <span className="font-semibold text-slate-600">
              Start with a simple upload.
            </span>
          </h2>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <a
              href="/app"
              className="rounded-full bg-violet-500 px-8 py-4 text-center text-sm font-black text-white shadow-xl shadow-violet-200 transition hover:bg-violet-600 sm:px-12"
            >
              Upload Files
            </a>
            <a
              href="/pricing"
              className="rounded-full border border-slate-200 bg-white px-8 py-4 text-center text-sm font-black text-slate-800 shadow-sm transition hover:border-violet-200 sm:px-12"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}