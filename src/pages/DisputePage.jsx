import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const API = "http://localhost:5000/api";

const targetOptions = {
  "General Contractor": ["OWNER"],
  Subcontractor: ["GENERAL_CONTRACTOR", "OWNER"],
  "Public Site Inspector": ["GENERAL_CONTRACTOR", "OWNER"],
  Laborer: ["SUBCONTRACTOR", "GENERAL_CONTRACTOR", "OWNER"],
};

const roleNames = {
  OWNER: "Project Owner",
  GENERAL_CONTRACTOR: "General Contractor",
  SUBCONTRACTOR: "Subcontractor",
  INSPECTOR: "Public Site Inspector",
};

function DisputePage({ role }) {
  const [user, setUser] = useState(null);
  const [disputes, setDisputes] = useState([]);

  const [issueType, setIssueType] = useState("Delayed payment");
  const [priority, setPriority] = useState("MEDIUM");
  const [targetRole, setTargetRole] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const targets = targetOptions[role] || ["OWNER"];

  /* =====================================================
     LOAD USER
  ===================================================== */

  useEffect(() => {
    const savedUser = localStorage.getItem("infraflowUser");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  /* =====================================================
     DEFAULT TARGET
  ===================================================== */

  useEffect(() => {
    if (targets.length > 0) {
      setTargetRole(targets[0]);
    }
  }, [role]);

  /* =====================================================
     LOAD MY DISPUTES
  ===================================================== */

  useEffect(() => {
    if (!user?.id) return;

    loadDisputes();
  }, [user]);

  async function loadDisputes() {
    try {
      const response = await fetch(`${API}/disputes/mine/${user.id}`);

      const data = await response.json();

      if (response.ok) {
        setDisputes(data);
      }
    } catch (error) {
      console.error("Failed to load disputes:", error);
    }
  }

  /* =====================================================
     SUBMIT DISPUTE
  ===================================================== */

  async function submitDispute(e) {
    e.preventDefault();

    if (!user?.id) {
      setMessage("Please login again.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setMessage("Please fill in the title and description.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("raisedBy", user.id);
      formData.append("issueType", issueType);
      formData.append("priority", priority);
      formData.append("targetRole", targetRole);
      formData.append("title", title);
      formData.append("description", description);

      files.forEach((file) => {
        formData.append("evidence", file);
      });

      const response = await fetch(`${API}/disputes`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit dispute.");
      }

      setMessage("Dispute submitted successfully.");

      setTitle("");
      setDescription("");
      setFiles([]);
      setPriority("MEDIUM");
      setIssueType("Delayed payment");

      await loadDisputes();
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     STATUS CLASS
  ===================================================== */

  function statusClass(status) {
    return `dispute-status ${status?.toLowerCase().replaceAll("_", "-")}`;
  }

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString();
  }

  return (
    <DashboardLayout title={`${role} Support & Disputes`}>
      {/* =================================================
          RAISE DISPUTE
      ================================================= */}

      <section className="dashboard-card dispute-form">
        <p className="section-label">DISPUTE ESCALATION</p>

        <h2>Raise a dispute</h2>

        <p className="section-description">
          Submit an issue for formal review and resolution.
        </p>

        <form onSubmit={submitDispute}>
          <div className="dispute-form-grid">
            {/* ISSUE TYPE */}

            <label>
              Issue type
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
              >
                <option>Delayed payment</option>
                <option>Unsafe site condition</option>
                <option>Work quality concern</option>
                <option>Scope disagreement</option>
                <option>Wage dispute</option>
                <option>Contract disagreement</option>
                <option>Other</option>
              </select>
            </label>

            {/* PRIORITY */}

            <label>
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>

            {/* TARGET */}

            <label>
              Escalate to
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                {targets.map((target) => (
                  <option key={target} value={target}>
                    {roleNames[target] || target}
                  </option>
                ))}
              </select>
            </label>

            {/* TITLE */}

            <label>
              Dispute title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Milestone payment delayed"
              />
            </label>
          </div>

          {/* DESCRIPTION */}

          <label>
            Describe the issue
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what happened, when it happened, and the resolution you need..."
              rows="6"
            />
          </label>

          {/* EVIDENCE */}

          <label className="dispute-upload">
            <span className="upload-title">Attach supporting evidence</span>

            <span className="upload-subtitle">
              JPG, PNG, WEBP or PDF — maximum 5 files, 10 MB each.
            </span>

            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </label>

          {/* FILE LIST */}

          {files.length > 0 && (
            <div className="dispute-file-list">
              {files.map((file) => (
                <span key={file.name}>📎 {file.name}</span>
              ))}
            </div>
          )}

          {/* SUBMIT */}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Submitting..." : "Submit dispute"}
          </button>

          {message && <p className="success-message">{message}</p>}
        </form>
      </section>

      {/* =================================================
          MY DISPUTES
      ================================================= */}

      <section className="dashboard-card dispute-history">
        <p className="section-label">DISPUTE HISTORY</p>

        <h2>Your disputes</h2>

        {disputes.length === 0 ? (
          <div className="empty-state">
            <p>No disputes have been raised yet.</p>
          </div>
        ) : (
          <div className="dispute-history-list">
            {disputes.map((dispute) => (
              <article key={dispute.id} className="dispute-history-item">
                <div>
                  <div className="dispute-item-top">
                    <strong>{dispute.title}</strong>

                    <span className={statusClass(dispute.status)}>
                      {dispute.status}
                    </span>
                  </div>

                  <p>{dispute.issue_type}</p>

                  <small>
                    Escalated to{" "}
                    {roleNames[dispute.target_role] || dispute.target_role}
                  </small>

                  <small>Raised {formatDate(dispute.created_at)}</small>

                  {dispute.resolution && (
                    <div className="dispute-resolution">
                      <strong>Resolution:</strong>

                      <p>{dispute.resolution}</p>
                    </div>
                  )}
                </div>

                <span
                  className={`priority-badge ${dispute.priority?.toLowerCase()}`}
                >
                  {dispute.priority}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

export default DisputePage;
