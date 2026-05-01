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
            <div className="processVisual" aria-label="DropClarity AI file analysis preview">
              <div className="visualGlow" />

              <div className="fileCard visualCard">
                <div className="visualLabel">Files uploaded</div>

                <div className="fileRow">
                  <span className="fileIcon sheet">XLS</span>
                  <span>Job Costs.xlsx</span>
                </div>

                <div className="fileRow">
                  <span className="fileIcon pdf">PDF</span>
                  <span>Invoices.pdf</span>
                </div>

                <div className="fileRow">
                  <span className="fileIcon sheet">CSV</span>
                  <span>Labor Report.csv</span>
                </div>
              </div>

              <div className="aiCore">
                <span>AI</span>
              </div>

              <div className="metricCard revenue visualCard">
                <span>Revenue</span>
                <strong>$1.24M</strong>
              </div>

              <div className="metricCard costs visualCard">
                <span>Costs</span>
                <strong>$860K</strong>
              </div>

              <div className="metricCard margin visualCard">
                <span>Margin</span>
                <strong>31%</strong>
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
                <div className="bellIcon">!</div>
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
  width: min(1320px, calc(100vw - 56px));
  margin: 0 auto;
}

.howHero .howInner {
  padding: 54px 0 46px;
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
  font-size: clamp(30px, 4vw, 38px);
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
  grid-template-columns: minmax(420px, 0.95fr) minmax(520px, 1fr);
  gap: 64px;
  align-items: start;
}

.stepsColumn {
  padding-top: 18px;
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

.sectionEyebrow {
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
  min-height: 590px;
  border: 1px solid rgba(124, 58, 237, 0.10);
  border-radius: 30px;
  background:
    radial-gradient(500px 300px at 50% 30%, rgba(124, 58, 237, 0.16), transparent 62%),
    radial-gradient(420px 300px at 12% 12%, rgba(34, 211, 238, 0.09), transparent 58%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.07);
  padding: 28px;
  overflow: hidden;
}

.visualGlow {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent 0%, rgba(124, 58, 237, 0.06) 48%, transparent 100%),
    linear-gradient(0deg, transparent 0%, rgba(34, 211, 238, 0.055) 50%, transparent 100%);
  opacity: 0.85;
  pointer-events: none;
  animation: visualSweep 8s ease-in-out infinite alternate;
}

.visualCard {
  position: absolute;
  z-index: 2;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(16px);
  will-change: transform, box-shadow;
}

.fileCard {
  top: 34px;
  left: 34px;
  width: 220px;
  border-radius: 18px;
  padding: 18px;
  animation: softFloat 7s ease-in-out infinite;
}

.visualLabel {
  color: #0f172a;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.015em;
  margin-bottom: 14px;
}

.fileRow {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  padding: 9px 0;
}

.fileIcon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 950;
  flex: 0 0 auto;
}

.fileIcon.sheet {
  color: #059669;
  background: rgba(16, 185, 129, 0.11);
  border: 1px solid rgba(16, 185, 129, 0.18);
}

.fileIcon.pdf {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.10);
  border: 1px solid rgba(239, 68, 68, 0.16);
}

.aiCore {
  position: absolute;
  z-index: 1;
  top: 162px;
  left: 50%;
  transform: translateX(-50%);
  width: 104px;
  height: 104px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 35% 20%, rgba(255, 255, 255, 0.55), transparent 35%),
    linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  box-shadow:
    0 0 0 16px rgba(124, 58, 237, 0.10),
    0 0 0 34px rgba(124, 58, 237, 0.045),
    0 22px 50px rgba(109, 40, 217, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: aiPulse 4.2s ease-in-out infinite;
}

.aiCore::before,
.aiCore::after {
  content: "";
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.26), transparent);
  width: 440px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  animation: lineGlow 4.8s ease-in-out infinite;
}

.aiCore::after {
  transform: translate(-50%, -50%) rotate(90deg);
  animation: lineGlow 4.8s ease-in-out infinite 1.2s;
}

.aiCore span {
  position: relative;
  z-index: 2;
  color: #ffffff;
  font-size: 31px;
  font-weight: 950;
  letter-spacing: -0.05em;
}

.metricCard {
  width: 120px;
  border-radius: 16px;
  padding: 14px;
}

.metricCard span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.metricCard strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 16px;
  font-weight: 950;
}

.metricCard.revenue {
  top: 70px;
  right: 92px;
  animation: softFloat 6.6s ease-in-out infinite 0.4s;
}

.metricCard.revenue strong {
  color: #059669;
}

.metricCard.costs {
  top: 162px;
  right: 42px;
  animation: softFloat 7.2s ease-in-out infinite 0.9s;
}

.metricCard.margin {
  top: 252px;
  right: 76px;
  animation: softFloat 6.9s ease-in-out infinite 1.2s;
}

.metricCard.margin strong {
  color: #6d28d9;
}

