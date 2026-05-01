export default function BillingPolicyPage() {
  const sections = [
    {
      title: "Subscription Plans",
      content: (
        <>
          <p>
            DropClarity offers paid subscription plans that may include different usage limits, dashboards,
            exports, alerts, priority features, and support levels.
          </p>
          <p>
            Current plan details are shown on the Pricing page, checkout page, or billing portal. Plan
            features and limits may change over time.
          </p>
        </>
      ),
    },
    {
      title: "Billing Cycle",
      content: (
        <>
          <p>Subscriptions are billed on a recurring monthly basis unless otherwise stated at checkout.</p>
          <p>
            Your payment method will be charged automatically at the start of each billing cycle until your
            subscription is canceled.
          </p>
        </>
      ),
    },
    {
      title: "Payment Processing",
      content: (
        <>
          <p>
            Payments are processed by our payment provider. DropClarity does not store full payment card
            numbers on its own systems.
          </p>
          <p>
            You are responsible for keeping your payment method current and ensuring your billing
            information is accurate.
          </p>
        </>
      ),
    },
    {
      title: "Failed Payments",
      content: (
        <>
          <p>
            If a payment fails, access to paid features may be limited, suspended, or canceled until payment
            is successfully completed.
          </p>
          <p>We may attempt to notify you of failed payments through the account email address on file.</p>
        </>
      ),
    },
    {
      title: "Cancellations",
      content: (
        <>
          <p>
            You may cancel your subscription through your billing portal or by contacting{" "}
            <strong>info@dropclarity.com</strong>.
          </p>
          <p>
            Cancellation stops future renewals. Access may continue through the end of the current paid
            billing period unless otherwise stated.
          </p>
        </>
      ),
    },
    {
      title: "Refunds",
      content: (
        <>
          <p>
            Unless required by law or explicitly agreed in writing, subscription payments are generally
            non-refundable.
          </p>
          <p>
            Because DropClarity provides access to software, analysis tools, and usage-based value during the
            billing period, partial-month refunds are not guaranteed.
          </p>
        </>
      ),
    },
    {
      title: "Plan Changes",
      content: (
        <>
          <p>
            If you upgrade or downgrade your plan, billing may be prorated or adjusted depending on payment
            provider settings.
          </p>
          <p>Any plan change terms shown during checkout or inside your billing portal will apply to that change.</p>
        </>
      ),
    },
    {
      title: "Trials, Coupons, and Promotions",
      content: (
        <>
          <p>DropClarity may offer trials, discounts, coupons, or promotional pricing from time to time.</p>
          <p>Promotional terms may change or expire according to the offer shown at the time of purchase.</p>
        </>
      ),
    },
    {
      title: "Taxes",
      content: (
        <>
          <p>Prices may not include applicable taxes unless stated during checkout or on the pricing page.</p>
          <p>
            You are responsible for any taxes, duties, or similar charges associated with your purchase where
            applicable.
          </p>
        </>
      ),
    },
    {
      title: "Billing Support",
      content: (
        <p>
          Billing questions, subscription issues, cancellation questions, or payment concerns can be sent to{" "}
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
          <p className="legalEyebrow">Billing Policy</p>
          <h1>Billing Policy</h1>
          <p className="legalUpdated">Last updated: May 1, 2026</p>
          <p className="legalIntro">
            This Billing Policy explains how DropClarity subscriptions, renewals, cancellations, refunds,
            failed payments, plan changes, trials, and billing support work when using the platform.
          </p>
        </section>

        <section className="legalSections" aria-label="Billing Policy sections">
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
  padding: clamp(24px, 3.5vw, 48px) 0 clamp(48px, 6vw, 84px);
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
  padding: clamp(12px, 1.6vw, 20px) 0 clamp(20px, 2.6vw, 30px);
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
  font-size: clamp(28px, 2.45vw, 42px);
  font-weight: 900;
  line-height: 1.04;
  letter-spacing: -0.052em;
}

.legalUpdated {
  margin: 12px 0 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 750;
  line-height: 1.55;
}

.legalIntro {
  max-width: 1180px;
  margin: 20px 0 0;
  color: #334155;
  font-size: clamp(14px, 0.95vw, 15.5px);
  font-weight: 600;
  line-height: 1.75;
}

.legalSections {
  padding: 8px 0 0;
}

.legalSection {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: clamp(18px, 2.2vw, 32px);
  padding: clamp(24px, 2.5vw, 36px) 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
}

.legalSection:last-child {
  border-bottom: 0;
}

.legalNumber {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 23px;
  height: 23px;
  margin-top: 2px;
  border: 1px solid rgba(79, 70, 229, 0.16);
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.075);
  color: #4f46e5;
  font-size: 10.5px;
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
  font-size: clamp(16.5px, 1.2vw, 20px);
  font-weight: 900;
  line-height: 1.22;
  letter-spacing: -0.028em;
}

.legalCopy p {
  max-width: 1160px;
  margin: 9px 0 0;
  color: #334155;
  font-size: clamp(13.5px, 0.92vw, 15px);
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
  margin-top: 6px;
  color: #334155;
  font-size: clamp(13.5px, 0.92vw, 15px);
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
    font-size: clamp(27px, 3.5vw, 38px);
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
    font-size: clamp(24px, 5.6vw, 31px);
  }

  .legalIntro,
  .legalCopy p,
  .legalCopy li {
    font-size: 13.5px;
    line-height: 1.65;
  }

  .legalSection {
    grid-template-columns: 30px minmax(0, 1fr);
    gap: 12px;
    padding: 22px 0;
  }

  .legalNumber {
    width: 21px;
    height: 21px;
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
    font-size: clamp(23px, 6.4vw, 29px);
    letter-spacing: -0.045em;
  }

  .legalUpdated {
    font-size: 11.5px;
  }

  .legalIntro {
    margin-top: 18px;
    font-size: 13.5px;
    line-height: 1.65;
  }

  .legalSection {
    grid-template-columns: 1fr;
    gap: 9px;
    padding: 21px 0;
  }

  .legalCopy h2 {
    font-size: 16.5px;
  }

  .legalCopy p,
  .legalCopy li {
    font-size: 13.25px;
    line-height: 1.64;
  }
}

@media (max-width: 390px) {
  .legalInner {
    width: min(calc(100% - 28px), 360px);
  }

  .legalHero h1 {
    font-size: 23px;
  }

  .legalCopy h2 {
    font-size: 16px;
  }
}
`;
