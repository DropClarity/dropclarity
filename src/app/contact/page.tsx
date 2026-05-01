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
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="dcWrap">
        <section className="dcHero">
          <div className="dcKicker">
            <span className="dcKickerDot" /> Contact DropClarity
          </div>

          <h1 className="dcTitle">
            Get help finding the jobs{" "}
            <span className="dcGradText">quietly draining profit.</span>
          </h1>

          <p className="dcLede">
            Have a question about uploads, dashboard results, pricing, billing,
            or whether DropClarity fits your business? Send us a note and we’ll
            help you understand the best next step.
          </p>

          <div className="dcHeroMeta">
            <span className="dcMetaPill">Product questions</span>
            <span className="dcMetaPill">Demo requests</span>
            <span className="dcMetaPill">Upload support</span>
            <span className="dcMetaPill">Billing help</span>
          </div>
        </section>

        <section className="dcGrid">
          <div className="dcPanel">
            <div className="dcPanelHead">
              <div className="dcPanelTitle">Send a message</div>
              <div className="dcPanelSub">
                This opens your email app with a prepared message to
                info@dropclarity.com.
              </div>
            </div>

            <div className="dcPad">
              <div className="dcFormGrid">
                <div className="dcField">
                  <label>Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="dcField">
                  <label>Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>

                <div className="dcField">
                  <label>Company</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company name"
                  />
                </div>

                <div className="dcField">
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

                <div className="dcField dcFieldFull">
                  <label>Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you need help with..."
                  />
                </div>
              </div>

              <div className="dcBtnRow">
                <a className="dcBtn dcBtnPrimary" href={mailtoHref}>
                  Send message
                </a>
                <a className="dcBtn" href="mailto:info@dropclarity.com">
                  Email directly
                </a>
              </div>

              <div className="dcFooterNote">
                If the button does not open your email app, email us directly at{" "}
                <strong>info@dropclarity.com</strong>.
              </div>
            </div>
          </div>

          <aside className="dcPanel">
            <div className="dcPanelHead">
              <div className="dcPanelTitle">What we can help with</div>
              <div className="dcPanelSub">
                DropClarity is built for operators who want fast visibility into
                job profitability.
              </div>
            </div>

            <div className="dcPad dcCardList">
              <div className="dcInfoCard">
                <div className="dcIconBubble">01</div>
                <div>
                  <div className="dcInfoCardTitle">Demo requests</div>
                  <div className="dcInfoCardText">
                    See how uploaded job files turn into revenue, costs, margin,
                    profit, and high-risk job visibility.
                  </div>
                </div>
              </div>

              <div className="dcInfoCard">
                <div className="dcIconBubble">02</div>
                <div>
                  <div className="dcInfoCardTitle">Upload support</div>
                  <div className="dcInfoCardText">
                    Need help with file formats, dashboard results, or job
                    mapping? Send the details.
                  </div>
                </div>
              </div>

              <div className="dcInfoCard">
                <div className="dcIconBubble">03</div>
                <div>
                  <div className="dcInfoCardTitle">Billing questions</div>
                  <div className="dcInfoCardText">
                    Ask about Core, Scale, subscription status, cancellation, or
                    whether DropClarity fits your workflow.
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="dcHighlight">
          <div className="dcHighlightTitle">Before you reach out</div>
          <p>
            The most helpful details are what type of business you run, what
            files you currently export, and what you want to understand: losing
            jobs, cost mix, margin targets, pricing issues, or profitability by
            job.
          </p>
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
  width: 100%;
  min-height: 100vh;
  padding: 58px 0 48px;
  background:
    radial-gradient(1100px 520px at 10% -10%, rgba(124,58,237,.13), transparent 58%),
    radial-gradient(900px 520px at 92% 0%, rgba(34,211,238,.14), transparent 62%),
    radial-gradient(820px 520px at 50% 110%, rgba(52,211,153,.08), transparent 70%),
    linear-gradient(180deg, #fff, #fff);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  color: #0f172a;
  overflow-x: hidden;
}

.dcWrap {
  width: min(1180px, calc(100vw - 32px));
  margin: 0 auto;
}

.dcHero {
  border-radius: 30px;
  border: 1px solid rgba(15,23,42,.065);
  background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.84));
  box-shadow: 0 22px 70px rgba(2,6,23,.09);
  padding: 36px;
  overflow: hidden;
}

.dcKicker {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(34,211,238,.28);
  background: rgba(255,255,255,.88);
  box-shadow: 0 10px 28px rgba(34,211,238,.10);
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 950;
  color: rgba(8,145,178,.95);
  text-transform: uppercase;
  letter-spacing: .06em;
}

.dcKickerDot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, #22D3EE, #7C3AED);
  box-shadow: 0 0 0 4px rgba(34,211,238,.12);
}

.dcTitle {
  margin: 16px 0 0;
  max-width: 940px;
  font-size: 52px;
  line-height: 1.02;
  font-weight: 990;
  letter-spacing: -.055em;
  color: rgba(2,6,23,.96);
}

