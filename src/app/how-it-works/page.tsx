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
            <div className="stepsIntro">
              <div className="sectionEyebrow">The process</div>
              <h2>Simple enough to use today. Powerful enough to catch what spreadsheets miss.</h2>
              <p>
                Upload the files you already have. DropClarity uses AI to read,
                organize, and interpret job financial data so you can understand
                risk faster.
              </p>
            </div>

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

/* Match Contact page width, typography, and calmer header style */
.howHero {
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background:
    radial-gradient(900px 420px at 12% -20%, rgba(124, 58, 237, 0.07), transparent 58%),
    radial-gradient(800px 380px at 88% 0%, rgba(34, 211, 238, 0.075), transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.howInner {
  width: min(1320px, calc(100vw - 48px));
  margin: 0 auto;
}

.howHero .howInner {
  padding: 56px 0 48px;
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
  font-size: 38px;
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

/* Content */
.howBody {
  padding: 42px 0 72px;
  background: #ffffff;
}

.stepsWrap {
  display: grid;
  grid-template-columns: 0.72fr 1fr;
  gap: 48px;
  align-items: start;
}

.stepsIntro {
  position: sticky;
  top: 96px;
  padding-top: 6px;
}

.sectionEyebrow {
  color: #0891b2;
  font-size: 12px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stepsIntro h2,
.sectionHeader h2 {
  margin: 12px 0 0;
  color: #0f172a;
  font-size: 30px;
  line-height: 1.12;
  letter-spacing: -0.035em;
  font-weight: 930;
}

.stepsIntro p,
.sectionHeader p {
  margin: 12px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
  font-weight: 620;
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

@media (max-width: 1180px) {
  .stepsWrap {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .stepsIntro {
    position: static;
    max-width: 820px;
  }

  .valueGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .howInner {
    width: min(100%, calc(100vw - 32px));
  }

  .howHero .howInner {
    padding: 44px 0 38px;
  }

  .howHero h1 {
    font-size: 32px;
  }

  .howHero p {
    font-size: 15.5px;
  }

  .howBody {
    padding: 30px 0 56px;
  }

  .stepsIntro h2,
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
    width: 100%;
    padding: 0 16px;
  }

  .howHero h1 {
    font-size: 29px;
  }

  .howHero p {
    font-size: 15px;
  }

  .valueCard,
  .cta {
    padding: 20px;
  }
}
`;
