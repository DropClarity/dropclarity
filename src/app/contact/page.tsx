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

      <div className="wrap">
        <section className="hero">
          <div className="kicker">
            <span className="kickerDot" /> Contact DropClarity
          </div>

          <h1>
            Get help finding the jobs{" "}
            <span className="gradText">quietly draining profit.</span>
          </h1>

          <p className="lede">
            Have a question about uploads, dashboard results, pricing, billing,
            or whether DropClarity fits your business? Send us a note and we’ll
            help you understand the best next step.
          </p>

          <div className="heroMeta">
            <span className="metaPill">Product questions</span>
            <span className="metaPill">Demo requests</span>
            <span className="metaPill">Upload support</span>
            <span className="metaPill">Billing help</span>
          </div>
        </section>

        <section className="grid">
          <div className="panel">
            <div className="panelHead">
              <div>
                <div className="panelTitle">Send a message</div>
                <div className="panelSub">
                  This opens your email app with a prepared message to
                  info@dropclarity.com.
                </div>
              </div>
            </div>

            <div className="pad">
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

              <div className="btnRow">
                <a className="btn btnPrimary" href={mailtoHref}>
                  Send message
                </a>
                <a className="btn" href="mailto:info@dropclarity.com">
                  Email directly
                </a>
              </div>

              <div className="footerNote">
                If the button does not open your email app, email us directly at{" "}
                <strong>info@dropclarity.com</strong>.
              </div>
            </div>
          </div>

          <aside className="panel">
            <div className="panelHead">
              <div>
                <div className="panelTitle">What we can help with</div>
                <div className="panelSub">
                  DropClarity is built for operators who want fast visibility
                  into job profitability.
                </div>
              </div>
            </div>

            <div className="pad cardList">
              <div className="infoCard">
                <div className="iconBubble">01</div>
                <div>
                  <div className="infoCardTitle">Demo requests</div>
                  <div className="infoCardText">
                    See how uploaded job files turn into revenue, costs, margin,
                    profit, and high-risk job visibility.
                  </div>
                </div>
              </div>

              <div className="infoCard">
                <div className="iconBubble">02</div>
                <div>
                  <div className="infoCardTitle">Upload support</div>
                  <div className="infoCardText">
                    Need help with file formats, dashboard results, or job
                    mapping? Send the details.
                  </div>
                </div>
              </div>

              <div className="infoCard">
                <div className="iconBubble">03</div>
                <div>
                  <div className="infoCardTitle">Billing questions</div>
                  <div className="infoCardText">
                    Ask about Core, Scale, subscription status, cancellation, or
                    whether DropClarity fits your workflow.
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="highlight">
          <div className="highlightTitle">Before you reach out</div>
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
*{box-sizing:border-box}
html,body{background:#fff!important;color:#0f172a!important}
.dcPage{
  width:100%;
  min-height:100vh;
  padding:58px 0 48px;
  background:
    radial-gradient(1100px 520px at 10% -10%,rgba(124,58,237,.13),transparent 58%),
    radial-gradient(900px 520px at 92% 0%,rgba(34,211,238,.14),transparent 62%),
    radial-gradient(820px 520px at 50% 110%,rgba(52,211,153,.08),transparent 70%),
    linear-gradient(180deg,#fff,#fff);
  font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;
}
.wrap{width:min(1180px,calc(100vw - 32px));margin:0 auto}
.hero{
  border-radius:30px;
  border:1px solid rgba(15,23,42,.065);
  background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(248,250,252,.84));
  box-shadow:0 22px 70px rgba(2,6,23,.09);
  padding:36px;
  overflow:hidden;
}
.kicker{
  width:fit-content;
  display:inline-flex;
  align-items:center;
  gap:8px;
  border:1px solid rgba(34,211,238,.28);
  background:rgba(255,255,255,.88);
  box-shadow:0 10px 28px rgba(34,211,238,.10);
  border-radius:999px;
  padding:7px 12px;
  font-size:12px;
  font-weight:950;
  color:rgba(8,145,178,.95);
  text-transform:uppercase;
  letter-spacing:.06em;
}
.kickerDot{
  width:7px;
  height:7px;
  border-radius:999px;
  background:linear-gradient(135deg,#22D3EE,#7C3AED);
  box-shadow:0 0 0 4px rgba(34,211,238,.12);
}
h1{
  margin:16px 0 0;
  max-width:940px;
  font-size:52px;
  line-height:1.02;
  font-weight:990;
  letter-spacing:-.055em;
  color:rgba(2,6,23,.96);
}
.gradText{
  background:linear-gradient(90deg,#06b6d4,#8b5cf6,#2563eb);
  -webkit-background-clip:text;
  background-clip:text;
  color:transparent;
}
.lede{
  margin:15px 0 0;
  max-width:880px;
  color:rgba(51,65,85,.82);
  font-size:18px;
  line-height:1.6;
  font-weight:760;
}
.heroMeta{margin-top:18px;display:flex;flex-wrap:wrap;gap:9px}
.metaPill{
  border:1px solid rgba(15,23,42,.065);
  background:rgba(255,255,255,.84);
  border-radius:999px;
  padding:8px 11px;
  color:rgba(15,23,42,.62);
  font-size:12.5px;
  font-weight:900;
}
.grid{
  display:grid;
  grid-template-columns:minmax(0,1.06fr) minmax(330px,.94fr);
  gap:18px;
  margin-top:18px;
}
.panel{
  border-radius:26px;
  border:1px solid rgba(15,23,42,.065);
  background:rgba(255,255,255,.86);
  backdrop-filter:blur(14px);
  box-shadow:0 18px 54px rgba(2,6,23,.075);
  overflow:hidden;
}
.panelHead{
  padding:20px 22px 16px;
  border-bottom:1px solid rgba(15,23,42,.065);
  background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.82));
}
.panelTitle{
  font-size:22px;
  line-height:1.15;
  letter-spacing:-.03em;
  font-weight:980;
  color:rgba(15,23,42,.94);
}
.panelSub{
  margin-top:7px;
  color:rgba(15,23,42,.64);
  font-size:14.5px;
  line-height:1.5;
  font-weight:760;
}
.pad{padding:22px}
.formGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.field{display:flex;flex-direction:column;gap:7px}
.fieldFull{grid-column:1/-1}
label{
  font-size:12px;
  font-weight:950;
  text-transform:uppercase;
  letter-spacing:.07em;
  color:rgba(15,23,42,.52);
}
input,textarea,select{
  width:100%;
  border:1px solid rgba(15,23,42,.10);
  background:#fff;
  border-radius:15px;
  padding:13px 14px;
  font-size:14px;
  font-weight:780;
  color:#0f172a;
  outline:none;
}
textarea{min-height:150px;resize:vertical;line-height:1.5}
input:focus,textarea:focus,select:focus{
  border-color:#22d3ee;
  box-shadow:0 0 0 3px rgba(34,211,238,.18);
}
.btnRow{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  border-radius:14px;
  border:1px solid rgba(15,23,42,.10);
  background:rgba(255,255,255,.88);
  color:rgba(15,23,42,.90);
  padding:12px 15px;
  text-decoration:none;
  font-size:13.5px;
  font-weight:920;
}
.btnPrimary{
  background:linear-gradient(90deg,rgba(34,211,238,.20),rgba(124,58,237,.18));
  border-color:rgba(34,211,238,.25);
}
.footerNote{
  margin-top:18px;
  font-size:13px;
  line-height:1.55;
  color:rgba(15,23,42,.52);
  font-weight:760;
}
.cardList{display:flex;flex-direction:column;gap:12px}
.infoCard{
  display:flex;
  gap:12px;
  border:1px solid rgba(15,23,42,.065);
  background:rgba(255,255,255,.84);
  border-radius:18px;
  padding:16px;
}
.iconBubble{
  width:34px;
  height:34px;
  border-radius:13px;
  flex:0 0 auto;
  display:flex;
  align-items:center;
  justify-content:center;
  background:linear-gradient(135deg,rgba(34,211,238,.18),rgba(124,58,237,.14));
  border:1px solid rgba(34,211,238,.16);
  font-weight:990;
}
.infoCardTitle{font-size:15.5px;line-height:1.25;font-weight:950;color:rgba(15,23,42,.94)}
.infoCardText{margin-top:6px;font-size:14px;line-height:1.58;color:rgba(15,23,42,.64);font-weight:730}
.highlight{
  margin-top:18px;
  border-radius:24px;
  border:1px solid rgba(34,211,238,.16);
  background:linear-gradient(135deg,rgba(240,253,250,.78),rgba(255,255,255,.90));
  box-shadow:0 16px 48px rgba(34,211,238,.06);
  padding:22px;
}
.highlightTitle{font-size:22px;line-height:1.15;font-weight:980;letter-spacing:-.03em}
.highlight p{margin-top:8px;max-width:850px;font-size:15px;line-height:1.62;color:rgba(15,23,42,.66);font-weight:740}
@media(max-width:980px){.grid{grid-template-columns:1fr}}
@media(max-width:900px){.dcPage{padding:42px 0 34px}h1{font-size:40px}.hero{padding:28px}}
@media(max-width:560px){
  .wrap{width:100%;padding:0 16px}
  .hero{padding:22px;border-radius:22px}
  h1{font-size:33px}
  .lede{font-size:16px}
  .formGrid{grid-template-columns:1fr}
  .panelTitle{font-size:20px}
  .pad{padding:18px}
  .metaPill{width:100%;justify-content:center}
}
`;