import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

function ContractorPayroll() {
  const [rulesLocked, setRulesLocked] = useState(false);

  const subcontractors = [
    {
      name: "Forge MEP",
      scope: "Electrical and mechanical",
      wallet: "0x21b…7F02",
    },
    {
      name: "Apex Concrete",
      scope: "Structural concrete",
      wallet: "0x94a…3D80",
    },
    {
      name: "Terra Civils",
      scope: "Earthworks",
      wallet: "0x8C1…5BbE",
    },
  ];

  return (
    <DashboardLayout title="Payroll & Trade Setup">
      <section className="dashboard-card">
        <p className="section-label">STEP 08 · PAYMENT ROUTING</p>
        <h2>Subcontractor payroll rule engine</h2>

        <div className="payment-flow">
          <article>
            <p>Milestone settlement</p>
            <h3>₹83,00,000</h3>
          </article>

          <span>→</span>

          <article>
            <p>Direct payout</p>
            <h3>90% · ₹74,70,000</h3>
          </article>

          <span>+</span>

          <article>
            <p>Retainage vault</p>
            <h3>10% · ₹8,30,000</h3>
          </article>
        </div>

        <label>
          Direct payout percentage
          <input defaultValue="90%" />
        </label>

        <label>
          Retainage percentage
          <input defaultValue="10%" />
        </label>

        <button
          className="primary-button"
          onClick={() => setRulesLocked(true)}
        >
          Lock payroll rules
        </button>

        {rulesLocked && (
          <p className="success-message">
            Payroll rules have been locked in this frontend demo.
          </p>
        )}
      </section>

      <section className="dashboard-card tender-directory">
        <p className="section-label">ONBOARDED SUBCONTRACTORS</p>
        <h2>Assigned trade roster</h2>

        <table>
          <thead>
            <tr>
              <th>Subcontractor</th>
              <th>Trade scope</th>
              <th>Routing wallet</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {subcontractors.map((subcontractor) => (
              <tr key={subcontractor.name}>
                <td>{subcontractor.name}</td>
                <td>{subcontractor.scope}</td>
                <td>{subcontractor.wallet}</td>
                <td>
                  <span className="status open">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  );
}

export default ContractorPayroll;