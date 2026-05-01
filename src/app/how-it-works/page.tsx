export default function HowItWorksPage() {
  return (
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="wrap">

        {/* HERO */}
        <section className="hero">
          <div className="kicker">
            <span className="kickerDot" /> How It Works
          </div>

          <h1>
            From uploaded files to{" "}
            <span className="gradText">profit clarity.</span>
          </h1>

          <p className="lede">
            DropClarity turns messy job data into clear, actionable insights —
            without manual entry. Upload your files and instantly see which jobs
            are making money and which are quietly draining it.
          </p>

          <div className="heroMeta">
            <span className="metaPill">No manual input</span>
            <span className="metaPill">AI-powered extraction</span>
            <span className="metaPill">Job-level profitability</span>
            <span className="metaPill">Instant insights</span>
          </div>
        </section>

        {/* STEPS */}
        <section className="steps">
          {steps.map((step, i) => (
            <div key={i} className="stepCard">
              <div className="stepNumber">{i + 1}</div>
              <div>
                <h2>{step.title}</h2>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* VALUE SECTION */}
        <section className="value">
          <h2>What you actually get</h2>

          <div className="valueGrid">
            {valuePoints.map((v, i) => (
              <div key={i} className="valueCard">
                <div className="valueTitle">{v.title}</div>
                <div className="valueDesc">{v.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="cta">
          <h2>Find your profit leaks in minutes</h2>
          <p>
            Upload your job files and instantly see what’s working, what’s not,
            and where you're losing money.
          </p>
        </section>

      </div>
    </main>
  );
}

const steps = [
  {
    title: "Upload your job files",
    desc: "Upload invoices, cost reports, bills, or exports. No formatting required.",
  },
  {
    title: "We extract revenue and costs",
    desc: "DropClarity automatically pulls key financial data using AI.",
  },
  {
    title: "See job-level profitability",
    desc: "View revenue, costs, margin %, and net profit across all jobs.",
  },
  {
    title: "Identify high-risk jobs",
    desc: "Instantly see which jobs are underperforming or losing money.",
  },
  {
    title: "Take action",
    desc: "Adjust pricing, fix cost issues, and improve margins with clarity.",
  },
];

const valuePoints = [
  {
    title: "Revenue vs Costs",
    desc: "Understand exactly where money is coming from and where it’s going.",
  },
  {
    title: "Margin visibility",
    desc: "See your true profitability across every job.",
  },
  {
    title: "Profit leak detection",
    desc: "Identify jobs that are silently costing you money.",
  },
  {
    title: "AI insights",
    desc: "Get smart recommendations without manual analysis.",
  },
];

const pageCss = `
.dcPage{
  min-height:100vh;
  padding:60px 0 50px;
  background:
    radial-gradient(900px 500px at 0% -10%,rgba(124,58,237,.12),transparent),
    radial-gradient(900px 500px at 100% 0%,rgba(34,211,238,.14),transparent),
    #ffffff;
  font-family:system-ui;
}

.wrap{max-width:1100px;margin:0 auto;padding:0 20px}

.hero{
  padding:40px;
  border-radius:28px;
  background:white;
  border:1px solid rgba(0,0,0,.06);
  box-shadow:0 20px 60px rgba(0,0,0,.06);
}

.kicker{
  font-size:12px;
  font-weight:900;
  text-transform:uppercase;
  color:#0891b2;
}

.kickerDot{
  display:inline-block;
  width:6px;
  height:6px;
  background:#22d3ee;
  border-radius:50%;
  margin-right:6px;
}

h1{
  font-size:44px;
  font-weight:900;
  margin-top:10px;
}

.gradText{
  background:linear-gradient(90deg,#22d3ee,#7c3aed);
  -webkit-background-clip:text;
  color:transparent;
}

.lede{
  margin-top:14px;
  color:#475569;
  font-size:18px;
}

.heroMeta{
  margin-top:16px;
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}

.metaPill{
  padding:6px 10px;
  border-radius:999px;
  background:#f1f5f9;
  font-size:12px;
  font-weight:700;
}

/* Steps */
.steps{
  margin-top:30px;
  display:flex;
  flex-direction:column;
  gap:16px;
}

.stepCard{
  display:flex;
  gap:16px;
  padding:20px;
  border-radius:20px;
  background:white;
  border:1px solid rgba(0,0,0,.06);
}

.stepNumber{
  width:40px;
  height:40px;
  border-radius:12px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#e0f2fe;
  font-weight:900;
}

/* Value */
.value{
  margin-top:40px;
}

.valueGrid{
  margin-top:16px;
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:16px;
}

.valueCard{
  padding:18px;
  border-radius:18px;
  background:white;
  border:1px solid rgba(0,0,0,.06);
}

.valueTitle{
  font-weight:800;
}

.valueDesc{
  margin-top:6px;
  color:#475569;
}

/* CTA */
.cta{
  margin-top:50px;
  padding:30px;
  border-radius:24px;
  background:linear-gradient(135deg,#ecfeff,#f5f3ff);
  border:1px solid rgba(0,0,0,.05);
  text-align:center;
}

@media(max-width:768px){
  h1{font-size:32px}
  .valueGrid{grid-template-columns:1fr}
}
`;