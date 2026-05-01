export default function BillingPolicyPage() {
  return (
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="wrap">
        <section className="hero">
          <div className="kicker">
            <span className="kickerDot" /> Billing Policy
          </div>

          <h1>
            Simple billing terms for{" "}
            <span className="gradText">DropClarity.</span>
          </h1>

          <p className="lede">
            This policy explains how DropClarity subscriptions, renewals,
            cancellations, refunds, failed payments, and plan changes work.
          </p>
        </section>

        <section className="content">
          <div className="notice">
            This page should match your actual Stripe checkout, pricing, refund,
            and cancellation settings before going live.
          </div>

          <div className="block">
            <h2>Subscription Plans</h2>
            <p>
              DropClarity offers paid subscription plans that may include
              different usage limits, dashboards, exports, alerts, priority
              features, and support levels. Current plan details are shown on
              the Pricing page, checkout page, or billing portal.
            </p>
          </div>

          <div className="block">
            <h2>Billing Cycle</h2>
            <p>
              Subscriptions are billed on a recurring monthly basis unless
              otherwise stated at checkout. Your payment method will be charged
              automatically at the start of each billing cycle.
            </p>
          </div>

          <div className="block">
            <h2>Payment Processing</h2>
            <p>
              Payments are processed by our payment provider. DropClarity does
              not store full payment card numbers. You are responsible for
              keeping your payment method current and ensuring your billing
              information is accurate.
            </p>
          </div>

          <div className="block">
            <h2>Failed Payments</h2>
            <p>
              If a payment fails, access to paid features may be limited,
              suspended, or canceled until payment is successfully completed. We
              may attempt to notify you of failed payments through the account
              email on file.
            </p>
          </div>

          <div className="block">
            <h2>Cancellations</h2>
            <p>
              You may cancel your subscription through your billing portal or by
              contacting info@dropclarity.com. Cancellation stops future
              renewals. Access may continue through the end of the current paid
              billing period unless otherwise stated.
            </p>
          </div>

          <div className="block">
            <h2>Refunds</h2>
            <p>
              Unless required by law or explicitly agreed in writing,
              subscription payments are generally non-refundable. Because
              DropClarity provides access to software, analysis tools, and
              usage-based value during the billing period, partial-month refunds
              are not guaranteed.
            </p>
          </div>

          <div className="block">
            <h2>Plan Changes</h2>
            <p>
              If you upgrade or downgrade your plan, billing may be prorated or
              adjusted depending on payment provider settings and the terms
              shown during checkout or in your billing portal.
            </p>
          </div>

          <div className="block">
            <h2>Trials, Coupons, and Promotions</h2>
            <p>
              DropClarity may offer trials, discounts, coupons, or promotional
              pricing. Promotional terms may change or expire according to the
              offer shown at the time of purchase.
            </p>
          </div>

          <div className="block">
            <h2>Taxes</h2>
            <p>
              Prices may not include applicable taxes unless stated. You are
              responsible for any taxes, duties, or similar charges associated
              with your purchase where applicable.
            </p>
          </div>

          <div className="block">
            <h2>Billing Support</h2>
            <p>
              Billing questions can be sent to info@dropclarity.com.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

const pageCss = `
.dcPage{
  min-height:100vh;
  padding:60px 0 50px;
  background:
    radial-gradient(900px 500px at 0% -10%,rgba(124,58,237,.12),transparent),
    radial-gradient(900px 500px at 100% 0%,rgba(34,211,238,.14),transparent),
    #ffffff;
  font-family:system-ui;
}
.wrap{max-width:1000px;margin:0 auto;padding:0 20px}
.hero{
  padding:40px;
  border-radius:28px;
  background:white;
  border:1px solid rgba(0,0,0,.06);
  box-shadow:0 20px 60px rgba(0,0,0,.06);
}
.kicker{
  font-size:12px;
  font-weight:900;
  text-transform:uppercase;
  color:#0891b2;
}
.kickerDot{
  display:inline-block;
  width:6px;
  height:6px;
  background:#22d3ee;
  border-radius:50%;
  margin-right:6px;
}
h1{
  font-size:44px;
  font-weight:900;
  margin-top:10px;
  letter-spacing:-.04em;
  color:#0f172a;
}
.gradText{
  background:linear-gradient(90deg,#22d3ee,#7c3aed);
  -webkit-background-clip:text;
  color:transparent;
}
.lede{
  margin-top:14px;
  color:#475569;
  font-size:18px;
  line-height:1.6;
}
.content{
  margin-top:30px;
  display:flex;
  flex-direction:column;
  gap:22px;
}
.notice{
  border:1px solid rgba(245,158,11,.22);
  background:rgba(255,251,235,.88);
  color:rgba(120,53,15,.92);
  border-radius:18px;
  padding:14px 16px;
  font-size:14px;
  line-height:1.55;
  font-weight:700;
}
.block{
  background:white;
  border-radius:20px;
  padding:24px;
  border:1px solid rgba(0,0,0,.06);
  box-shadow:0 12px 34px rgba(15,23,42,.04);
}
.block h2{
  font-size:18px;
  font-weight:800;
  color:#0f172a;
}
.block p{
  margin-top:8px;
  color:#475569;
  line-height:1.65;
}
@media(max-width:768px){
  .dcPage{padding:40px 0}
  .hero{padding:26px}
  h1{font-size:32px}
  .lede{font-size:16px}
}
`;