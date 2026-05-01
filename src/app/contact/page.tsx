"use client";

import React, { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("Demo request");
  const [message, setMessage] = useState("");

  const mailtoHref = `mailto:info@dropclarity.com?subject=${encodeURIComponent(
    `DropClarity — ${topic}`
  )}&body=${encodeURIComponent(
    `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nTopic: ${topic}\n\nMessage:\n${message}`
  )}`;

  return (
    <main className="contactPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <section className="contactHero">
        <div className="contactInner">
          <div className="eyebrow">Contact DropClarity</div>

          <h1>Questions about job profitability?</h1>

          <p>
            Reach out for product questions, demo requests, upload support,
            billing help, or anything related to using DropClarity to find
            job-level profit leaks.
          </p>
        </div>
      </section>

      <section className="contactBody">
        <div className="contactInner">
          <div className="contactGrid">
            <div className="contactPanel formPanel">
              <div className="panelHeader">
                <h2>Send a message</h2>
                <p>
                  Fill this out and your email app will open with a prepared
                  message to info@dropclarity.com.
                </p>
              </div>

              <div className="formGrid">
                <div className="field">
                  <label>Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="field">
                  <label>Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>

                <div className="field">
                  <label>Company</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company name"
                  />
                </div>

                <div className="field">
                  <label>Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    <option>Demo request</option>
                    <option>Product question</option>
                    <option>Upload support</option>
                    <option>Billing question</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="field fieldFull">
                  <label>Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you need help with..."
                  />
                </div>
              </div>

              <div className="buttonRow">
                <a className="primaryButton" href={mailtoHref}>
                  Send message
                </a>

                <a className="secondaryButton" href="mailto:info@dropclarity.com">
                  Email directly
                </a>
              </div>

              <p className="smallNote">
                If the button does not open your email app, email us directly at{" "}
                <strong>info@dropclarity.com</strong>.
              </p>
            </div>

            <aside className="contactPanel helpPanel">
              <div className="panelHeader">
                <h2>What we can help with</h2>
                <p>
                  DropClarity is built for operators who want faster visibility
                  into margin, costs, and underperforming jobs.
                </p>
              </div>

              <div className="helpList">
                {helpItems.map((item, index) => (
                  <div className="helpCard" key={item.title}>
                    <div className="helpNumber">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <div className="preContact">
            <div>
              <h2>Before you reach out</h2>
              <p>
                The most helpful details are what type of business you run, what
                files you currently export, and what you want to understand:
                losing jobs, cost mix, margin targets, pricing issues, or
                profitability by job.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const helpItems = [
  {
    title: "Demo requests",
    text:
      "See how uploaded job files turn into revenue, costs, margin, profit, and high-risk job visibility.",
  },
  {
    title: "Upload support",
    text:
      "Need help with file formats, dashboard results, or job mapping? Send the details and we’ll help you troubleshoot.",
  },
  {
    title: "Billing questions",
    text:
      "Ask about Core, Scale, subscription status, cancellation, or whether DropClarity fits your workflow.",
  },
];

const pageCss = `
.contactPage,
.contactPage * {
  box-sizing: border-box;
}

.contactPage {
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  overflow-x: hidden;
}

/* Wider, calmer header section */
.contactHero {
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  background:
    radial-gradient(900px 420px at 12% -20%, rgba(124, 58, 237, 0.07), transparent 58%),
    radial-gradient(800px 380px at 88% 0%, rgba(34, 211, 238, 0.075), transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.contactInner {
  width: min(1320px, calc(100vw - 48px));
  margin: 0 auto;
}

.contactHero .contactInner {
  padding: 56px 0 48px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(34, 211, 238, 0.24);
  background: rgba(255, 255, 255, 0.86);
  border-radius: 999px;
  padding: 7px 12px;
  color: #0891b2;
  font-size: 12px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 10px 28px rgba(34, 211, 238, 0.08);
}

.contactHero h1 {
  max-width: 900px;
  margin: 18px 0 0;
  color: #0f172a;
  font-size: 38px;
  line-height: 1.08;
  letter-spacing: -0.04em;
  font-weight: 950;
}

.contactHero p {
  max-width: 900px;
  margin: 16px 0 0;
  color: #475569;
  font-size: 16px;
  line-height: 1.7;
  font-weight: 650;
}

/* More spacious content area */
.contactBody {
  padding: 42px 0 72px;
  background: #ffffff;
}

.contactGrid {
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(360px, 0.88fr);
  gap: 22px;
  align-items: stretch;
}

.contactPanel {
  border: 1px solid rgba(15, 23, 42, 0.09);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.045);
  overflow: hidden;
}

.formPanel {
  padding: 28px;
}

.helpPanel {
  padding: 28px;
  background:
    radial-gradient(620px 260px at 100% 0%, rgba(34, 211, 238, 0.08), transparent 60%),
    linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.panelHeader h2 {
  margin: 0;
  color: #0f172a;
  font-size: 23px;
  line-height: 1.15;
  letter-spacing: -0.025em;
  font-weight: 920;
}

.panelHeader p {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.65;
  font-weight: 620;
}

.formGrid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.fieldFull {
  grid-column: 1 / -1;
}

.field label {
  color: #64748b;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #ffffff;
  color: #0f172a;
  border-radius: 16px;
  padding: 13px 14px;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 650;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field textarea {
  min-height: 150px;
  resize: vertical;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: rgba(34, 211, 238, 0.70);
  box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.14);
}

.buttonRow {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.primaryButton,
.secondaryButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border-radius: 15px;
  padding: 0 18px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 850;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
}

.primaryButton {
  border: 1px solid rgba(34, 211, 238, 0.24);
  background: linear-gradient(90deg, rgba(34, 211, 238, 0.18), rgba(124, 58, 237, 0.15));
  color: #0f172a;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.secondaryButton {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #ffffff;
  color: #0f172a;
}

.primaryButton:hover,
.secondaryButton:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.09);
}

.smallNote {
  margin: 18px 0 0;
  color: #64748b;
  font-size: 13.5px;
  line-height: 1.6;
  font-weight: 620;
}

.smallNote strong {
  color: #0f172a;
}

.helpList {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.helpCard {
  display: flex;
  gap: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  padding: 18px;
}

.helpNumber {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.18), rgba(124, 58, 237, 0.14));
  color: #0f172a;
  font-size: 13px;
  font-weight: 950;
}

.helpCard h3 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  line-height: 1.25;
  font-weight: 900;
}

.helpCard p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.65;
  font-weight: 620;
}

.preContact {
  margin-top: 22px;
  border: 1px solid rgba(34, 211, 238, 0.16);
  border-radius: 24px;
  background:
    radial-gradient(700px 260px at 0% 0%, rgba(34, 211, 238, 0.075), transparent 62%),
    linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.04);
  padding: 26px;
}

.preContact h2 {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: -0.025em;
  font-weight: 920;
}

.preContact p {
  max-width: 950px;
  margin: 10px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.7;
  font-weight: 620;
}

@media (max-width: 980px) {
  .contactGrid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .contactInner {
    width: min(100%, calc(100vw - 32px));
  }

  .contactHero .contactInner {
    padding: 44px 0 38px;
  }

  .contactHero h1 {
    font-size: 32px;
  }

  .contactHero p {
    font-size: 15.5px;
  }

  .contactBody {
    padding: 30px 0 56px;
  }

  .formPanel,
  .helpPanel {
    padding: 22px;
    border-radius: 20px;
  }

  .formGrid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .contactInner {
    width: 100%;
    padding: 0 16px;
  }

  .contactHero h1 {
    font-size: 29px;
  }

  .contactHero p {
    font-size: 15px;
  }

  .formPanel,
  .helpPanel,
  .preContact {
    padding: 20px;
  }

  .buttonRow {
    flex-direction: column;
  }

  .primaryButton,
  .secondaryButton {
    width: 100%;
  }
}
`;
