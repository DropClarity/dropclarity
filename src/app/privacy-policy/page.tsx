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
