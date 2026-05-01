export default function BillingPolicyPage() {
  return (
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="legalInner">
        <section className="legalHero">
          <p className="legalEyebrow">Billing Policy</p>
          <h1>Billing Policy</h1>
          <p className="legalUpdated">Last updated: May 1, 2026</p>
          <p className="legalIntro">
            This Billing Policy explains how DropClarity subscriptions, renewals,
            cancellations, refunds, failed payments, plan changes, trials, and
            billing support work when using the platform.
          </p>
        </section>

        <section className="legalGrid" aria-label="Billing Policy sections">
          <article className="legalCard">
            <h2>1. Subscription Plans</h2>
            <p>
              DropClarity offers paid subscription plans that may include different
              usage limits, dashboards, exports, alerts, priority features, and
              support levels.
            </p>
            <p>
              Current plan details are shown on the Pricing page, checkout page,
              or billing portal. Plan features and limits may change over time.
            </p>
          </article>

          <article className="legalCard">
            <h2>2. Billing Cycle</h2>
            <p>
              Subscriptions are billed on a recurring monthly basis unless otherwise
              stated at checkout.
            </p>
            <p>
              Your payment method will be charged automatically at the start of
              each billing cycle until your subscription is canceled.
            </p>
          </article>

          <article className="legalCard">
            <h2>3. Payment Processing</h2>
            <p>
              Payments are processed by our payment provider. DropClarity does not
              store full payment card numbers on its own systems.
            </p>
            <p>
              You are responsible for keeping your payment method current and
              ensuring your billing information is accurate.
            </p>
          </article>

          <article className="legalCard">
            <h2>4. Failed Payments</h2>
            <p>
              If a payment fails, access to paid features may be limited, suspended,
              or canceled until payment is successfully completed.
            </p>
            <p>
              We may attempt to notify you of failed payments through the account
              email address on file.
            </p>
          </article>

          <article className="legalCard">
            <h2>5. Cancellations</h2>
            <p>
              You may cancel your subscription through your billing portal or by
              contacting <strong>info@dropclarity.com</strong>.
            </p>
            <p>
              Cancellation stops future renewals. Access may continue through the
              end of the current paid billing period unless otherwise stated.
            </p>
          </article>

          <article className="legalCard">
            <h2>6. Refunds</h2>
            <p>
              Unless required by law or explicitly agreed in writing, subscription
              payments are generally non-refundable.
            </p>
            <p>
              Because DropClarity provides access to software, analysis tools, and
              usage-based value during the billing period, partial-month refunds
              are not guaranteed.
            </p>
          </article>

          <article className="legalCard">
            <h2>7. Plan Changes</h2>
            <p>
              If you upgrade or downgrade your plan, billing may be prorated or
              adjusted depending on payment provider settings.
            </p>
            <p>
              Any plan change terms shown during checkout or inside your billing
              portal will apply to that change.
            </p>
          </article>

          <article className="legalCard">
            <h2>8. Trials, Coupons, and Promotions</h2>
            <p>
              DropClarity may offer trials, discounts, coupons, or promotional
              pricing from time to time.
            </p>
            <p>
              Promotional terms may change or expire according to the offer shown
              at the time of purchase.
            </p>
          </article>

          <article className="legalCard">
            <h2>9. Taxes</h2>
            <p>
              Prices may not include applicable taxes unless stated during checkout
              or on the pricing page.
            </p>
            <p>
              You are responsible for any taxes, duties, or similar charges
              associated with your purchase where applicable.
            </p>
          </article>

          <article className="legalCard legalCardWide">
            <h2>10. Billing Support</h2>
            <p>
              Billing questions, subscription issues, cancellation questions, or
              payment concerns can be sent to <strong>info@dropclarity.com</strong>.
            </p>
          </article>
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
  padding: 46px 0 72px;
  background:
    radial-gradient(1000px 520px at 0% -10%, rgba(124, 58, 237, 0.08), transparent 64%),
    radial-gradient(1000px 520px at 100% 0%, rgba(34, 211, 238, 0.1), transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: #0f172a;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  overflow-x: hidden;
}

.legalInner {
  width: min(100% - 56px, 1440px);
  margin: 0 auto;
}

.legalHero {
  max-width: 1120px;
  padding: 28px 0 26px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.1);
}

.legalEyebrow {
  margin: 0 0 12px;
  color: #4f46e5;
  font-size: 12px;
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.legalHero h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(34px, 4vw, 52px);
  font-weight: 900;
  line-height: 1.02;
  letter-spacing: -0.055em;
}

.legalUpdated {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.6;
}

.legalIntro {
  max-width: 980px;
  margin: 18px 0 0;
  color: #475569;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.72;
}

.legalGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  padding: 30px 0 0;
}

.legalCard {
  min-height: 100%;
  padding: 26px;
  border: 1px solid rgba(15, 23, 42, 0.09);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 44px rgba(15, 23, 42, 0.055);
}

.legalCardWide {
  grid-column: span 2;
}

.legalCard h2 {
  margin: 0;
  color: #0f172a;
  font-size: 19px;
  font-weight: 900;
  line-height: 1.25;
  letter-spacing: -0.025em;
}

.legalCard p {
  margin: 10px 0 0;
  color: #475569;
  font-size: 15.5px;
  font-weight: 600;
  line-height: 1.7;
}

.legalCard strong {
  color: #0f172a;
  font-weight: 850;
}

@media (max-width: 1180px) {
  .legalInner {
    width: min(100% - 44px, 1120px);
  }

  .legalGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .legalCardWide {
    grid-column: 1 / -1;
  }
}

@media (max-width: 820px) {
  .dcPage {
    padding: 40px 0 52px;
  }

  .legalInner {
    width: min(100% - 32px, 1120px);
  }

  .legalHero {
    padding: 24px 0 20px;
  }

  .legalIntro {
    font-size: 16px;
  }

  .legalGrid {
    grid-template-columns: 1fr;
    gap: 14px;
    padding-top: 22px;
  }

  .legalCard {
    padding: 20px;
    border-radius: 20px;
  }
}

@media (max-width: 520px) {
  .legalInner {
    width: min(100% - 28px, 1120px);
  }

  .legalHero h1 {
    font-size: 34px;
    letter-spacing: -0.045em;
  }

  .legalCard h2 {
    font-size: 18px;
  }

  .legalCard p {
    font-size: 15px;
  }
}
`;
