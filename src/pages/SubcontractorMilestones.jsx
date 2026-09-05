import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

function SubcontractorMilestones() {
  const [proofUploaded, setProofUploaded] = useState(false);
  const [milestoneSent, setMilestoneSent] = useState(false);

  return (
    <DashboardLayout title="Milestones & Work Proof">
      <section className="dashboard-card">
        <p className="section-label">STEP 09 · WORK COMPLETION</p>
        <h2>Milestone completion signal</h2>

        <label>
          Choose active milestone
          <select>
            <option>Structural frame — Level 04</option>
            <option>Foundation and groundworks</option>
            <option>Envelope and MEP</option>
          </select>
        </label>

        <button
          className="upload-box"
          onClick={() => setProofUploaded(true)}
        >
          <strong>Upload photo proofs</strong>
          <span>Click to simulate uploading site photographs.</span>
        </button>

        {proofUploaded && (
          <p className="success-message">
            8 photo proofs added to this frontend demo.
          </p>
        )}

        <button
          className="primary-button"
          onClick={() => setMilestoneSent(true)}
        >
          Signal milestone completed
        </button>

        {milestoneSent && (
          <p className="success-message">
            Completion signal sent. An inspector will be assigned next.
          </p>
        )}
      </section>

      <section className="dashboard-card">
        <p className="section-label">VERIFICATION PIPELINE</p>
        <h2>Inspection and payment status</h2>

        <div className="pipeline">
          <article className={milestoneSent ? "pipeline-step complete" : "pipeline-step"}>
            <span>1</span>
            <strong>Signal sent</strong>
            <p>{milestoneSent ? "Complete" : "Ready"}</p>
          </article>

          <article className={milestoneSent ? "pipeline-step active" : "pipeline-step"}>
            <span>2</span>
            <strong>Inspector assigned</strong>
            <p>2-day window</p>
          </article>

          <article className="pipeline-step">
            <span>3</span>
            <strong>Work inspected</strong>
            <p>Pending</p>
          </article>

          <article className="pipeline-step">
            <span>4</span>
            <strong>GC verifies</strong>
            <p>Pending</p>
          </article>

          <article className="pipeline-step">
            <span>5</span>
            <strong>Payment released</strong>
            <p>Pending</p>
          </article>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default SubcontractorMilestones;