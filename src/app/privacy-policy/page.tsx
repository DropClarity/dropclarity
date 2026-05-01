export default function PrivacyPolicy() {
  return (
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="wrap">

        <section className="hero">
          <div className="kicker">
            <span className="kickerDot" /> Privacy & Data
          </div>

          <h1>
            Your data stays{" "}
            <span className="gradText">secure, private, and controlled.</span>
          </h1>

          <p className="lede">
            DropClarity is built for businesses handling real financial data. We
            treat your job files, cost data, and revenue data with strict
            security and privacy standards.
          </p>
        </section>

        <section className="content">

          <div className="block">
            <h2>Information We Collect</h2>
            <p>
              We collect information necessary to provide our services, including:
            </p>
            <ul>
              <li>Account information (name, email)</li>
              <li>Uploaded job files (invoices, costs, reports)</li>
              <li>Usage data to improve product performance</li>
            </ul>
          </div>

          <div className="block">
            <h2>How Your Data Is Used</h2>
            <p>
              Your data is used strictly to deliver job profitability insights,
              including revenue, costs, margin calculations, and AI-driven analysis.
            </p>
          </div>

          <div className="block">
            <h2>AI Processing</h2>
            <p>
              Uploaded data may be processed by AI systems to extract structured
              insights. This processing is used solely to generate results within
              DropClarity and improve platform accuracy.
            </p>
          </div>

          <div className="block">
            <h2>Third-Party Services</h2>
            <p>
              We use secure third-party providers including:
            </p>
            <ul>
              <li>Stripe (billing)</li>
              <li>Clerk (authentication)</li>
              <li>Uploadcare (file storage)</li>
              <li>AI processing providers</li>
            </ul>
          </div>

          <div className="block">
            <h2>Data Security</h2>
            <p>
              We implement industry-standard safeguards including encryption,
              secure infrastructure, and access controls to protect your data.
            </p>
          </div>

          <div className="block">
            <h2>Your Control</h2>
            <p>
              You retain ownership of your data. You may request deletion of your
              data at any time by contacting us.
            </p>
          </div>

          <div className="block">
            <h2>Contact</h2>
            <p>info@dropclarity.com</p>
          </div>

        </section>
      </div>
    </main>
  );
}

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
.wrap{max-width:1000px;margin:0 auto;padding:0 20px}

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

.content{
  margin-top:30px;
  display:flex;
  flex-direction:column;
  gap:22px;
}

.block{
  background:white;
  border-radius:20px;
  padding:24px;
  border:1px solid rgba(0,0,0,.06);
}

.block h2{
  font-size:18px;
  font-weight:800;
}

.block p{
  margin-top:6px;
  color:#475569;
}

.block ul{
  margin-top:8px;
  padding-left:18px;
  color:#475569;
}

@media(max-width:768px){
  h1{font-size:32px}
}
`;