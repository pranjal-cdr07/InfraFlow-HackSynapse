import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

function ContractorMilestones() {
  const [verified, setVerified] = useState(false);
  const [inspectionScheduled, setInspectionScheduled] = useState(false);

  return (
    <DashboardLayout title="Milestones & Inspections">
      <section className="dashboard-card">
        <p className="section-label">DUAL VERIFICATION</p>
        <h2>Inspector report review</h2>

        <div className="inspection-review">
          <div className="evidence-image">
            SITE
            <br />
            EVIDENCE
          </div>

          <div>
            <span className="status evaluation">Awaiting verification</span>

            <h3>Structural frame — Level 04</h3>

            <p>
              Inspector: Priya N. · 14 photos uploaded · Report ID:
              INS-204
            </p>

            <p>
              The site work appears compliant with the approved structure
              drawings and inspection checklist.
            </p>

            <button
              className="primary-button"
              onClick={() => setVerified(true)}
            >
              Dual-verify inspection
            </button>

            {verified && (
              <p className="success-message">
                Inspection verified. Payment release is shown as complete in
                this frontend demo.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-card">
        <p className="section-label">SURPRISE INSPECTION</p>
        <h2>Schedule an unannounced audit</h2>

        <label>
          Choose milestone
          <select>
            <option>Structural frame — Level 04</option>
            <option>Foundation and groundworks</option>
            <option>Envelope and MEP</option>
          </select>
        </label>

        <label>
          Target inspection date
          <input type="date" />
        </label>

        <button
          className="primary-button"
          onClick={() => setInspectionScheduled(true)}
        >
          Schedule surprise inspection
        </button>

        {inspectionScheduled && (
          <p className="success-message">
            Surprise inspection scheduled in this frontend demo.
          </p>
        )}
      </section>

      <section className="dashboard-card">
        <p className="section-label">AUTOMATED PAYMENT RELEASE</p>
        <h2>Settlement activity</h2>

        <div className="activity-item">
          <span className="activity-dot success"></span>
          <div>
            <strong>Foundation package settled</strong>
            <p>
              ₹1.49 Cr released to the subcontractor. ₹16.6 L moved to the
              retainage vault.
            </p>
          </div>
        </div>

        <div className="activity-item">
          <span className="activity-dot pending"></span>
          <div>
            <strong>Structural frame payment</strong>
            <p>Waiting for contractor dual-verification.</p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default ContractorMilestones;
