import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const API = "http://localhost:5000/api";

function SubcontractorMilestones() {
  const [milestones, setMilestones] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [proof, setProof] = useState("");
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("infraflowUser") || "{}");

  const loadMilestones = async () => {
    try {
      const response = await fetch(`${API}/milestones`);
      const data = await response.json();

      const mine = data.filter(
        (milestone) => Number(milestone.subcontractor_id) === Number(user.id),
      );

      setMilestones(mine);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load milestones.");
    }
  };

  useEffect(() => {
    loadMilestones();
  }, []);

  const submitProof = async () => {
    if (!selectedId || !proof) {
      setMessage("Select a milestone and add proof first.");
      return;
    }

    try {
      const response = await fetch(`${API}/milestones/${selectedId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proof,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Submission failed");
      }

      setMessage(
        `Milestone submitted. Inspector ${data.inspector.name} has been assigned.`,
      );

      setProof("");
      setSelectedId("");

      loadMilestones();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <DashboardLayout title="Milestones & Work Proof">
      <section className="dashboard-card">
        <p className="section-label">WORK COMPLETION</p>
        <h2>Submit milestone for inspection</h2>

        <label>
          Choose active milestone
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Select milestone</option>

            {milestones
              .filter((milestone) => milestone.status === "PENDING")
              .map((milestone) => (
                <option key={milestone.id} value={milestone.id}>
                  {milestone.title}
                </option>
              ))}
          </select>
        </label>

        <label>
          Proof / photo reference
          <input
            type="text"
            placeholder="foundation_block_a_photo.jpg"
            value={proof}
            onChange={(e) => setProof(e.target.value)}
          />
        </label>

        <button
          className="upload-box"
          onClick={() => setProof("foundation_block_a_photo.jpg")}
        >
          <strong>Upload photo proofs</strong>
          <span>Click to simulate selecting site photographs.</span>
        </button>

        {proof && <p className="success-message">Proof selected: {proof}</p>}

        <button className="primary-button" onClick={submitProof}>
          Signal milestone completed
        </button>

        {message && <p className="success-message">{message}</p>}
      </section>

      <section className="dashboard-card">
        <p className="section-label">VERIFICATION PIPELINE</p>

        <h2>Your milestones</h2>

        {milestones.length === 0 ? (
          <p>No milestones assigned yet.</p>
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
              </div>
            </div>
          ))
        )}
      </section>
    </DashboardLayout>
  );
}

export default SubcontractorMilestones;
