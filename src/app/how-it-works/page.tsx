export default function HowItWorksPage() {
  return (
    <main className="howPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <section className="howHero">
        <div className="howInner">
          <div className="eyebrow">How It Works</div>

          <h1>From uploaded files to profit clarity.</h1>

          <p>
            DropClarity turns messy job data into clear, actionable insights —
            without manual entry. Upload your files and see which jobs are
            making money, which are underperforming, and where margin is quietly
            leaking.
          </p>
        </div>
      </section>

      <section className="howBody">
        <div className="howInner">
          <section className="stepsWrap">
            <div className="processVisual" aria-label="DropClarity file-to-profit preview">
              <div className="previewTopline">
                <div>
                  <span className="miniEyebrow">Live preview</span>
                  <h3>Files become job-level profit clarity</h3>
                </div>
                <span className="previewBadge">No manual entry</span>
              </div>

              <div className="uploadPreview visualCard">
                <div className="cardHeader">
                  <strong>Files uploaded</strong>
                  <span>3 files</span>
                </div>

                <div className="fileList">
                  <div className="fileRow">
                    <span className="fileIcon sheet">XLS</span>
                    <div>
                      <strong>Job Costs.xlsx</strong>
                      <p>Labor + materials</p>
                    </div>
                  </div>

                  <div className="fileRow">
                    <span className="fileIcon pdf">PDF</span>
                    <div>
                      <strong>Invoices.pdf</strong>
                      <p>Revenue documents</p>
                    </div>
                  </div>

                  <div className="fileRow">
                    <span className="fileIcon csv">CSV</span>
                    <div>
                      <strong>Labor Report.csv</strong>
                      <p>Job cost details</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="aiStrip">
                <span className="aiDot" />
                <strong>AI organizes files by job</strong>
                <span>Revenue, costs, margin, and risk</span>
              </div>

              <div className="metricGrid">
                <div className="metricMini visualCard">
                  <span>Revenue</span>
                  <strong>$1.24M</strong>
                </div>
                <div className="metricMini visualCard">
                  <span>Costs</span>
                  <strong>$860K</strong>
                </div>
                <div className="metricMini visualCard">
                  <span>Margin</span>
                  <strong>31%</strong>
                </div>
              </div>

              <div className="profitCard visualCard">
                <div className="profitHeader">
                  <strong>Job Profitability</strong>
                  <span>Live view</span>
                </div>

                <div className="profitTable">
                  <div className="profitGrid tableHead">
                    <span>Job</span>
                    <span>Revenue</span>
                    <span>Net</span>
                    <span>Status</span>
                  </div>

                  {visualRows.map((row) => (
                    <div className="profitGrid" key={row.job}>
                      <span>{row.job}</span>
                      <span>{row.revenue}</span>
                      <span className={row.netClass}>{row.net}</span>
                      <span className={`status ${row.statusClass}`}>{row.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="alertCard visualCard">
                <div className="alertIcon">!</div>
                <div>
                  <strong>High-risk job detected</strong>
                  <p>Building C is below target margin</p>
                </div>
                <span>Just now</span>
              </div>
            </div>

            <div className="stepsColumn">
              <div className="sectionEyebrow">The process</div>
              <h2>AI turns uploaded job files into clear profit decisions.</h2>
              <p className="stepsIntroCopy">
                Upload the files you already have. DropClarity reads, organizes,
                and interprets job financial data so you can understand risk faster.
              </p>

              <div className="steps">
                {steps.map((step, i) => (
                  <article className="stepRow" key={step.title}>
                    <div className="stepNumber">{i + 1}</div>

                    <div className="stepContent">
                      <h2>{step.title}</h2>
                      <p>{step.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="valueSection">
            <div className="sectionHeader">
              <div className="sectionEyebrow">What you actually get</div>
              <h2>A clearer view of every job.</h2>
              <p>
                DropClarity is designed to help operators turn file uploads into
                decisions — not another spreadsheet that needs to be decoded.
              </p>
            </div>

            <div className="valueGrid">
              {valuePoints.map((v) => (
                <article className="valueCard" key={v.title}>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="cta">
            <div>
              <h2>Find your profit leaks in minutes.</h2>
              <p>
                Upload your job files and quickly see what’s working, what’s not,
                and where you may be losing money.
              </p>
            </div>

            <a href="/app">Start analyzing</a>
          </section>
        </div>
      </section>
    </main>
  );
}

const steps = [
  {
    title: "Upload your job files",
    desc: "Upload invoices, bills, cost reports, spreadsheets, PDFs, or job exports. No manual entry or complicated setup required.",
  },
  {
    title: "AI reads and interprets the files",
    desc: "DropClarity uses AI to understand messy documents, pull out the important revenue and cost details, and organize them by job.",
  },
  {
    title: "See job-level profitability",
    desc: "View revenue, costs, net profit, margin percentage, and cost breakdowns so you can quickly understand which jobs are performing well.",
  },
  {
    title: "Catch high-risk jobs sooner",
    desc: "Spot jobs that are losing money or falling below your target margin, with real-time alerts when a job needs attention.",
  },
  {
    title: "Take action with confidence",
    desc: "Use the insights to adjust pricing, review cost issues, improve job performance, and protect margin before the same problem repeats.",
  },
];

const visualRows = [
  {
    job: "Building A",
    revenue: "$120K",
    net: "$40K",
    status: "Healthy",
    netClass: "goodNet",
    statusClass: "healthy",
  },
  {
    job: "Building B",
    revenue: "$95K",
    net: "$5K",
    status: "Watch",
    netClass: "warnNet",
    statusClass: "watch",
  },
  {
    job: "Building C",
    revenue: "$110K",
    net: "-$15K",
    status: "At Risk",
    netClass: "badNet",
    statusClass: "risk",
  },
];

const valuePoints = [
  {
    title: "Revenue vs Costs",
    desc: "Understand where money is coming from and where it is being spent on each job.",
  },
  {
    title: "Margin visibility",
    desc: "See your true profitability instead of relying only on revenue totals.",
  },
  {
    title: "High-risk job alerts",
    desc: "Get notified when jobs may be underperforming or quietly leaking profit.",
  },
  {
    title: "AI insights",
    desc: "Get simple explanations and next-step recommendations without manual analysis.",
  },
];

const pageCss = `
.howPage,
.howPage * {
  box-sizing: border-box;
}

.howPage {
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  overflow-x: hidden;
}

.howHero {
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background:
    radial-gradient(900px 420px at 12% -20%, rgba(124, 58, 237, 0.07), transparent 58%),
    radial-gradient(800px 380px at 88% 0%, rgba(34, 211, 238, 0.075), transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.howInner {
  width: min(1220px, calc(100vw - 64px));
  margin: 0 auto;
}

.howHero .howInner {
  padding: 52px 0 44px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(34, 211, 238, 0.24);
  background: rgba(255, 255, 255, 0.86);
  border-radius: 999px;
  padding: 7px 12px;
  color: #0891b2;
  font-size: 12px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 10px 28px rgba(34, 211, 238, 0.08);
}

.howHero h1 {
  max-width: 900px;
  margin: 18px 0 0;
  color: #0f172a;
  font-size: clamp(31px, 4vw, 42px);
  line-height: 1.08;
  letter-spacing: -0.04em;
  font-weight: 950;
}

.howHero p {
  max-width: 900px;
  margin: 16px 0 0;
  color: #475569;
  font-size: 16px;
  line-height: 1.7;
  font-weight: 650;
}

.howBody {
  padding: 48px 0 72px;
  background: #ffffff;
}

.stepsWrap {
  display: grid;
  grid-template-columns: minmax(420px, 0.95fr) minmax(500px, 1fr);
  gap: 64px;
  align-items: start;
}

.stepsColumn {
  padding-top: 16px;
}

.stepsColumn > h2 {
  max-width: 680px;
  margin: 12px 0 0;
  color: #0f172a;
  font-size: 30px;
  line-height: 1.12;
  letter-spacing: -0.035em;
  font-weight: 930;
}

.stepsIntroCopy {
  max-width: 680px;
  margin: 12px 0 24px;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
  font-weight: 620;
}

.sectionEyebrow,
.miniEyebrow {
  color: #0891b2;
  font-size: 12px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.processVisual {
  position: sticky;
  top: 92px;
  border: 1px solid rgba(124, 58, 237, 0.10);
  border-radius: 30px;
  background:
    radial-gradient(520px 300px at 50% 10%, rgba(124, 58, 237, 0.12), transparent 62%),
    radial-gradient(420px 300px at 6% 15%, rgba(34, 211, 238, 0.09), transparent 58%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.07);
  padding: 28px;
  overflow: hidden;
}

.previewTopline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.previewTopline h3 {
  margin: 9px 0 0;
  color: #0f172a;
  font-size: 22px;
  line-height: 1.14;
  letter-spacing: -0.035em;
  font-weight: 950;
}

.previewBadge {
  flex: 0 0 auto;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.08);
  color: #6d28d9;
  padding: 8px 11px;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.visualCard {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.065);
  backdrop-filter: blur(14px);
}

.uploadPreview,
.profitCard,
.alertCard {
  border-radius: 22px;
  padding: 18px;
}

.cardHeader,
.profitHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cardHeader strong,
.profitHeader strong {
  color: #0f172a;
  font-size: 15px;
  font-weight: 950;
}

.cardHeader span,
.profitHeader span {
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.08);
  color: #6d28d9;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 850;
}

.fileList {
  margin-top: 14px;
  display: grid;
  gap: 10px;
}

.fileRow {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  color: #475569;
}

.fileRow strong {
  display: block;
  color: #334155;
  font-size: 13px;
  font-weight: 850;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fileRow p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 650;
}

.fileIcon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 950;
  flex: 0 0 auto;
}

.fileIcon.sheet,
.fileIcon.csv {
  color: #059669;
  background: rgba(16, 185, 129, 0.11);
  border: 1px solid rgba(16, 185, 129, 0.18);
}

.fileIcon.pdf {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.10);
  border: 1px solid rgba(239, 68, 68, 0.16);
}

.aiStrip {
  position: relative;
  margin: 18px auto;
  width: fit-content;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid rgba(124, 58, 237, 0.14);
  border-radius: 999px;
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  color: #ffffff;
  padding: 11px 16px;
  box-shadow: 0 16px 36px rgba(124, 58, 237, 0.18);
}

.aiStrip strong {
  font-size: 13px;
  font-weight: 950;
  white-space: nowrap;
}

.aiStrip span:last-child {
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  font-weight: 750;
  white-space: nowrap;
}

.aiDot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.16);
  animation: dotPulse 1.9s ease-in-out infinite;
}

.metricGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metricMini {
  border-radius: 18px;
  padding: 16px;
}

.metricMini span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
}

.metricMini strong {
  display: block;
  margin-top: 5px;
  color: #0f172a;
  font-size: 18px;
  font-weight: 950;
  letter-spacing: -0.03em;
}

.metricMini:first-child strong {
  color: #059669;
}

.metricMini:last-child strong {
  color: #6d28d9;
}

.profitCard {
  margin-top: 14px;
}

.profitTable {
  margin-top: 14px;
}

.profitGrid {
  display: grid;
  grid-template-columns: 1fr 0.72fr 0.62fr 0.7fr;
  gap: 10px;
  align-items: center;
  padding: 9px 0;
  color: #0f172a;
  font-size: 12px;
  font-weight: 780;
}

.tableHead {
  color: #64748b;
  font-size: 11px;
  font-weight: 850;
  padding-top: 0;
}

.goodNet { color: #059669; }
.warnNet { color: #ca8a04; }
.badNet { color: #dc2626; }

.status {
  width: fit-content;
  border-radius: 999px;
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.status.healthy {
  color: #059669;
  background: rgba(16, 185, 129, 0.10);
}

.status.watch {
  color: #c2410c;
  background: rgba(249, 115, 22, 0.10);
}

.status.risk {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.10);
}

.alertCard {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  border-color: rgba(124, 58, 237, 0.18);
}

.alertIcon {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 950;
  box-shadow: 0 12px 24px rgba(124, 58, 237, 0.22);
}

.alertCard strong {
  display: block;
  color: #0f172a;
  font-size: 14px;
  font-weight: 950;
}

.alertCard p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 650;
}

.alertCard > span {
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.08);
  color: #6d28d9;
  padding: 6px 9px;
  font-size: 11px;
  font-weight: 850;
  white-space: nowrap;
}

.steps {
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.stepRow {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 22px;
  padding: 28px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.stepNumber {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(124, 58, 237, 0.075);
  border: 1px solid rgba(124, 58, 237, 0.14);
  color: #5b21b6;
  font-size: 13px;
  font-weight: 950;
}

.stepContent h2 {
  margin: 0;
  color: #0f172a;
  font-size: 19px;
  line-height: 1.25;
  letter-spacing: -0.025em;
  font-weight: 900;
}

.stepContent p {
  max-width: 720px;
  margin: 9px 0 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.7;
  font-weight: 620;
}

.valueSection {
  margin-top: 54px;
}

.sectionHeader {
  max-width: 780px;
}

.sectionHeader h2 {
  margin: 12px 0 0;
  color: #0f172a;
  font-size: 30px;
  line-height: 1.12;
  letter-spacing: -0.035em;
  font-weight: 930;
}

.sectionHeader p {
  margin: 12px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
  font-weight: 620;
}

.valueGrid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.valueCard {
  border: 1px solid rgba(15, 23, 42, 0.09);
  border-radius: 22px;
  background: #ffffff;
  padding: 22px;
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.045);
}

.valueCard h3 {
  margin: 0;
  color: #0f172a;
  font-size: 17px;
  line-height: 1.25;
  letter-spacing: -0.02em;
  font-weight: 900;
}

.valueCard p {
  margin: 9px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.65;
  font-weight: 620;
}

.cta {
  margin-top: 42px;
  border: 1px solid rgba(34, 211, 238, 0.16);
  border-radius: 24px;
  background:
    radial-gradient(700px 260px at 0% 0%, rgba(34, 211, 238, 0.075), transparent 62%),
    linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.04);
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
}

.cta h2 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  line-height: 1.2;
  letter-spacing: -0.025em;
  font-weight: 920;
}

.cta p {
  max-width: 720px;
  margin: 10px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
  font-weight: 620;
}

.cta a {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border-radius: 999px;
  padding: 0 24px;
  border: 1px solid rgba(124, 58, 237, 0.18);
  background: #7c3aed;
  color: #ffffff;
  text-decoration: none;
  font-size: 14px;
  font-weight: 850;
  box-shadow: 0 14px 32px rgba(124, 58, 237, 0.18);
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.72; transform: scale(0.92); }
  50% { opacity: 1; transform: scale(1.12); }
}

@media (prefers-reduced-motion: reduce) {
  .aiDot {
    animation: none !important;
  }
}

@media (max-width: 1180px) {
  .howInner {
    width: min(100%, calc(100vw - 44px));
  }

  .stepsWrap {
    grid-template-columns: 1fr;
    gap: 34px;
  }

  .processVisual {
    position: relative;
    top: auto;
    max-width: 760px;
    width: 100%;
    margin: 0 auto;
  }

  .stepsColumn {
    padding-top: 0;
  }

  .valueGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .howInner {
    width: 100%;
    padding: 0 22px;
  }

  .howHero .howInner {
    padding: 42px 22px 36px;
  }

  .howHero h1 {
    max-width: 100%;
    font-size: 31px;
    letter-spacing: -0.035em;
  }

  .howHero p {
    max-width: 100%;
    font-size: 15px;
    line-height: 1.65;
  }

  .howBody {
    padding: 30px 0 56px;
  }

  .stepsWrap {
    gap: 30px;
  }

  .processVisual {
    padding: 20px;
    border-radius: 24px;
  }

  .previewTopline {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .previewTopline h3 {
    font-size: 21px;
  }

  .previewBadge {
    width: fit-content;
  }

  .aiStrip {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
    border-radius: 18px;
  }

  .aiStrip strong,
  .aiStrip span:last-child {
    white-space: normal;
  }

  .metricGrid {
    grid-template-columns: 1fr;
  }

  .profitGrid {
    grid-template-columns: 1fr 0.75fr 0.72fr;
    gap: 8px;
    font-size: 11.5px;
  }

  .profitGrid span:nth-child(4) {
    display: none;
  }

  .alertCard {
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 12px;
    padding: 14px;
  }

  .alertIcon {
    width: 38px;
    height: 38px;
  }

  .alertCard > span {
    display: none;
  }

  .stepsColumn > h2,
  .sectionHeader h2 {
    font-size: 26px;
  }

  .stepRow {
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 16px;
    padding: 24px 0;
  }

  .stepNumber {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }

  .stepContent h2 {
    font-size: 18px;
  }

  .valueGrid {
    grid-template-columns: 1fr;
  }

  .cta {
    padding: 22px;
    border-radius: 20px;
    flex-direction: column;
    align-items: flex-start;
  }

  .cta a {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .howInner {
    padding: 0 16px;
  }

  .howHero .howInner {
    padding: 38px 18px 34px;
  }

  .howHero h1 {
    font-size: 29px;
  }

  .processVisual {
    padding: 14px;
    border-radius: 22px;
  }

  .uploadPreview,
  .profitCard,
  .alertCard,
  .valueCard,
  .cta {
    padding: 16px;
  }

  .metricMini {
    padding: 14px;
  }

  .metricMini strong {
    font-size: 16px;
  }

  .profitHeader span,
  .cardHeader span {
    display: none;
  }

  .profitGrid {
    font-size: 11px;
  }

  .alertCard strong {
    font-size: 13.5px;
  }

  .alertCard p {
    font-size: 12.5px;
  }
}
`;
