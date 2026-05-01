export default function BillingPolicyPage() {
  return (
    <main className="dcPage">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      <div className="billingWrap">
        <section className="billingHero">
          <div className="billingKicker">
            <span className="billingKickerDot" /> Billing Policy
          </div>

          <h1 className="billingTitle">
            Simple billing terms for{" "}
            <span className="billingGradText">DropClarity.</span>
          </h1>

          <p className="billingLede">
            This policy explains how DropClarity subscriptions, renewals,
            cancellations, refunds, failed payments, and plan changes work.
          </p>
        </section>

        <section className="billingContent">
          <div className="billingNotice">
            This page should match your actual Stripe checkout, pricing, refund,
            and cancellation settings before going live.
          </div>

          {sections.map((section) => (
            <div className="billingBlock" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

const sections = [
  {
    title: "Subscription Plans",
    text:
      "DropClarity offers paid subscription plans that may include different usage limits, dashboards, exports, alerts, priority features, and support levels. Current plan details are shown on the Pricing page, checkout page, or billing portal.",
  },
  {
    title: "Billing Cycle",
    text:
      "Subscriptions are billed on a recurring monthly basis unless otherwise stated at checkout. Your payment method will be charged automatically at the start of each billing cycle.",
  },
  {
    title: "Payment Processing",
    text:
      "Payments are processed by our payment provider. DropClarity does not store full payment card numbers. You are responsible for keeping your payment method current and ensuring your billing information is accurate.",
  },
  {
    title: "Failed Payments",
    text:
      "If a payment fails, access to paid features may be limited, suspended, or canceled until payment is successfully completed. We may attempt to notify you of failed payments through the account email on file.",
  },
  {
    title: "Cancellations",
    text:
      "You may cancel your subscription through your billing portal or by contacting info@dropclarity.com. Cancellation stops future renewals. Access may continue through the end of the current paid billing period unless otherwise stated.",
  },
  {
    title: "Refunds",
    text:
      "Unless required by law or explicitly agreed in writing, subscription payments are generally non-refundable. Because DropClarity provides access to software, analysis tools, and usage-based value during the billing period, partial-month refunds are not guaranteed.",
  },
  {
    title: "Plan Changes",
    text:
      "If you upgrade or downgrade your plan, billing may be prorated or adjusted depending on payment provider settings and the terms shown during checkout or in your billing portal.",
  },
  {
    title: "Trials, Coupons, and Promotions",
    text:
      "DropClarity may offer trials, discounts, coupons, or promotional pricing. Promotional terms may change or expire according to the offer shown at the time of purchase.",
  },
  {
    title: "Taxes",
    text:
      "Prices may not include applicable taxes unless stated. You are responsible for any taxes, duties, or similar charges associated with your purchase where applicable.",
  },
  {
    title: "Billing Support",
    text: "Billing questions can be sent to info@dropclarity.com.",
  },
];

const pageCss = `
.dcPage,
.dcPage * {
  box-sizing: border-box;
}

.dcPage {
  min-height: 100vh;
  padding: 72px 0 64px;
  background:
    radial-gradient(900px 500px at 0% -10%, rgba(124,58,237,.12), transparent 65%),
    radial-gradient(900px 500px at 100% 0%, rgba(34,211,238,.16), transparent 62%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #0f172a;
  overflow-x: hidden;
}

.billingWrap {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.billingHero {
  padding: 44px;
  border-radius: 30px;
  background: rgba(255,255,255,.96);
  border: 1px solid rgba(15,23,42,.08);
  box-shadow: 0 24px 70px rgba(15,23,42,.09);
}

.billingKicker {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #0891b2;
}

.billingKickerDot {
  width: 7px;
  height: 7px;
  background: #22d3ee;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(34,211,238,.14);
}

.billingTitle {
  max-width: 900px;
  font-size: 48px;
  line-height: 1.04;
  font-weight: 950;
  letter-spacing: -.05em;
  margin: 20px 0 0;
  color: #0f172a;
}

.billingGradText {
  background: linear-gradient(90deg, #06b6d4, #6366f1, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.billingLede {
  max-width: 900px;
  margin: 18px 0 0;
  color: #475569;
  font-size: 18px;
  line-height: 1.65;
  font-weight: 650;
}

.billingContent {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.billingNotice {
  border: 1px solid rgba(245,158,11,.22);
  background: rgba(255,251,235,.92);
  color: rgba(120,53,15,.95);
  border-radius: 18px;
  padding: 15px 16px;
  font-size: 14px;
  line-height: 1.55;
  font-weight: 750;
}

.billingBlock {
  background: rgba(255,255,255,.96);
  border-radius: 22px;
  padding: 24px;
  border: 1px solid rgba(15,23,42,.08);
  box-shadow: 0 14px 38px rgba(15,23,42,.055);
}

.billingBlock h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 900;
  letter-spacing: -.02em;
}

.billingBlock p {
  margin: 9px 0 0;
  color: #475569;
  font-size: 15.5px;
  line-height: 1.65;
  font-weight: 650;
}

@media(max-width: 768px) {
  .dcPage {
    padding: 44px 0;
  }

  .billingHero {
    padding: 28px;
    border-radius: 24px;
  }

  .billingTitle {
    font-size: 36px;
  }

  .billingLede {
    font-size: 16px;
  }
}

@media(max-width: 480px) {
  .billingWrap {
    padding: 0 16px;
  }

  .billingHero {
    padding: 24px;
  }

  .billingTitle {
    font-size: 32px;
  }

  .billingBlock {
    padding: 20px;
  }
}
`;