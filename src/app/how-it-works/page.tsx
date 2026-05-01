"use client";
export default function HowItWorks() {
  return (
    <main className="pageWrap">
      <div className="card">
        <h1>How DropClarity Works</h1>

        <div className="step">
          <h2>1. Upload Your Job Files</h2>
          <p>
            Upload invoices, costs, and job reports directly into the platform.
          </p>
        </div>

        <div className="step">
          <h2>2. We Analyze Your Data</h2>
          <p>
            Our system extracts revenue, costs, and profitability using AI.
          </p>
        </div>

        <div className="step">
          <h2>3. Identify Profit Leaks</h2>
          <p>
            Instantly see which jobs are underperforming and why.
          </p>
        </div>

        <div className="step">
          <h2>4. Take Action</h2>
          <p>
            Adjust pricing, reduce costs, and improve margins with clarity.
          </p>
        </div>
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
        .step {
          margin-top: 24px;
        }
      `}</style>
    </main>
  );
}Í