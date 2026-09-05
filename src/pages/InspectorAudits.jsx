import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

function InspectorAudits() {
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [evidenceSubmitted, setEvidenceSubmitted] = useState(false);

  const audits = [
    {
      id: "INS-204",
      milestone: "Structural frame — Level 04",
      project: "Eastline Transit Hub",
      location: "Kolkata · Zone C",
      deadline: "1 day 8 hours",
    },
    {
      id: "INS-205",
      milestone: "Foundation compaction",
      project: "North Basin Waterworks",
      location: "Kolkata · Zone A",
      deadline: "1 day 21 hours",
    },
  ];

  return (
    <DashboardLayout title="Assigned Inspections">
      <section className="dashboard-card tender-directory">
        <p className="section-label">AUTO-ASSIGNED AUDITS</p>
        <h2>Inspection workload queue</h2>

        <table>
          <thead>
            <tr>
              <th>Inspection ID</th>
              <th>Milestone</th>
              <th>Project</th>
              <th>Location</th>
              <th>Time remaining</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {audits.map((audit) => (
              <tr key={audit.id}>
                <td>{audit.id}</td>
                <td>{audit.milestone}</td>
                <td>{audit.project}</td>
                <td>{audit.location}</td>
                <td>{audit.deadline}</td>
                <td>
                  <button
                    className="table-button"
                    onClick={() => {
                      setSelectedAudit(audit);
                      setEvidenceSubmitted(false);
                    }}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedAudit && (
        <section className="dashboard-card inspection-form">
          <p className="section-label">INSPECTION EVIDENCE</p>
          <h2>{selectedAudit.milestone}</h2>

          <p>
            {selectedAudit.project} · {selectedAudit.location}
          </p>

          <label>
            Inspection result
            <select>
              <option>Compliant — ready for contractor review</option>
              <option>Requires correction</option>
              <option>Unsafe condition found</option>
            </select>
          </label>

          <label>
            Inspection notes
            <textarea placeholder="Write your inspection findings here..." />
          </label>

          <button className="upload-box">
            <strong>Upload photographs and report</strong>
            <span>Frontend demo: no real files are uploaded.</span>
          </button>

          <button
            className="primary-button"
            onClick={() => setEvidenceSubmitted(true)}
          >
            Submit inspection evidence
          </button>

          {evidenceSubmitted && (
            <p className="success-message">
              Inspection evidence submitted for contractor verification.
            </p>
          )}
        </section>
      )}
    </DashboardLayout>
  );
}

export default InspectorAudits;
