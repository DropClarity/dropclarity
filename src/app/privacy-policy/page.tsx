"use client";
export default function PrivacyPolicy() {
  return (
    <main className="pageWrap">
      <div className="card">
        <h1>Privacy Policy</h1>

        <h2>Information We Collect</h2>
        <p>
          We collect account details, uploaded job data, and usage data to provide our services.
        </p>

        <h2>How We Use Data</h2>
        <p>
          Data is used to analyze job profitability, improve product performance, and deliver insights.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          We use trusted providers including Stripe, Clerk, Uploadcare, and AI processing services.
        </p>

        <h2>Data Security</h2>
        <p>
          We implement industry-standard measures to protect your data.
        </p>

        <h2>Contact</h2>
        <p>info@dropclarity.com</p>
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