"use client";
export default function Billing() {
  return (
    <main className="pageWrap">
      <div className="card">
        <h1>Billing Policy</h1>

        <h2>Subscriptions</h2>
        <p>
          DropClarity operates on a monthly subscription basis.
        </p>

        <h2>Cancellation</h2>
        <p>
          You may cancel at any time. Access remains until the end of the billing cycle.
        </p>

        <h2>Refunds</h2>
        <p>
          All payments are non-refundable unless required by law.
        </p>

        <h2>Billing Issues</h2>
        <p>
          Contact us at info@dropclarity.com for any billing concerns.
        </p>
      </div>

      <style jsx>{`
        .pageWrap {
          min-height: 100vh;
          padding: 100px 20px;
          display: flex;
          justify-content: center;
        }
        .card {
          max-width: 800px;
        }
      `}</style>
    </main>
  );
}