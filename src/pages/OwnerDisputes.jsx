import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

function OwnerDisputes() {
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [message, setMessage] = useState("");

  const disputes = [
    {
      id: "D-109",
      title: "Delayed payment claim",
      raisedBy: "Subcontractor",
      amount: "₹35,52,400",
      priority: "High",
    },
    {
      id: "D-107",
      title: "Unsafe site access corridor",
      raisedBy: "Public Site Inspector",
      amount: "No payment involved",
      priority: "Medium",
    },
    {
      id: "D-101",
      title: "Wage allocation query",
      raisedBy: "Laborer",
      amount: "14 workers affected",
      priority: "High",
    },
  ];

  function resolveDispute() {
    setMessage(`${selectedDispute.id} marked as resolved in this demo.`);
    setSelectedDispute(null);
  }

  return (
    <DashboardLayout title="Dispute Resolution & Audit Trail">
      <section className="dashboard-card tender-directory">
        <p className="section-label">ESCALATED DISPUTES</p>
        <h2>Incoming dispute queue</h2>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Issue</th>
              <th>Raised by</th>
              <th>Amount / Impact</th>
              <th>Priority</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {disputes.map((dispute) => (
              <tr key={dispute.id}>
                <td>{dispute.id}</td>
                <td>{dispute.title}</td>
                <td>{dispute.raisedBy}</td>
                <td>{dispute.amount}</td>
                <td>
                  <span className={`priority ${dispute.priority.toLowerCase()}`}>
                    {dispute.priority}
                  </span>
                </td>
                <td>
                  <button
                    className="table-button"
                    onClick={() => setSelectedDispute(dispute)}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedDispute && (
        <section className="dashboard-card selected-tender">
          <p className="section-label">DISPUTE DETAILS</p>
          <h2>{selectedDispute.title}</h2>

          <p>
            <strong>Case ID:</strong> {selectedDispute.id}
          </p>

          <p>
            <strong>Raised by:</strong> {selectedDispute.raisedBy}
          </p>

          <p>
            <strong>Impact:</strong> {selectedDispute.amount}
          </p>

          <button className="primary-button" onClick={resolveDispute}>
            Resolve dispute
          </button>
        </section>
      )}

      {message && <p className="success-message">{message}</p>}

      <section className="dashboard-card">
        <p className="section-label">BLOCKCHAIN AUDIT LOG</p>
        <h2>Recent platform activity</h2>

        <div className="activity-item">
          <span className="activity-dot success"></span>
          <div>
            <strong>Tender published — Eastline Transit Hub</strong>
            <p>Transaction: 0x7a92…c18f</p>
          </div>
        </div>

        <div className="activity-item">
          <span className="activity-dot success"></span>
          <div>
            <strong>Bid security deposit refunded</strong>
            <p>Transaction: 0x38d1…a0b6</p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default OwnerDisputes;