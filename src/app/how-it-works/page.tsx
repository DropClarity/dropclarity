export default function HowItWorksPage() {
  return (
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="wrap">
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

        <section className="steps">
          {steps.map((step, i) => (
            <div key={i} className="stepCard">
              <div className="stepNumber">{i + 1}</div>
              <div className="stepContent">
                <h2>{step.title}</h2>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="value">
          <div className="sectionKicker">What you actually get</div>
          <h2 className="sectionTitle">A clearer view of every job.</h2>

          <div className="valueGrid">
            {valuePoints.map((v, i) => (
              <div key={i} className="valueCard">
                <div className="valueTitle">{v.title}</div>
                <div className="valueDesc">{v.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="cta">
          <h2>Find your profit leaks in minutes.</h2>
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
*{box-sizing:border-box}

.dcPage{
  min-height:100vh;
  padding:72px 0 64px;
  background:
    radial-gradient(900px 500px at 0% -10%,rgba(124,58,237,.12),transparent 65%),
    radial-gradient(900px 500px at 100% 0%,rgba(34,211,238,.16),transparent 62%),
    linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);
  font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  color:#0f172a;
}

.wrap{
  max-width:1100px;
  margin:0 auto;
  padding:0 20px;
}

/* HERO */
.hero{
  padding:44px;
  border-radius:30px;
  background:rgba(255,255,255,.96);
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 24px 70px rgba(15,23,42,.09);
}

.kicker{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:12px;
  font-weight:950;
  text-transform:uppercase;
  letter-spacing:.08em;
  color:#0891b2;
}

.kickerDot{
  width:7px;
  height:7px;
  background:#22d3ee;
  border-radius:50%;
  box-shadow:0 0 0 4px rgba(34,211,238,.14);
}

h1{
  max-width:900px;
  font-size:48px;
  line-height:1.04;
  font-weight:950;
  letter-spacing:-.05em;
  margin:20px 0 0;
  color:#0f172a;
}

.gradText{
  background:linear-gradient(90deg,#06b6d4,#6366f1,#7c3aed);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
}

.lede{
  max-width:900px;
  margin-top:18px;
  color:#475569;
  font-size:18px;
  line-height:1.65;
  font-weight:650;
}

.heroMeta{
  margin-top:22px;
  display:flex;
  flex-wrap:wrap;
  gap:10px;
}

.metaPill{
  padding:8px 12px;
  border-radius:999px;
  background:#f1f5f9;
  border:1px solid rgba(15,23,42,.06);
  color:#334155;
  font-size:12px;
  font-weight:850;
}

/* STEPS */
.steps{
  margin-top:28px;
  display:flex;
  flex-direction:column;
  gap:16px;
}

.stepCard{
  display:flex;
  align-items:flex-start;
  gap:16px;
  padding:22px;
  border-radius:22px;
  background:rgba(255,255,255,.96);
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 14px 38px rgba(15,23,42,.055);
}

.stepNumber{
  width:42px;
  height:42px;
  flex:0 0 auto;
  border-radius:14px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:linear-gradient(135deg,rgba(34,211,238,.22),rgba(124,58,237,.16));
  color:#0f172a;
  font-weight:950;
}

.stepContent h2{
  margin:0;
  color:#0f172a;
  font-size:18px;
  font-weight:900;
  letter-spacing:-.02em;
}

.stepContent p{
  margin:6px 0 0;
  color:#64748b;
  font-size:15px;
  line-height:1.55;
  font-weight:650;
}

/* VALUE */
.value{
  margin-top:44px;
}

.sectionKicker{
  color:#0891b2;
  font-size:12px;
  font-weight:950;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.sectionTitle{
  margin:8px 0 0;
  color:#0f172a;
  font-size:30px;
  line-height:1.12;
  font-weight:950;
  letter-spacing:-.04em;
}

.valueGrid{
  margin-top:18px;
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:16px;
}

.valueCard{
  padding:22px;
  border-radius:22px;
  background:rgba(255,255,255,.96);
  border:1px solid rgba(15,23,42,.08);
  box-shadow:0 14px 38px rgba(15,23,42,.055);
}

.valueTitle{
  color:#0f172a;
  font-size:16px;
  font-weight:900;
}

.valueDesc{
  margin-top:7px;
  color:#64748b;
  font-size:14px;
  line-height:1.55;
  font-weight:650;
}

/* CTA */
.cta{
  margin-top:44px;
  padding:34px;
  border-radius:26px;
  background:linear-gradient(135deg,#ecfeff,#f5f3ff);
  border:1px solid rgba(15,23,42,.08);
  text-align:center;
  box-shadow:0 18px 50px rgba(15,23,42,.06);
}

.cta h2{
  margin:0;
  color:#0f172a;
  font-size:30px;
  line-height:1.15;
  font-weight:950;
  letter-spacing:-.04em;
}

.cta p{
  max-width:680px;
  margin:10px auto 0;
  color:#475569;
  font-size:16px;
  line-height:1.6;
  font-weight:650;
}

/* RESPONSIVE */
@media(max-width:768px){
  .dcPage{
    padding:44px 0 44px;
  }

  .hero{
    padding:28px;
    border-radius:24px;
  }

  h1{
    font-size:36px;
  }

  .lede{
    font-size:16px;
  }

  .valueGrid{
    grid-template-columns:1fr;
  }
}

@media(max-width:480px){
  .wrap{
    padding:0 16px;
  }

  .hero{
    padding:24px;
  }

  h1{
    font-size:32px;
  }

  .stepCard{
    padding:18px;
  }

  .stepNumber{
    width:38px;
    height:38px;
  }

  .cta{
    padding:26px 20px;
  }

  .cta h2{
    font-size:26px;
  }
}
`;