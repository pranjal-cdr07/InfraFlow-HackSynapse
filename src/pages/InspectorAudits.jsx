import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const API = "http://localhost:5000/api";

function InspectorAudits() {
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState(null);

  const [report, setReport] = useState("");
  const [evidence, setEvidence] = useState("");
  const [message, setMessage] = useState("");

  const [audits, setAudits] = useState([]);
  const [auditReport, setAuditReport] = useState("");
  const [auditEvidence, setAuditEvidence] = useState("");
  const [auditMessage, setAuditMessage] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("infraflowUser") || "{}");

  const loadInspections = async () => {
    try {
      const response = await fetch(`${API}/milestones/inspections/${user.id}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load inspections");
      }

      setInspections(data);
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  };

  const loadAudits = async () => {
    try {
      const response = await fetch(`${API}/audits/inspector/${user.id}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load audits");
      }

      setAudits(data);
    } catch (error) {
      console.error("Audit loading error:", error);
      setAuditMessage(error.message);
    }
  };

  useEffect(() => {
    loadInspections();
    loadAudits();
  }, []);

  const completeAudit = async (auditId) => {
    if (!auditReport.trim()) {
      setAuditMessage("Please enter an inspection report.");
      return;
    }

    setAuditLoading(true);
    setAuditMessage("");

    try {
      const response = await fetch(`${API}/audits/${auditId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report: auditReport,
          evidence: auditEvidence,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete audit");
      }

      setAuditMessage("Surprise audit completed successfully.");

      setAuditReport("");
      setAuditEvidence("");

      loadAudits();
    } catch (error) {
      console.error("Audit completion error:", error);
      setAuditMessage(error.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const submitInspection = async () => {
    if (!selectedInspection) return;

    try {
      const response = await fetch(
        `${API}/milestones/${selectedInspection.milestone_id}/inspect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inspectorId: user.id,
            report,
            evidence,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Inspection failed");
      }

      setMessage(
        "Inspection approved. Milestone is now waiting for GC verification.",
      );

      setSelectedInspection(null);
      setReport("");
      setEvidence("");

      loadInspections();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <DashboardLayout title="Assigned Inspections">
      {/* SURPRISE AUDITS */}
      <section className="dashboard-card">
        <p className="section-label">SURPRISE AUDITS</p>

        <h2>Assigned surprise audits</h2>

        {audits.length === 0 ? (
          <p>No surprise audits assigned.</p>
        ) : (
          audits.map((audit) => (
            <div className="activity-item" key={audit.id}>
              <span
                className={`activity-dot ${
                  audit.status === "COMPLETED" ? "success" : "pending"
                }`}
              />

              <div>
                <strong>{audit.project_name}</strong>

                <p>Requested by: {audit.requester_name}</p>

                <span className="status evaluation">{audit.status}</span>

                {audit.status === "PENDING" && (
                  <div style={{ marginTop: "12px" }}>
                    <textarea
                      placeholder="Inspection report"
                      value={auditReport}
                      onChange={(e) => setAuditReport(e.target.value)}
                    />

                    <textarea
                      placeholder="Evidence / photo references"
                      value={auditEvidence}
                      onChange={(e) => setAuditEvidence(e.target.value)}
                    />

                    <button
                      className="primary-button"
                      onClick={() => completeAudit(audit.id)}
                      disabled={auditLoading}
                    >
                      {auditLoading ? "Submitting..." : "Complete Audit"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {auditMessage && <p className="success-message">{auditMessage}</p>}
      </section>

      {/* NORMAL INSPECTIONS */}
      <section className="dashboard-card tender-directory">
        <p className="section-label">AUTO-ASSIGNED AUDITS</p>

        <h2>Inspection workload queue</h2>

        {inspections.length === 0 ? (
          <p>No inspections assigned.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {inspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td>{inspection.milestone_title}</td>

                  <td>{inspection.project_name}</td>

                  <td>₹{Number(inspection.amount).toLocaleString("en-IN")}</td>

                  <td>{inspection.status}</td>

                  <td>
                    {inspection.status === "PENDING" && (
                      <button
                        className="table-button"
                        onClick={() => {
                          setSelectedInspection(inspection);
                          setMessage("");
                        }}
                      >
                        Open
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* NORMAL INSPECTION FORM */}
      {selectedInspection && (
        <section className="dashboard-card inspection-form">
          <p className="section-label">INSPECTION EVIDENCE</p>

          <h2>{selectedInspection.milestone_title}</h2>

          <p>{selectedInspection.project_name}</p>

          <label>
            Inspection result
            <select>
              <option>Compliant — ready for contractor review</option>

              <option>Requires correction</option>
            </select>
          </label>

          <label>
            Inspection notes
            <textarea
              placeholder="Write your inspection findings here..."
              value={report}
              onChange={(e) => setReport(e.target.value)}
            />
          </label>

          <label>
            Evidence
            <input
              type="text"
              placeholder="inspection_photos.zip"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
            />
          </label>

          <button
            className="upload-box"
            onClick={() => setEvidence("inspection_photos.zip")}
          >
            <strong>Upload photographs and report</strong>

            <span>Click to simulate selecting inspection evidence.</span>
          </button>

          <button className="primary-button" onClick={submitInspection}>
            Approve & Submit Inspection
          </button>

          {message && <p className="success-message">{message}</p>}
        </section>
      )}
    </DashboardLayout>
  );
}

export default InspectorAudits;
