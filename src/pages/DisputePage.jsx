import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

function DisputePage({ role, target }) {
  const [submitted, setSubmitted] = useState(false);

  function submitDispute() {
    setSubmitted(true);
  }

  return (
    <DashboardLayout title={`${role} Support & Disputes`}>
      <section className="dashboard-card dispute-form">
        <p className="section-label">DISPUTE ESCALATION</p>
        <h2>Raise a dispute</h2>

        <label>
          Issue type
          <select>
            <option>Delayed payment</option>
            <option>Unsafe site condition</option>
            <option>Work quality concern</option>
            <option>Scope disagreement</option>
          </select>
        </label>

        <label>
          Describe the issue
          <textarea placeholder="Explain what happened, when it happened, and the resolution you need..." />
        </label>

        <button className="upload-box">
          <strong>Attach supporting evidence</strong>
          <span>Frontend demo: this does not upload a real file.</span>
        </button>

        <button className="primary-button" onClick={submitDispute}>
          Submit dispute
        </button>

        {submitted && (
          <p className="success-message">
            Your dispute has been submitted in this frontend demo.
          </p>
        )}
      </section>

      <section className="dashboard-card">
        <p className="section-label">RULE UPDATES</p>
        <h2>Recent platform notifications</h2>

        <div className="activity-item">
          <span className="activity-dot success"></span>
          <div>
            <strong>Retainage policy confirmed</strong>
            <p>10% of eligible milestone payments stays in the vault.</p>
          </div>
        </div>

        <div className="activity-item">
          <span className="activity-dot pending"></span>
          <div>
            <strong>Inspection response window updated</strong>
            <p>Assigned inspections must be completed within two days.</p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default DisputePage;
