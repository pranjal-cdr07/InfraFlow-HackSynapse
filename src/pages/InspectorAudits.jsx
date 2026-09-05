import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const API = "http://localhost:5000/api";

function InspectorAudits() {
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState(null);

  const [report, setReport] = useState("");
  const [evidence, setEvidence] = useState("");
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("infraflowUser") || "{}");

  const loadInspections = async () => {
    try {
      const response = await fetch(`${API}/milestones/inspections/${user.id}`);

      const data = await response.json();

      setInspections(data);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load inspections.");
    }
  };

  useEffect(() => {
    loadInspections();
  }, []);

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
