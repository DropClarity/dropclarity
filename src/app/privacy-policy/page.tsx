export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Information We Collect",
      content: (
        <>
          <p>
            We collect information necessary to provide, operate, and improve DropClarity. This may include
            account information such as your name, email address, and subscription details.
          </p>
          <p>
            We may also collect uploaded business files, including invoices, job reports, cost files,
            spreadsheets, PDFs, bills, and other documents you choose to submit for analysis.
          </p>
        </>
      ),
    },
    {
      title: "How Your Data Is Used",
      content: (
        <>
          <p>
            Your data is used to provide job profitability analysis, including revenue, costs, margins,
            net profit, cost breakdowns, benchmark comparisons, and related insights inside DropClarity.
          </p>
          <p>
            We may also use limited usage information to maintain platform performance, troubleshoot issues,
            improve accuracy, and enhance the user experience.
          </p>
        </>
      ),
    },
    {
      title: "Uploaded Files",
      content: (
        <>
          <p>
            Files you upload are used to generate analysis results within your DropClarity account. You are
            responsible for ensuring that you have the right to upload and process any documents submitted
            through the platform.
          </p>
          <p>
            DropClarity does not require you to manually input financial data. The platform is designed to
            analyze the documents you choose to upload.
          </p>
        </>
      ),
    },
    {
      title: "AI Processing",
      content: (
        <>
          <p>
            Uploaded data may be processed by AI systems to extract structured information, identify job-level
            profitability trends, and produce summaries, alerts, and recommendations.
          </p>
          <p>
            AI processing is used to provide analysis within DropClarity and improve the usefulness of the
            platform. Results should be reviewed for accuracy before being used for major business decisions.
          </p>
        </>
      ),
    },
    {
      title: "Third-Party Services",
      content: (
        <>
          <p>
            We use trusted third-party providers to operate DropClarity. These may include Stripe for billing,
            Clerk for authentication, Uploadcare for file uploads and storage, and AI processing providers for
            document analysis.
          </p>
          <p>
            These providers may process information only as needed to support the services they provide to
            DropClarity.
          </p>
        </>
      ),
    },
    {
      title: "Data Security",
      content: (
        <>
          <p>
            We use reasonable technical and organizational safeguards designed to protect your information,
            including secure infrastructure, access controls, and appropriate handling practices.
          </p>
          <p>
            No online service can guarantee complete security, but we take privacy and protection of business
            financial data seriously.
          </p>
        </>
      ),
    },
    {
      title: "Data Ownership and Control",
      content: (
        <>
          <p>
            You retain ownership of the files and business information you upload to DropClarity. We use your
            uploaded data to provide the service and generate analysis for your account.
          </p>
          <p>You may request deletion of your data by contacting us at the email address listed below.</p>
        </>
      ),
    },
    {
      title: "Billing and Account Information",
      content: (
        <>
          <p>
            Payment processing is handled by Stripe. DropClarity does not store full payment card numbers on
            its own systems.
          </p>
          <p>Account access and authentication may be managed through Clerk or another authentication provider.</p>
        </>
      ),
    },
    {
      title: "Data Retention",
      content: (
        <>
          <p>
            We retain information for as long as needed to provide the service, comply with legal obligations,
            resolve disputes, enforce agreements, and maintain business records.
          </p>
          <p>
            Retention periods may vary depending on the type of information and how it is used within the
            platform.
          </p>
        </>
      ),
    },
    {
      title: "Changes to This Policy",
      content: (
        <p>
          We may update this Privacy Policy from time to time. When changes are made, the updated version
          will be posted on this page with a revised “Last updated” date.
        </p>
      ),
    },
    {
      title: "Contact",
      content: (
        <p>
          Questions about this Privacy Policy or requests related to your data can be sent to{" "}
          <strong>info@dropclarity.com</strong>.
        </p>
      ),
    },
  ];

  return (
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="legalInner">
        <section className="legalHero">
          <p className="legalEyebrow">Privacy Policy</p>
          <h1>Privacy Policy</h1>
          <p className="legalUpdated">Last updated: May 1, 2026</p>
          <p className="legalIntro">
            DropClarity is built for businesses handling real financial data. This Privacy Policy explains
            what information we collect, how we use it, and how we protect the job files, cost data,
            revenue data, and account information you provide when using DropClarity.
          </p>
        </section>

        <section className="legalSections" aria-label="Privacy Policy sections">
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
  width: min(100% - 56px, 1120px);
  margin: 0 auto;
}

.legalHero {
  padding: 18px 0 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
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
  margin: 0;
  color: #0f172a;
  font-size: clamp(30px, 3.4vw, 44px);
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
  max-width: 960px;
  margin: 18px 0 0;
  color: #334155;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.7;
}

.legalSections {
  padding: 6px 0 0;
}

.legalSection {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 22px;
  padding: 30px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.legalSection:last-child {
  border-bottom: 0;
}

.legalNumber {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-top: 1px;
  border: 1px solid rgba(79, 70, 229, 0.14);
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.07);
  color: #4f46e5;
  font-size: 12px;
  font-weight: 850;
  line-height: 1;
}

.legalCopy h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.22;
  letter-spacing: -0.028em;
}

.legalCopy p {
  max-width: 980px;
  margin: 11px 0 0;
  color: #334155;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.68;
}

.legalCopy ul {
  max-width: 980px;
  margin: 11px 0 0;
  padding-left: 20px;
  color: #334155;
}

.legalCopy li {
  margin-top: 8px;
  color: #334155;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.65;
}

.legalCopy strong {
  color: #0f172a;
  font-weight: 850;
}

@media (max-width: 820px) {
  .dcPage {
    padding: 28px 0 54px;
  }

  .legalInner {
    width: min(100% - 32px, 1120px);
  }

  .legalHero {
    padding: 16px 0 22px;
  }

  .legalHero h1 {
    font-size: 36px;
  }

  .legalIntro,
  .legalCopy p,
  .legalCopy li {
    font-size: 15.5px;
  }

  .legalSection {
    grid-template-columns: 30px minmax(0, 1fr);
    gap: 14px;
    padding: 26px 0;
  }
}

@media (max-width: 520px) {
  .legalInner {
    width: min(100% - 28px, 1120px);
  }

  .legalHero h1 {
    font-size: 32px;
    letter-spacing: -0.045em;
  }

  .legalSection {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 24px 0;
  }

  .legalNumber {
    width: 24px;
    height: 24px;
  }

  .legalCopy h2 {
    font-size: 19px;
  }
}
`;
