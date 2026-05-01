export default function TermsOfServicePage() {
  return (
    <main className="termsPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <section className="termsHero">
        <div className="termsInner">
          <div className="eyebrow">Terms of Service</div>

          <h1>Terms for using DropClarity.</h1>

          <p>
            DropClarity provides job profitability analysis tools for business
            operators. These terms explain how the platform may be used, what
            users are responsible for, and the limits of AI-generated insights.
          </p>
        </div>
      </section>

      <section className="termsBody">
        <div className="termsInner">
          <div className="termsGrid">
            {sections.map((section) => (
              <article className="termsCard" key={section.title}>
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
              </article>
            ))}
          </div>
        </div>
      </section>
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
    paragraphs: ["Questions about these Terms can be sent to info@dropclarity.com."],
  },
];

const pageCss = `
.termsPage,
.termsPage * {
  box-sizing: border-box;
}

.termsPage {
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  overflow-x: hidden;
}

/* Wider, calmer header section */
.termsHero {
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background:
    radial-gradient(900px 420px at 12% -20%, rgba(124, 58, 237, 0.06), transparent 58%),
    radial-gradient(800px 380px at 88% 0%, rgba(34, 211, 238, 0.055), transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.termsInner {
  width: min(1320px, calc(100vw - 48px));
  margin: 0 auto;
}

.termsHero .termsInner {
  padding: 56px 0 48px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(15, 23, 42, 0.10);
  background: rgba(255, 255, 255, 0.82);
  border-radius: 999px;
  padding: 7px 12px;
  color: #475569;
  font-size: 12px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.termsHero h1 {
  max-width: 900px;
  margin: 18px 0 0;
  color: #0f172a;
  font-size: 38px;
  line-height: 1.08;
  letter-spacing: -0.04em;
  font-weight: 950;
}

.termsHero p {
  max-width: 900px;
  margin: 16px 0 0;
  color: #475569;
  font-size: 16px;
  line-height: 1.7;
  font-weight: 650;
}

/* More spacious content area */
.termsBody {
  padding: 42px 0 72px;
  background: #ffffff;
}

.termsGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}

.termsCard {
  min-height: 180px;
  border: 1px solid rgba(15, 23, 42, 0.09);
  border-radius: 22px;
  background: #ffffff;
  padding: 26px;
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.045);
}

.termsCard h2 {
  margin: 0;
  color: #0f172a;
  font-size: 19px;
  line-height: 1.25;
  letter-spacing: -0.02em;
  font-weight: 900;
}

.termsCard p {
  margin: 12px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.72;
  font-weight: 620;
}

.termsCard ul {
  margin: 12px 0 0;
  padding-left: 21px;
  color: #475569;
}

.termsCard li {
  margin-top: 8px;
  color: #475569;
  font-size: 15px;
  line-height: 1.65;
  font-weight: 620;
}

@media (max-width: 980px) {
  .termsGrid {
    grid-template-columns: 1fr;
  }

  .termsCard {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .termsInner {
    width: min(100%, calc(100vw - 32px));
  }

  .termsHero .termsInner {
    padding: 44px 0 38px;
  }

  .termsHero h1 {
    font-size: 32px;
  }

  .termsHero p {
    font-size: 15.5px;
  }

  .termsBody {
    padding: 30px 0 56px;
  }

  .termsCard {
    padding: 22px;
    border-radius: 20px;
  }
}

@media (max-width: 480px) {
  .termsInner {
    width: 100%;
    padding: 0 16px;
  }

  .termsHero h1 {
    font-size: 29px;
  }

  .termsHero p {
    font-size: 15px;
  }

  .termsCard {
    padding: 20px;
  }
}
`;