.profitCard {
  left: 34px;
  right: 34px;
  bottom: 122px;
  border-radius: 20px;
  padding: 18px;
  animation: softFloat 7.4s ease-in-out infinite 0.7s;
}

.profitHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.profitHeader strong {
  color: #0f172a;
  font-size: 15px;
  font-weight: 950;
}

.profitHeader span {
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.08);
  color: #6d28d9;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 850;
}

.profitTable {
  margin-top: 14px;
}

.profitGrid {
  display: grid;
  grid-template-columns: 1fr 0.78fr 0.68fr 0.76fr;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
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
  left: 34px;
  right: 34px;
  bottom: 28px;
  min-height: 72px;
  border-radius: 18px;
  padding: 16px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  border-color: rgba(124, 58, 237, 0.18);
  animation: alertLift 3.8s ease-in-out infinite;
}

.bellIcon {
  position: relative;
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

.bellIcon::after {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: 999px;
  border: 1px solid rgba(124, 58, 237, 0.28);
  animation: alertPing 2.4s ease-out infinite;
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

@keyframes softFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}

@keyframes aiPulse {
  0%, 100% {
    transform: translateX(-50%) scale(1);
    box-shadow:
      0 0 0 16px rgba(124, 58, 237, 0.10),
      0 0 0 34px rgba(124, 58, 237, 0.045),
      0 22px 50px rgba(109, 40, 217, 0.24);
  }
  50% {
    transform: translateX(-50%) scale(1.045);
    box-shadow:
      0 0 0 20px rgba(124, 58, 237, 0.12),
      0 0 0 42px rgba(124, 58, 237, 0.055),
      0 26px 60px rgba(109, 40, 217, 0.30);
  }
}

@keyframes lineGlow {
  0%, 100% { opacity: 0.38; }
  50% { opacity: 0.82; }
}

@keyframes alertLift {
  0%, 100% {
    transform: translateY(0);
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
  }
  50% {
    transform: translateY(-5px);
    box-shadow: 0 22px 50px rgba(124, 58, 237, 0.13);
  }
}

@keyframes alertPing {
  0% {
    opacity: 0.58;
    transform: scale(0.92);
  }
  80%, 100% {
    opacity: 0;
    transform: scale(1.32);
  }
}

@keyframes visualSweep {
  0% { transform: translate3d(-10px, -6px, 0) scale(1); }
  100% { transform: translate3d(10px, 8px, 0) scale(1.02); }
}

@media (prefers-reduced-motion: reduce) {
  .visualGlow,
  .fileCard,
  .metricCard.revenue,
  .metricCard.costs,
  .metricCard.margin,
  .profitCard,
  .alertCard,
  .bellIcon::after,
  .aiCore,
  .aiCore::before,
  .aiCore::after {
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
    min-height: 560px;
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    min-height: 0;
    padding: 18px;
    border-radius: 24px;
  }

  .visualGlow {
    animation: none;
  }

  .visualCard,
  .fileCard,
  .metricCard,
  .profitCard,
  .alertCard {
    position: relative;
    inset: auto;
    left: auto;
    right: auto;
    top: auto;
    bottom: auto;
    width: auto;
    min-height: 0;
    animation: none;
    transform: none;
  }

  .fileCard {
    grid-column: 1 / -1;
    padding: 16px;
    border-radius: 18px;
  }

  .fileRow {
    padding: 7px 0;
  }

  .aiCore {
    position: relative;
    z-index: 2;
    grid-column: 1 / -1;
    top: auto;
    left: auto;
    transform: none;
    justify-self: center;
    width: 84px;
    height: 84px;
    margin: 4px 0;
    animation: mobileAiPulse 4.2s ease-in-out infinite;
  }

  .aiCore::before,
  .aiCore::after {
    width: min(330px, 76vw);
  }

  .aiCore span {
    font-size: 26px;
  }

  .metricCard {
    padding: 14px;
  }

  .metricCard.margin {
    display: none;
  }

  .profitCard {
    grid-column: 1 / -1;
    padding: 16px;
    border-radius: 18px;
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
    grid-column: 1 / -1;
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 12px;
    padding: 14px;
    border-radius: 18px;
  }

  .bellIcon {
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

@keyframes mobileAiPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow:
      0 0 0 14px rgba(124, 58, 237, 0.09),
      0 0 0 28px rgba(124, 58, 237, 0.045),
      0 18px 42px rgba(109, 40, 217, 0.22);
  }
  50% {
    transform: scale(1.04);
    box-shadow:
      0 0 0 17px rgba(124, 58, 237, 0.11),
      0 0 0 34px rgba(124, 58, 237, 0.052),
      0 22px 48px rgba(109, 40, 217, 0.27);
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
    gap: 10px;
    border-radius: 22px;
  }

  .fileCard,
  .profitCard,
  .alertCard,
  .valueCard,
  .cta {
    padding: 16px;
  }

  .metricCard {
    padding: 12px;
    border-radius: 15px;
  }

  .metricCard strong {
    font-size: 14px;
  }

  .profitHeader span {
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
