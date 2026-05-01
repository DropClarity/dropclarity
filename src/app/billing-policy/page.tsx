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