.dcGradText {
  background: linear-gradient(90deg, #06b6d4, #8b5cf6, #2563eb);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.dcLede {
  margin: 15px 0 0;
  max-width: 880px;
  color: rgba(51,65,85,.82);
  font-size: 18px;
  line-height: 1.6;
  font-weight: 760;
}

.dcHeroMeta {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.dcMetaPill {
  border: 1px solid rgba(15,23,42,.065);
  background: rgba(255,255,255,.84);
  border-radius: 999px;
  padding: 8px 11px;
  color: rgba(15,23,42,.62);
  font-size: 12.5px;
  font-weight: 900;
}

.dcGrid {
  display: grid;
  grid-template-columns: minmax(0, 1.06fr) minmax(330px, .94fr);
  gap: 18px;
  margin-top: 18px;
  align-items: stretch;
}

.dcPanel {
  border-radius: 26px;
  border: 1px solid rgba(15,23,42,.065);
  background: rgba(255,255,255,.86);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 54px rgba(2,6,23,.075);
  overflow: hidden;
  min-width: 0;
}

.dcPanelHead {
  padding: 20px 22px 16px;
  border-bottom: 1px solid rgba(15,23,42,.065);
  background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.82));
}

.dcPanelTitle {
  font-size: 22px;
  line-height: 1.15;
  letter-spacing: -.03em;
  font-weight: 980;
  color: rgba(15,23,42,.94);
}

.dcPanelSub {
  margin-top: 7px;
  color: rgba(15,23,42,.64);
  font-size: 14.5px;
  line-height: 1.5;
  font-weight: 760;
}

.dcPad {
  padding: 22px;
}

.dcFormGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dcField {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.dcFieldFull {
  grid-column: 1 / -1;
}

.dcField label {
  font-size: 12px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: rgba(15,23,42,.52);
}

.dcField input,
.dcField textarea,
.dcField select {
  width: 100%;
  border: 1px solid rgba(15,23,42,.10);
  background: #fff;
  border-radius: 15px;
  padding: 13px 14px;
  font-size: 14px;
  font-weight: 780;
  color: #0f172a;
  outline: none;
}

.dcField textarea {
  min-height: 150px;
  resize: vertical;
  line-height: 1.5;
}

.dcField input:focus,
.dcField textarea:focus,
.dcField select:focus {
  border-color: #22d3ee;
  box-shadow: 0 0 0 3px rgba(34,211,238,.18);
}

.dcBtnRow {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.dcBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 14px;
  border: 1px solid rgba(15,23,42,.10);
  background: rgba(255,255,255,.88);
  color: rgba(15,23,42,.90);
  padding: 12px 15px;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 920;
}

.dcBtnPrimary {
  background: linear-gradient(90deg, rgba(34,211,238,.20), rgba(124,58,237,.18));
  border-color: rgba(34,211,238,.25);
}

.dcFooterNote {
  margin-top: 18px;
  font-size: 13px;
  line-height: 1.55;
  color: rgba(15,23,42,.52);
  font-weight: 760;
}

.dcCardList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dcInfoCard {
  display: flex;
  gap: 12px;
  border: 1px solid rgba(15,23,42,.065);
  background: rgba(255,255,255,.84);
  border-radius: 18px;
  padding: 16px;
}

.dcIconBubble {
  width: 34px;
  height: 34px;
  border-radius: 13px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(34,211,238,.18), rgba(124,58,237,.14));
  border: 1px solid rgba(34,211,238,.16);
  font-weight: 990;
}

.dcInfoCardTitle {
  font-size: 15.5px;
  line-height: 1.25;
  font-weight: 950;
  color: rgba(15,23,42,.94);
}

.dcInfoCardText {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.58;
  color: rgba(15,23,42,.64);
  font-weight: 730;
}

.dcHighlight {
  margin-top: 18px;
  border-radius: 24px;
  border: 1px solid rgba(34,211,238,.16);
  background: linear-gradient(135deg, rgba(240,253,250,.78), rgba(255,255,255,.90));
  box-shadow: 0 16px 48px rgba(34,211,238,.06);
  padding: 22px;
}

.dcHighlightTitle {
  font-size: 22px;
  line-height: 1.15;
  font-weight: 980;
  letter-spacing: -.03em;
}

.dcHighlight p {
  margin: 8px 0 0;
  max-width: 850px;
  font-size: 15px;
  line-height: 1.62;
  color: rgba(15,23,42,.66);
  font-weight: 740;
}

@media(max-width: 980px) {
  .dcGrid {
    grid-template-columns: 1fr;
  }
}

@media(max-width: 900px) {
  .dcPage {
    padding: 42px 0 34px;
  }

  .dcTitle {
    font-size: 40px;
  }

  .dcHero {
    padding: 28px;
  }
}

@media(max-width: 560px) {
  .dcWrap {
    width: 100%;
    padding: 0 16px;
  }

  .dcHero {
    padding: 22px;
    border-radius: 22px;
  }

  .dcTitle {
    font-size: 33px;
  }

  .dcLede {
    font-size: 16px;
  }

  .dcFormGrid {
    grid-template-columns: 1fr;
  }

  .dcPanelTitle {
    font-size: 20px;
  }

  .dcPad {
    padding: 18px;
  }

  .dcMetaPill {
    width: 100%;
    text-align: center;
    justify-content: center;
  }

  .dcBtn {
    width: 100%;
  }
}
`;