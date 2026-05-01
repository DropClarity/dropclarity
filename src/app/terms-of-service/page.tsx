export default function Terms() {
  return (
    <main className="pageWrap">
      <div className="card">
        <h1>Terms of Service</h1>

        <h2>Use of Platform</h2>
        <p>
          DropClarity provides job profitability analysis based on uploaded data.
        </p>

        <h2>No Professional Advice</h2>
        <p>
          All outputs are informational only. We do not provide financial, accounting, or legal advice.
        </p>

        <h2>User Responsibility</h2>
        <p>
          You are responsible for verifying results and making business decisions.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          DropClarity is not liable for any business decisions or outcomes resulting from use of the platform.
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