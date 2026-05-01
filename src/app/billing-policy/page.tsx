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

        <section className="legalDocument" aria-label="Billing Policy sections">
          <article className="legalSection">
            <div className="sectionNumber">1</div>
            <div className="sectionCopy">
              <h2>Subscription Plans</h2>
              <p>
                DropClarity offers paid subscription plans that may include different
                usage limits, dashboards, exports, alerts, priority features, and
                support levels.
              </p>
              <p>
                Current plan details are shown on the Pricing page, checkout page,
                or billing portal. Plan features and limits may change over time.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">2</div>
            <div className="sectionCopy">
              <h2>Billing Cycle</h2>
              <p>
                Subscriptions are billed on a recurring monthly basis unless otherwise
                stated at checkout.
              </p>
              <p>
                Your payment method will be charged automatically at the start of
                each billing cycle until your subscription is canceled.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">3</div>
            <div className="sectionCopy">
              <h2>Payment Processing</h2>
              <p>
                Payments are processed by our payment provider. DropClarity does not
                store full payment card numbers on its own systems.
              </p>
              <p>
                You are responsible for keeping your payment method current and
                ensuring your billing information is accurate.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">4</div>
            <div className="sectionCopy">
              <h2>Failed Payments</h2>
              <p>
                If a payment fails, access to paid features may be limited, suspended,
                or canceled until payment is successfully completed.
              </p>
              <p>
                We may attempt to notify you of failed payments through the account
                email address on file.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">5</div>
            <div className="sectionCopy">
              <h2>Cancellations</h2>
              <p>
                You may cancel your subscription through your billing portal or by
                contacting <strong>info@dropclarity.com</strong>.
              </p>
              <p>
                Cancellation stops future renewals. Access may continue through the
                end of the current paid billing period unless otherwise stated.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">6</div>
            <div className="sectionCopy">
              <h2>Refunds</h2>
              <p>
                Unless required by law or explicitly agreed in writing, subscription
                payments are generally non-refundable.
              </p>
              <p>
                Because DropClarity provides access to software, analysis tools, and
                usage-based value during the billing period, partial-month refunds
                are not guaranteed.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">7</div>
            <div className="sectionCopy">
              <h2>Plan Changes</h2>
              <p>
                If you upgrade or downgrade your plan, billing may be prorated or
                adjusted depending on payment provider settings.
              </p>
              <p>
                Any plan change terms shown during checkout or inside your billing
                portal will apply to that change.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">8</div>
            <div className="sectionCopy">
              <h2>Trials, Coupons, and Promotions</h2>
              <p>
                DropClarity may offer trials, discounts, coupons, or promotional
                pricing from time to time.
              </p>
              <p>
                Promotional terms may change or expire according to the offer shown
                at the time of purchase.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">9</div>
            <div className="sectionCopy">
              <h2>Taxes</h2>
              <p>
                Prices may not include applicable taxes unless stated during checkout
                or on the pricing page.
              </p>
              <p>
                You are responsible for any taxes, duties, or similar charges
                associated with your purchase where applicable.
              </p>
            </div>
          </article>

          <article className="legalSection">
            <div className="sectionNumber">10</div>
            <div className="sectionCopy">
              <h2>Billing Support</h2>
              <p>
                Billing questions, subscription issues, cancellation questions, or
                payment concerns can be sent to <strong>info@dropclarity.com</strong>.
              </p>
            </div>
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
  width: min(100% - 56px, 1180px);
  margin: 0 auto;
}

.legalHero {
  max-width: 980px;
  padding: 16px 0 24px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.12);
}

.legalEyebrow {
  margin: 0 0 10px;
  color: #4f46e5;
  font-size: 11px;
  font-weight: 850;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.legalHero h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(32px, 3.2vw, 46px);
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
  max-width: 940px;
  margin: 17px 0 0;
  color: #475569;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.72;
}

.legalDocument {
  width: min(100%, 1040px);
  padding: 8px 0 0;
}

.legalSection {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 24px;
  padding: 30px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.12);
}

.legalSection:last-child {
  border-bottom: 0;
}

.sectionNumber {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.1);
  color: #4f46e5;
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
}

.sectionCopy {
  max-width: 900px;
}

.sectionCopy h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.25;
  letter-spacing: -0.028em;
}

.sectionCopy p {
  margin: 10px 0 0;
  color: #475569;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.72;
}

.sectionCopy strong {
  color: #0f172a;
  font-weight: 850;
}

@media (max-width: 820px) {
  .dcPage {
    padding: 30px 0 52px;
  }

  .legalInner {
    width: min(100% - 32px, 1180px);
  }

  .legalHero {
    padding: 14px 0 20px;
  }

  .legalIntro {
    font-size: 15.5px;
  }

  .legalSection {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 16px;
    padding: 24px 0;
  }

  .sectionCopy h2 {
    font-size: 18.5px;
  }

  .sectionCopy p {
    font-size: 15.5px;
  }
}

@media (max-width: 520px) {
  .legalInner {
    width: min(100% - 28px, 1180px);
  }

  .legalHero h1 {
    font-size: 32px;
    letter-spacing: -0.045em;
  }

  .legalSection {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 24px 0;
  }

  .sectionNumber {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .sectionCopy h2 {
    font-size: 18px;
  }

  .sectionCopy p {
    font-size: 15px;
  }
}
`;
