import DashboardLayout from "../components/DashboardLayout";

function SubcontractorTreasury() {
  const payouts = [
    {
      milestone: "Foundation and groundworks",
      amount: "₹1.20 Cr",
      date: "12 Aug 2026",
      transaction: "0x7a92…c18f",
    },
    {
      milestone: "Preliminary works",
      amount: "₹74.7 L",
      date: "04 Jul 2026",
      transaction: "0x38d1…a0b6",
    },
  ];

  return (
    <DashboardLayout title="Earnings & Retainage Vault">
      <section className="stats-grid">
        <article className="stat-card">
          <p>Direct payouts received</p>
          <h2>₹1.94 Cr</h2>
        </article>

        <article className="stat-card">
          <p>Locked retainage</p>
          <h2>₹21.58 L</h2>
        </article>

        <article className="stat-card">
          <p>Next milestone payout</p>
          <h2>₹74.7 L</h2>
        </article>
      </section>

      <section className="dashboard-card tender-directory">
        <p className="section-label">DIRECT MILESTONE PAYOUTS</p>
        <h2>Payout tracker</h2>

        <table>
          <thead>
            <tr>
              <th>Milestone</th>
              <th>Received amount</th>
              <th>Date</th>
              <th>Transaction</th>
            </tr>
          </thead>

          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.transaction}>
                <td>{payout.milestone}</td>
                <td className="payment-amount">{payout.amount}</td>
                <td>{payout.date}</td>
                <td>{payout.transaction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="dashboard-card vault-card">
        <p className="section-label">10% RETAINAGE VAULT</p>
        <h2>Locked retainage savings</h2>

        <div className="vault-balance">₹21.58 L</div>

        <p>
          This represents the retained project amount that will be released
          after final project acceptance.
        </p>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: "68%" }}></div>
        </div>

        <p className="vault-progress">Project completion: 68%</p>
      </section>
    </DashboardLayout>
  );
}

export default SubcontractorTreasury;