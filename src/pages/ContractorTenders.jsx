import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { tenders } from "../data/tenders";

function ContractorTenders() {
  const [selectedTender, setSelectedTender] = useState(null);
  const [bidSubmitted, setBidSubmitted] = useState(false);

  function submitBid() {
    setBidSubmitted(true);
  }

  return (
    <DashboardLayout title="Tender Discovery & Bids">
      <section className="dashboard-card tender-directory">
        <p className="section-label">AVAILABLE PROJECTS</p>
        <h2>Platform tender directory</h2>

        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Contract value</th>
              <th>Security deposit</th>
              <th>Deadline</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {tenders.map((tender) => (
              <tr key={tender.id}>
                <td>{tender.project}</td>
                <td>{tender.amount}</td>
                <td>{tender.deposit}</td>
                <td>{tender.deadline}</td>
                <td>
                  <button
                    className="table-button"
                    onClick={() => {
                      setSelectedTender(tender);
                      setBidSubmitted(false);
                    }}
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedTender && (
        <section className="dashboard-card bid-panel">
          <p className="section-label">BID SUBMISSION</p>
          <h2>Submit bid for {selectedTender.project}</h2>

          <label>
            Your bid amount
            <input placeholder="Example: ₹4,00,00,000" />
          </label>

          <label>
            Proposal document name
            <input placeholder="Example: Atlas Civil Proposal.pdf" />
          </label>

          <div className="security-box">
            <p>Required bid security deposit</p>
            <h3>{selectedTender.deposit}</h3>
            <span>This is only a frontend demo display.</span>
          </div>

          <button className="primary-button" onClick={submitBid}>
            Deposit security and submit bid
          </button>

          {bidSubmitted && (
            <p className="success-message">
              Bid submitted successfully for {selectedTender.project}.
            </p>
          )}
        </section>
      )}

      <section className="dashboard-card">
        <p className="section-label">MY BID STATUS</p>
        <h2>Active bids and refund status</h2>

        <div className="activity-item">
          <span className="activity-dot pending"></span>
          <div>
            <strong>North Basin Waterworks</strong>
            <p>Bid is under evaluation.</p>
          </div>
        </div>

        <div className="activity-item">
          <span className="activity-dot success"></span>
          <div>
            <strong>Old Harbor Drainage</strong>
            <p>Security deposit refund: ₹4,15,000</p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default ContractorTenders;