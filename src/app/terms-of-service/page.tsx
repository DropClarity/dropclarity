export default function TermsOfServicePage() {
  return (
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="legalInner">
        <section className="legalHero">
          <p className="legalEyebrow">Terms of Service</p>
          <h1>Terms of Service</h1>
          <p className="legalUpdated">Last updated: May 1, 2026</p>
          <p className="legalIntro">
            DropClarity provides job profitability analysis tools for business operators. These terms explain
            how the platform may be used, what users are responsible for, and the limits of AI-generated insights.
          </p>
        </section>

        <section className="legalDocument" aria-label="Terms of Service sections">
          <article className="legalSection">
            <div className="sectionNumber">1</div>
            <div className="sectionCopy">
              <h2>Use of Platform</h2>
              <p>
                DropClarity helps users upload job-related files and review job-level profitability metrics,
                including revenue, costs, net profit, margin, cost categories, credits, high-risk job indicators,
                and AI-generated insights.
              </p>
              <p>
                The platform is intended for business use and is designed to help operators better understand
                job performance from the documents they choose to upload.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">2</div>
            <div className="sectionCopy">
              <h2>Accounts and Access</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and for all activity under
                your account.
              </p>
              <p>
                You agree to use DropClarity only for lawful business purposes and to provide accurate account,
                billing, and contact information when using the service.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">3</div>
            <div className="sectionCopy">
              <h2>Uploaded Content</h2>
              <p>
                You retain ownership of files and data you upload. You grant DropClarity the rights needed to
                process uploaded content to provide, maintain, secure, troubleshoot, and improve the service.
              </p>
              <p>
                You are responsible for ensuring that you have the right to upload and process any documents
                submitted through the platform.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">4</div>
            <div className="sectionCopy">
              <h2>AI-Generated Insights</h2>
              <p>
                DropClarity may use AI systems to extract information, organize job-level data, identify trends,
                and generate summaries, alerts, recommendations, and other analysis results.
              </p>
              <p>
                AI-generated outputs may contain errors or omissions. You are responsible for reviewing results
                before relying on them for business decisions.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">5</div>
            <div className="sectionCopy">
              <h2>No Professional Advice</h2>
              <p>
                DropClarity provides data analysis and AI-generated insights for informational purposes only. We
                do not provide accounting, financial, legal, tax, pricing, payroll, or professional business advice.
              </p>
              <p>
                Users are solely responsible for reviewing outputs and making their own business decisions.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">6</div>
            <div className="sectionCopy">
              <h2>Acceptable Use</h2>
              <p>You agree not to misuse DropClarity or interfere with the operation of the platform.</p>
              <ul>
                <li>Do not use DropClarity for unlawful or fraudulent activity.</li>
                <li>Do not upload content you do not have permission to use.</li>
                <li>Do not attempt to disrupt, scrape, overload, or misuse the service.</li>
                <li>Do not bypass billing, security, authentication, or access controls.</li>
              </ul>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">7</div>
            <div className="sectionCopy">
              <h2>Subscriptions and Billing</h2>
              <p>
                Paid plans are billed according to the subscription terms shown at checkout or in your billing
                portal.
              </p>
              <p>
                Access may be limited, suspended, or canceled if payment fails, your subscription ends, or these
                terms are violated.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">8</div>
            <div className="sectionCopy">
              <h2>Availability and Changes</h2>
              <p>
                We may update, modify, suspend, or discontinue parts of DropClarity at any time.
              </p>
              <p>
                We aim to keep the service reliable, but we do not guarantee uninterrupted, error-free, or always
                available operation.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">9</div>
            <div className="sectionCopy">
              <h2>Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, DropClarity is not liable for indirect, incidental, special,
                consequential, lost-profit, revenue-loss, business-interruption, or data-loss damages arising from
                use of the service or reliance on analysis results.
              </p>
              <p>
                Your use of the platform is at your own discretion and risk.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">10</div>
            <div className="sectionCopy">
              <h2>Contact</h2>
              <p>
                Questions about these Terms of Service can be sent to <strong>info@dropclarity.com</strong>.
              </p>
            </div>
          </article>
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
  padding: 34px 0 72px;
  background:
    radial-gradient(1000px 520px at 0% -10%, rgba(124, 58, 237, 0.08), transparent 64%),
    radial-gradient(1000px 520px at 100% 0%, rgba(34, 211, 238, 0.1), transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: #0f172a;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  overflow-x: hidden;
}

.legalInner {
  width: min(100% - 56px, 1180px);
  margin: 0 auto;
}

.legalHero {
  max-width: 980px;
  padding: 16px 0 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.12);
}

.legalEyebrow {
  margin: 0 0 10px;
  color: #4f46e5;
  font-size: 11px;
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.legalHero h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(32px, 3.2vw, 46px);
  font-weight: 900;
  line-height: 1.04;
  letter-spacing: -0.052em;
}

.legalUpdated {
  margin: 12px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 750;
  line-height: 1.55;
}

.legalIntro {
  max-width: 940px;
  margin: 17px 0 0;
  color: #475569;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.72;
}

.legalDocument {
  width: min(100%, 1040px);
  padding: 8px 0 0;
}

.legalSection {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 24px;
  padding: 30px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.12);
}

.legalSection:last-child {
  border-bottom: 0;
}

.sectionNumber {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
}

.sectionCopy {
  max-width: 900px;
}

.sectionCopy h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.25;
  letter-spacing: -0.028em;
}

.sectionCopy p {
  margin: 10px 0 0;
  color: #475569;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.72;
}

.sectionCopy ul {
  margin: 10px 0 0;
  padding-left: 20px;
  color: #475569;
}

.sectionCopy li {
  margin-top: 8px;
  color: #475569;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.7;
}

.sectionCopy strong {
  color: #0f172a;
  font-weight: 850;
}

@media (max-width: 820px) {
  .dcPage {
    padding: 30px 0 52px;
  }

  .legalInner {
    width: min(100% - 32px, 1180px);
  }

  .legalHero {
    padding: 14px 0 20px;
  }

  .legalIntro {
    font-size: 15.5px;
  }

  .legalSection {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 16px;
    padding: 24px 0;
  }

  .sectionCopy h2 {
    font-size: 18.5px;
  }

  .sectionCopy p,
  .sectionCopy li {
    font-size: 15.5px;
  }
}

@media (max-width: 520px) {
  .legalInner {
    width: min(100% - 28px, 1180px);
  }

  .legalHero h1 {
    font-size: 32px;
    letter-spacing: -0.045em;
  }

  .legalSection {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 24px 0;
  }

  .sectionNumber {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .sectionCopy h2 {
    font-size: 18px;
  }

  .sectionCopy p,
  .sectionCopy li {
    font-size: 15px;
  }
}
`;
