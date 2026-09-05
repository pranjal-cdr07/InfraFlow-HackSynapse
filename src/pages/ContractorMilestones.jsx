import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const API = "http://localhost:5000/api";

function ContractorMilestones() {
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);

  const [projectId, setProjectId] = useState("");
  const [subcontractorId, setSubcontractorId] = useState("3");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("infraflowUser") || "{}");
  const [auditMessage, setAuditMessage] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const loadData = async () => {
    try {
      const projectsResponse = await fetch(
        `${API}/milestones/projects/${user.id}`,
      );

      const projectData = await projectsResponse.json();
      setProjects(projectData);

      const milestoneResponse = await fetch(`${API}/milestones`);

      const milestoneData = await milestoneResponse.json();
      setMilestones(milestoneData);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load milestone data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createMilestone = async () => {
    if (!projectId || !title || !amount) {
      setMessage("Please fill project, milestone name and amount.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/milestones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          subcontractorId,
          title,
          description,
          amount: amount.replace(/[₹,]/g, ""),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create milestone");
      }

      setMessage("Milestone created successfully.");

      setProjectId("");
      setTitle("");
      setDescription("");
      setAmount("");

      loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyMilestone = async (milestoneId) => {
    try {
      const response = await fetch(`${API}/milestones/${milestoneId}/verify`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setMessage(
        `Payment released successfully. Transaction: ${data.transaction.tx_hash}`,
      );

      loadData();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const initiateSurpriseAudit = async () => {
    if (projects.length === 0) {
      setAuditMessage("No active project available for surprise audit.");
      return;
    }

    setAuditLoading(true);
    setAuditMessage("");

    try {
      const response = await fetch(`${API}/audits/surprise`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractorId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate surprise audit");
      }

      setAuditMessage(
        `Surprise audit initiated successfully. Inspector assigned: ${data.audit.inspector_name}`,
      );
    } catch (error) {
      console.error("Surprise audit error:", error);
      setAuditMessage(error.message);
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <DashboardLayout title="Milestones & Inspections">
      {/* CREATE MILESTONE */}
      <section className="dashboard-card">
        <p className="section-label">MILESTONE MANAGEMENT</p>
        <h2>Create new milestone</h2>

        <label>
          Project
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Select project</option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Subcontractor
          <select
            value={subcontractorId}
            onChange={(e) => setSubcontractorId(e.target.value)}
          >
            <option value="3">Subcontractor</option>
          </select>
        </label>

        <label>
          Milestone name
          <input
            type="text"
            placeholder="Foundation Complete"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label>
          Description
          <textarea
            placeholder="Describe the work to be completed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label>
          Payment amount
          <input
            type="text"
            placeholder="₹150000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <button
          className="primary-button"
          onClick={createMilestone}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Milestone"}
        </button>

        {message && <p className="success-message">{message}</p>}
      </section>

      {/* SURPRISE AUDIT */}
      <section className="dashboard-card">
        <p className="section-label">QUALITY & COMPLIANCE</p>

        <h2>Surprise audit</h2>

        <p>
          Request an unplanned inspection of an active project to verify
          construction quality and compliance.
        </p>

        <button
          className="primary-button"
          onClick={initiateSurpriseAudit}
          disabled={auditLoading}
        >
          {auditLoading ? "Initiating..." : "Initiate Surprise Audit"}
        </button>

        {auditMessage && <p className="success-message">{auditMessage}</p>}
      </section>

      {/* MILESTONE STATUS */}
      <section className="dashboard-card">
        <p className="section-label">PROJECT MILESTONES</p>
        <h2>Milestone verification</h2>

        {milestones.length === 0 ? (
          <p>No milestones created yet.</p>
        ) : (
          milestones.map((milestone) => (
            <div className="activity-item" key={milestone.id}>
              <span
                className={`activity-dot ${
                  milestone.status === "PAID" ? "success" : "pending"
                }`}
              />

              <div>
                <strong>{milestone.title}</strong>

                <p>
                  {milestone.project_name} · ₹
                  {Number(milestone.amount).toLocaleString("en-IN")}
                </p>

                <span className="status evaluation">{milestone.status}</span>

                {milestone.status === "INSPECTED" && (
                  <button
                    className="primary-button"
                    onClick={() => verifyMilestone(milestone.id)}
                  >
                    Verify & Release Payment
                  </button>
                )}

                {milestone.status === "PAID" && (
                  <p className="success-message">
                    Payment released through smart contract simulation.
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </DashboardLayout>
  );
}

export default ContractorMilestones;
