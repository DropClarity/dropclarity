export default function PrivacyPolicy() {
  return (
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="privacyWrap">
        <section className="privacyHero">
          <div className="privacyKicker">
            <span className="privacyKickerDot" /> Privacy & Data
          </div>

          <h1 className="privacyTitle">
            Your data stays{" "}
            <span className="privacyGradText">
              secure, private, and controlled.
            </span>
          </h1>

          <p className="privacyLede">
            DropClarity is built for businesses handling real financial data. We
            treat your job files, cost data, and revenue data with strict
            security and privacy standards.
          </p>
        </section>

        <section className="privacyContent">
          <div className="privacyBlock">
            <h2>Information We Collect</h2>
            <p>
              We collect information necessary to provide our services,
              including:
            </p>
            <ul>
              <li>Account information such as name and email</li>
              <li>Uploaded job files including invoices, costs, and reports</li>
              <li>Usage data to improve product performance</li>
            </ul>
          </div>

          <div className="privacyBlock">
            <h2>How Your Data Is Used</h2>
            <p>
              Your data is used to deliver job profitability insights, including
              revenue, costs, margin calculations, and AI-driven analysis.
            </p>
          </div>

          <div className="privacyBlock">
            <h2>AI Processing</h2>
            <p>
              Uploaded data may be processed by AI systems to extract structured
              insights. This processing is used to generate results within
              DropClarity and improve platform accuracy.
            </p>
          </div>

          <div className="privacyBlock">
            <h2>Third-Party Services</h2>
            <p>We use secure third-party providers including:</p>
            <ul>
              <li>Stripe for billing</li>
              <li>Clerk for authentication</li>
              <li>Uploadcare for file uploads and storage</li>
              <li>AI processing providers for analysis</li>
            </ul>
          </div>

          <div className="privacyBlock">
            <h2>Data Security</h2>
            <p>
              We implement safeguards including secure infrastructure, access
              controls, and reasonable data protection practices to help protect
              your information.
            </p>
          </div>

          <div className="privacyBlock">
            <h2>Your Control</h2>
            <p>
              You retain ownership of your data. You may request deletion of
              your data at any time by contacting us.
            </p>
          </div>

          <div className="privacyBlock">
            <h2>Contact</h2>
            <p>
              Questions about privacy can be sent to{" "}
              <strong>info@dropclarity.com</strong>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

const pageCss = `
.dcPage,
.dcPage * {
  box-sizing: border-box;
}

.dcPage {
  min-height: 100vh;
  padding: 72px 0 64px;
  background:
    radial-gradient(900px 500px at 0% -10%, rgba(124,58,237,.12), transparent 65%),
    radial-gradient(900px 500px at 100% 0%, rgba(34,211,238,.16), transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #0f172a;
  overflow-x: hidden;
}

.privacyWrap {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.privacyHero {
  padding: 44px;
  border-radius: 30px;
  background: rgba(255,255,255,.96);
  border: 1px solid rgba(15,23,42,.08);
  box-shadow: 0 24px 70px rgba(15,23,42,.09);
}

.privacyKicker {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #0891b2;
}

.privacyKickerDot {
  width: 7px;
  height: 7px;
  background: #22d3ee;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(34,211,238,.14);
}

.privacyTitle {
  max-width: 900px;
  font-size: 48px;
  line-height: 1.04;
  font-weight: 950;
  letter-spacing: -.05em;
  margin: 20px 0 0;
  color: #0f172a;
}

.privacyGradText {
  background: linear-gradient(90deg, #06b6d4, #6366f1, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.privacyLede {
  max-width: 900px;
  margin: 18px 0 0;
  color: #475569;
  font-size: 18px;
  line-height: 1.65;
  font-weight: 650;
}

.privacyContent {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.privacyBlock {
  background: rgba(255,255,255,.96);
  border-radius: 22px;
  padding: 24px;
  border: 1px solid rgba(15,23,42,.08);
  box-shadow: 0 14px 38px rgba(15,23,42,.055);
}

.privacyBlock h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 900;
  letter-spacing: -.02em;
}

.privacyBlock p {
  margin: 9px 0 0;
  color: #475569;
  font-size: 15.5px;
  line-height: 1.65;
  font-weight: 650;
}

.privacyBlock ul {
  margin: 10px 0 0;
  padding-left: 20px;
  color: #475569;
}

.privacyBlock li {
  margin-top: 6px;
  color: #475569;
  font-size: 15px;
  line-height: 1.55;
  font-weight: 650;
}

.privacyBlock strong {
  color: #0f172a;
  font-weight: 850;
}

@media(max-width: 768px) {
  .dcPage {
    padding: 44px 0;
  }

  .privacyHero {
    padding: 28px;
    border-radius: 24px;
  }

  .privacyTitle {
    font-size: 36px;
  }

  .privacyLede {
    font-size: 16px;
  }
}

@media(max-width: 480px) {
  .privacyWrap {
    padding: 0 16px;
  }

  .privacyHero {
    padding: 24px;
  }

  .privacyTitle {
    font-size: 32px;
  }

  .privacyBlock {
    padding: 20px;
  }
}
`;