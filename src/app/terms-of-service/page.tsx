export default function TermsOfServicePage() {
  return (
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="termsWrap">
        <section className="termsHero">
          <div className="termsKicker">
            <span className="termsKickerDot" /> Terms of Service
          </div>

          <h1 className="termsTitle">
            Terms for using{" "}
            <span className="termsGradText">DropClarity.</span>
          </h1>

          <p className="termsLede">
            DropClarity provides job profitability analysis tools for business
            operators. These terms explain how the platform may be used, what
            users are responsible for, and the limits of AI-generated insights.
          </p>
        </section>

        <section className="termsContent">
          <div className="termsNotice">
            This page is a strong launch-ready draft, but it is not legal advice.
            Have a qualified attorney review it before relying on it for full
            production use.
          </div>

          {sections.map((section) => (
            <div className="termsBlock" key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((text) => (
                <p key={text}>{text}</p>
              ))}
              {section.items ? (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

const sections = [
  {
    title: "Use of Platform",
    paragraphs: [
      "DropClarity helps users upload job-related files and review job-level profitability metrics, including revenue, costs, net profit, margin, cost categories, credits, high-risk job indicators, and AI-generated insights.",
    ],
  },
  {
    title: "Accounts and Access",
    paragraphs: [
      "You are responsible for maintaining the confidentiality of your account and for all activity under your account. You agree to use DropClarity only for lawful business purposes.",
    ],
  },
  {
    title: "Uploaded Content",
    paragraphs: [
      "You retain ownership of files and data you upload. You grant DropClarity the rights needed to process uploaded content to provide, maintain, secure, troubleshoot, and improve the service.",
    ],
  },
  {
    title: "No Professional Advice",
    paragraphs: [
      "DropClarity provides data analysis and AI-generated insights for informational purposes only. We do not provide accounting, financial, legal, tax, pricing, payroll, or professional business advice.",
      "Users are solely responsible for reviewing outputs and making their own business decisions.",
    ],
  },
  {
    title: "Acceptable Use",
    items: [
      "Do not use DropClarity for unlawful or fraudulent activity.",
      "Do not upload content you do not have permission to use.",
      "Do not attempt to disrupt, scrape, overload, or misuse the service.",
      "Do not bypass billing, security, authentication, or access controls.",
    ],
  },
  {
    title: "Subscriptions and Billing",
    paragraphs: [
      "Paid plans are billed according to the subscription terms shown at checkout or in your billing portal. Access may be limited, suspended, or canceled if payment fails or these terms are violated.",
    ],
  },
  {
    title: "Availability and Changes",
    paragraphs: [
      "We may update, modify, suspend, or discontinue parts of DropClarity at any time. We aim to keep the service reliable, but we do not guarantee uninterrupted or error-free operation.",
    ],
  },
  {
    title: "Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by law, DropClarity is not liable for indirect, incidental, special, consequential, lost-profit, revenue-loss, business-interruption, or data-loss damages arising from use of the service or reliance on analysis results.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "Questions about these Terms can be sent to info@dropclarity.com.",
    ],
  },
];

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

.termsWrap {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.termsHero {
  padding: 44px;
  border-radius: 30px;
  background: rgba(255,255,255,.96);
  border: 1px solid rgba(15,23,42,.08);
  box-shadow: 0 24px 70px rgba(15,23,42,.09);
}

.termsKicker {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #0891b2;
}

.termsKickerDot {
  width: 7px;
  height: 7px;
  background: #22d3ee;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(34,211,238,.14);
}

.termsTitle {
  max-width: 900px;
  font-size: 48px;
  line-height: 1.04;
  font-weight: 950;
  letter-spacing: -.05em;
  margin: 20px 0 0;
  color: #0f172a;
}

.termsGradText {
  background: linear-gradient(90deg, #06b6d4, #6366f1, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.termsLede {
  max-width: 900px;
  margin: 18px 0 0;
  color: #475569;
  font-size: 18px;
  line-height: 1.65;
  font-weight: 650;
}

.termsContent {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.termsNotice {
  border: 1px solid rgba(245,158,11,.22);
  background: rgba(255,251,235,.92);
  color: rgba(120,53,15,.95);
  border-radius: 18px;
  padding: 15px 16px;
  font-size: 14px;
  line-height: 1.55;
  font-weight: 750;
}

.termsBlock {
  background: rgba(255,255,255,.96);
  border-radius: 22px;
  padding: 24px;
  border: 1px solid rgba(15,23,42,.08);
  box-shadow: 0 14px 38px rgba(15,23,42,.055);
}

.termsBlock h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 900;
  letter-spacing: -.02em;
}

.termsBlock p {
  margin: 9px 0 0;
  color: #475569;
  font-size: 15.5px;
  line-height: 1.65;
  font-weight: 650;
}

.termsBlock ul {
  margin: 10px 0 0;
  padding-left: 20px;
  color: #475569;
}

.termsBlock li {
  margin-top: 6px;
  color: #475569;
  font-size: 15px;
  line-height: 1.55;
  font-weight: 650;
}

@media(max-width: 768px) {
  .dcPage {
    padding: 44px 0;
  }

  .termsHero {
    padding: 28px;
    border-radius: 24px;
  }

  .termsTitle {
    font-size: 36px;
  }

  .termsLede {
    font-size: 16px;
  }
}

@media(max-width: 480px) {
  .termsWrap {
    padding: 0 16px;
  }

  .termsHero {
    padding: 24px;
  }

  .termsTitle {
    font-size: 32px;
  }

  .termsBlock {
    padding: 20px;
  }
}
`;