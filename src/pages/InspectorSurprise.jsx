import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

function InspectorSurprise() {
  const [accepted, setAccepted] = useState(false);
  const [evidenceUploaded, setEvidenceUploaded] = useState(false);

  return (
    <DashboardLayout title="Surprise Audits">
      <section className="dashboard-card">
        <p className="section-label">UNANNOUNCED INSPECTION TASK</p>
        <h2>Concrete pour review</h2>

        <div className="surprise-task">
          <div>
            <p><strong>Project:</strong> Eastline Transit Hub</p>
            <p><strong>Requested by:</strong> General Contractor</p>
            <p><strong>Target time:</strong> Tomorrow, 08:00–12:00</p>
            <p><strong>Instruction:</strong> Do not notify the site crew before arrival.</p>
          </div>

          <span className="status evaluation">Unannounced</span>
        </div>

        <button
          className="primary-button"
          onClick={() => setAccepted(true)}
        >
          Accept surprise inspection
        </button>

        {accepted && (
          <p className="success-message">
            Surprise inspection accepted in this frontend demo.
          </p>
        )}
      </section>

      {accepted && (
        <section className="dashboard-card">
          <p className="section-label">AUDIT EVIDENCE</p>
          <h2>Upload surprise audit report</h2>

          <label>
            Audit notes
            <textarea placeholder="Record your site observations..." />
          </label>

          <button
            className="upload-box"
            onClick={() => setEvidenceUploaded(true)}
          >
            <strong>Upload surprise audit evidence</strong>
            <span>Frontend demo: no real files are uploaded.</span>
          </button>

          {evidenceUploaded && (
            <p className="success-message">
              Surprise audit evidence added successfully.
            </p>
          )}
        </section>
      )}
    </DashboardLayout>
  );
}

export default InspectorSurprise;