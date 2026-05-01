export default function TermsOfServicePage() {
  const sections = [
    {
      title: "Use of Platform",
      content: (
        <>
          <p>
            DropClarity helps users upload job-related files and review job-level profitability metrics,
            including revenue, costs, net profit, margin, cost categories, credits, high-risk job indicators,
            and AI-generated insights.
          </p>
          <p>
            The platform is intended for business use and is designed to help operators better understand
            job performance from the documents they choose to upload.
          </p>
        </>
      ),
    },
    {
      title: "Accounts and Access",
      content: (
        <>
          <p>
            You are responsible for maintaining the confidentiality of your account and for all activity under
            your account.
          </p>
          <p>
            You agree to use DropClarity only for lawful business purposes and to provide accurate account,
            billing, and contact information when using the service.
          </p>
        </>
      ),
    },
    {
      title: "Uploaded Content",
      content: (
        <>
          <p>
            You retain ownership of files and data you upload. You grant DropClarity the rights needed to
            process uploaded content to provide, maintain, secure, troubleshoot, and improve the service.
          </p>
          <p>
            You are responsible for ensuring that you have the right to upload and process any documents
            submitted through the platform.
          </p>
        </>
      ),
    },
    {
      title: "AI-Generated Insights",
      content: (
        <>
          <p>
            DropClarity may use AI systems to extract information, organize job-level data, identify trends,
            and generate summaries, alerts, recommendations, and other analysis results.
          </p>
          <p>
            AI-generated outputs may contain errors or omissions. You are responsible for reviewing results
            before relying on them for business decisions.
          </p>
        </>
      ),
    },
    {
      title: "No Professional Advice",
      content: (
        <>
          <p>
            DropClarity provides data analysis and AI-generated insights for informational purposes only. We
            do not provide accounting, financial, legal, tax, pricing, payroll, or professional business advice.
          </p>
          <p>Users are solely responsible for reviewing outputs and making their own business decisions.</p>
        </>
      ),
    },
    {
      title: "Acceptable Use",
      content: (
        <>
          <p>You agree not to misuse DropClarity or interfere with the operation of the platform.</p>
          <ul>
            <li>Do not use DropClarity for unlawful or fraudulent activity.</li>
            <li>Do not upload content you do not have permission to use.</li>
            <li>Do not attempt to disrupt, scrape, overload, or misuse the service.</li>
            <li>Do not bypass billing, security, authentication, or access controls.</li>
          </ul>
        </>
      ),
    },
    {
      title: "Subscriptions and Billing",
      content: (
        <>
          <p>
            Paid plans are billed according to the subscription terms shown at checkout or in your billing
            portal.
          </p>
          <p>
            Access may be limited, suspended, or canceled if payment fails, your subscription ends, or these
            terms are violated.
          </p>
        </>
      ),
    },
    {
      title: "Availability and Changes",
      content: (
        <>
          <p>We may update, modify, suspend, or discontinue parts of DropClarity at any time.</p>
          <p>
            We aim to keep the service reliable, but we do not guarantee uninterrupted, error-free, or always
            available operation.
          </p>
        </>
      ),
    },
    {
      title: "Limitation of Liability",
      content: (
        <>
          <p>
            To the fullest extent permitted by law, DropClarity is not liable for indirect, incidental, special,
            consequential, lost-profit, revenue-loss, business-interruption, or data-loss damages arising from
            use of the service or reliance on analysis results.
          </p>
          <p>Your use of the platform is at your own discretion and risk.</p>
        </>
      ),
    },
    {
      title: "Contact",
      content: (
        <p>
          Questions about these Terms of Service can be sent to <strong>info@dropclarity.com</strong>.
        </p>
      ),
    },
  ];

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

        <section className="legalSections" aria-label="Terms of Service sections">
          {sections.map((section, index) => (
            <article className="legalSection" key={section.title}>
              <div className="legalNumber" aria-hidden="true">
                {index + 1}
              </div>
              <div className="legalCopy">
                <h2>{section.title}</h2>
                {section.content}
              </div>
            </article>
          ))}
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
  width: 100%;
  padding: clamp(28px, 4vw, 56px) 0 clamp(56px, 7vw, 96px);
  background:
    radial-gradient(900px 480px at 2% -6%, rgba(124, 58, 237, 0.075), transparent 64%),
    radial-gradient(980px 520px at 98% -4%, rgba(34, 211, 238, 0.11), transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: #0f172a;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  overflow-x: hidden;
}

.legalInner {
  width: min(calc(100% - clamp(40px, 8vw, 160px)), 1320px);
  margin: 0 auto;
}

.legalHero {
  padding: clamp(14px, 2vw, 24px) 0 clamp(24px, 3vw, 36px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
}

.legalEyebrow {
  margin: 0 0 10px;
  color: #4f46e5;
  font-size: 11px;
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.legalHero h1 {
  max-width: 900px;
  margin: 0;
  color: #0f172a;
  font-size: clamp(34px, 3.1vw, 52px);
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
  max-width: 1180px;
  margin: 20px 0 0;
  color: #334155;
  font-size: clamp(15.5px, 1.05vw, 17px);
  font-weight: 600;
  line-height: 1.75;
}

.legalSections {
  padding: 8px 0 0;
}

.legalSection {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: clamp(18px, 2.2vw, 32px);
  padding: clamp(30px, 3vw, 44px) 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
}

.legalSection:last-child {
  border-bottom: 0;
}

.legalNumber {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  margin-top: 2px;
  border: 1px solid rgba(79, 70, 229, 0.16);
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.075);
  color: #4f46e5;
  font-size: 12px;
  font-weight: 850;
  line-height: 1;
  flex: 0 0 auto;
}

.legalCopy {
  min-width: 0;
}

.legalCopy h2 {
  max-width: 920px;
  margin: 0;
  color: #0f172a;
  font-size: clamp(19px, 1.45vw, 24px);
  font-weight: 900;
  line-height: 1.22;
  letter-spacing: -0.028em;
}

.legalCopy p {
  max-width: 1160px;
  margin: 12px 0 0;
  color: #334155;
  font-size: clamp(15px, 1vw, 16.5px);
  font-weight: 600;
  line-height: 1.72;
}

.legalCopy ul {
  max-width: 1160px;
  margin: 12px 0 0;
  padding-left: 20px;
  color: #334155;
}

.legalCopy li {
  margin-top: 8px;
  color: #334155;
  font-size: clamp(15px, 1vw, 16.5px);
  font-weight: 600;
  line-height: 1.68;
}

.legalCopy strong {
  color: #0f172a;
  font-weight: 850;
}

@media (min-width: 1440px) {
  .legalInner {
    width: min(calc(100% - 220px), 1360px);
  }
}

@media (max-width: 1180px) {
  .legalInner {
    width: min(calc(100% - 56px), 1120px);
  }

  .legalHero h1 {
    font-size: clamp(34px, 4vw, 46px);
  }
}

@media (max-width: 820px) {
  .dcPage {
    padding: 30px 0 64px;
  }

  .legalInner {
    width: min(calc(100% - 40px), 760px);
  }

  .legalHero {
    padding: 12px 0 24px;
  }

  .legalHero h1 {
    font-size: clamp(32px, 7vw, 40px);
  }

  .legalIntro,
  .legalCopy p,
  .legalCopy li {
    font-size: 15.5px;
    line-height: 1.72;
  }

  .legalSection {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 14px;
    padding: 28px 0;
  }

  .legalNumber {
    width: 24px;
    height: 24px;
  }
}

@media (max-width: 560px) {
  .dcPage {
    padding: 26px 0 56px;
  }

  .legalInner {
    width: min(calc(100% - 32px), 520px);
  }

  .legalHero {
    padding-top: 10px;
  }

  .legalEyebrow {
    font-size: 10.5px;
    letter-spacing: 0.12em;
  }

  .legalHero h1 {
    font-size: clamp(30px, 8vw, 36px);
    letter-spacing: -0.045em;
  }

  .legalUpdated {
    font-size: 12.5px;
  }

  .legalIntro {
    margin-top: 18px;
    font-size: 15.5px;
    line-height: 1.72;
  }

  .legalSection {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 26px 0;
  }

  .legalCopy h2 {
    font-size: 20px;
  }

  .legalCopy p,
  .legalCopy li {
    font-size: 15.25px;
    line-height: 1.7;
  }
}

@media (max-width: 390px) {
  .legalInner {
    width: min(calc(100% - 28px), 360px);
  }

  .legalHero h1 {
    font-size: 29px;
  }

  .legalCopy h2 {
    font-size: 19px;
  }
}
`;
