export default function TermsOfServicePage() {
  return (
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="wrap">
        <section className="hero">
          <div className="kicker">
            <span className="kickerDot" /> Terms of Service
          </div>

          <h1>
            Terms for using <span className="gradText">DropClarity.</span>
          </h1>

          <p className="lede">
            DropClarity provides job profitability analysis tools for business
            operators. These terms explain how the platform may be used, what
            users are responsible for, and the limits of AI-generated insights.
          </p>
        </section>

        <section className="content">
          <div className="notice">
            This page is a strong launch-ready draft, but it is not legal advice.
            Have a qualified attorney review it before relying on it for full
            production use.
          </div>

          <div className="block">
            <h2>Use of Platform</h2>
            <p>
              DropClarity helps users upload job-related files and review
              job-level profitability metrics, including revenue, costs, net
              profit, margin, cost categories, credits, high-risk job indicators,
              and AI-generated insights.
            </p>
          </div>

          <div className="block">
            <h2>Accounts and Access</h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account and for all activity under your account. You agree to use
              DropClarity only for lawful business purposes.
            </p>
          </div>

          <div className="block">
            <h2>Uploaded Content</h2>
            <p>
              You retain ownership of files and data you upload. You grant
              DropClarity the rights needed to process uploaded content to
              provide, maintain, secure, troubleshoot, and improve the service.
            </p>
          </div>

          <div className="block">
            <h2>No Professional Advice</h2>
            <p>
              DropClarity provides data analysis and AI-generated insights for
              informational purposes only. We do not provide accounting,
              financial, legal, tax, pricing, payroll, or professional business
              advice.
            </p>
            <p>
              Users are solely responsible for reviewing outputs and making their
              own business decisions.
            </p>
          </div>

          <div className="block">
            <h2>Acceptable Use</h2>
            <ul>
              <li>Do not use DropClarity for unlawful or fraudulent activity.</li>
              <li>Do not upload content you do not have permission to use.</li>
              <li>Do not attempt to disrupt, scrape, overload, or misuse the service.</li>
              <li>Do not bypass billing, security, authentication, or access controls.</li>
            </ul>
          </div>

          <div className="block">
            <h2>Subscriptions and Billing</h2>
            <p>
              Paid plans are billed according to the subscription terms shown at
              checkout or in your billing portal. Access may be limited,
              suspended, or canceled if payment fails or these terms are
              violated.
            </p>
          </div>

          <div className="block">
            <h2>Availability and Changes</h2>
            <p>
              We may update, modify, suspend, or discontinue parts of
              DropClarity at any time. We aim to keep the service reliable, but
              we do not guarantee uninterrupted or error-free operation.
            </p>
          </div>

          <div className="block">
            <h2>Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, DropClarity is not liable
              for indirect, incidental, special, consequential, lost-profit,
              revenue-loss, business-interruption, or data-loss damages arising
              from use of the service or reliance on analysis results.
            </p>
          </div>

          <div className="block">
            <h2>Contact</h2>
            <p>Questions about these Terms can be sent to info@dropclarity.com.</p>
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
  letter-spacing:-.04em;
  color:#0f172a;
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
  line-height:1.6;
}
.content{
  margin-top:30px;
  display:flex;
  flex-direction:column;
  gap:22px;
}
.notice{
  border:1px solid rgba(245,158,11,.22);
  background:rgba(255,251,235,.88);
  color:rgba(120,53,15,.92);
  border-radius:18px;
  padding:14px 16px;
  font-size:14px;
  line-height:1.55;
  font-weight:700;
}
.block{
  background:white;
  border-radius:20px;
  padding:24px;
  border:1px solid rgba(0,0,0,.06);
  box-shadow:0 12px 34px rgba(15,23,42,.04);
}
.block h2{
  font-size:18px;
  font-weight:800;
  color:#0f172a;
}
.block p{
  margin-top:8px;
  color:#475569;
  line-height:1.65;
}
.block ul{
  margin-top:10px;
  padding-left:20px;
  color:#475569;
  line-height:1.65;
}
@media(max-width:768px){
  .dcPage{padding:40px 0}
  .hero{padding:26px}
  h1{font-size:32px}
  .lede{font-size:16px}
}
`;