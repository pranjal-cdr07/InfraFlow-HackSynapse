import DashboardLayout from "../components/DashboardLayout";

function LaborWages() {
  const payments = [
    {
      period: "12–30 Aug · Structural works",
      amount: "₹1,52,720",
      received: "Today, 11:42",
      transaction: "0x7a92…c18f",
    },
    {
      period: "01–11 Aug · Structural works",
      amount: "₹1,46,080",
      received: "12 Aug, 16:03",
      transaction: "0x38d1…a0b6",
    },
    {
      period: "15–31 Jul · Groundworks",
      amount: "₹1,75,960",
      received: "01 Aug, 12:17",
      transaction: "0xe291…7f30",
    },
  ];

  return (
    <DashboardLayout title="Direct Wages">
      <section className="wage-summary">
        <p className="section-label">DIRECT-TO-WALLET PAYMENTS</p>
        <h2>₹15,32,180</h2>
        <p>Total wages received directly from verified milestone payments.</p>
        <span>Wallet verified · Demo Mode</span>
      </section>

      <section className="dashboard-card tender-directory">
        <p className="section-label">WAGE DISBURSAL LEDGER</p>
        <h2>Payment history</h2>

        <table>
          <thead>
            <tr>
              <th>Work period</th>
              <th>Payment</th>
              <th>Received</th>
              <th>Transaction</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => (
              <tr key={payment.transaction}>
                <td>{payment.period}</td>
                <td className="payment-amount">+{payment.amount}</td>
                <td>{payment.received}</td>
                <td>{payment.transaction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="dashboard-card">
        <p className="section-label">CURRENT STATUS</p>
        <h2>Next expected wage payment</h2>

        <div className="activity-item">
          <span className="activity-dot pending"></span>
          <div>
            <strong>Structural frame — Level 04</strong>
            <p>
              Awaiting contractor verification before the next payment can be
              released.
            </p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default LaborWages;