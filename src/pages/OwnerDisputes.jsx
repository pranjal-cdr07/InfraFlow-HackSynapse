import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const API = "http://localhost:5000/api";

function parseEvidence(value) {
  try {
    return JSON.parse(value || "[]");
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function OwnerDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [selected, setSelected] = useState(null);

  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("infraflowUser") || "null");

  /* =====================================================
     LOAD DISPUTES
  ===================================================== */

  useEffect(() => {
    loadDisputes();
  }, []);

  async function loadDisputes() {
    try {
      const response = await fetch(`${API}/disputes/owner`);

      const data = await response.json();

      if (response.ok) {
        setDisputes(data);

        if (selected) {
          const updated = data.find((item) => item.id === selected.id);

          setSelected(updated || null);
        }
      }
    } catch (error) {
      console.error("Failed to load disputes:", error);
    }
  }

  /* =====================================================
     FREEZE DISPUTE
  ===================================================== */

  async function freezeDispute() {
    if (!selected || !user?.id) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/disputes/${selected.id}/freeze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to freeze dispute.");
      }

      setMessage(`Dispute frozen. Transaction: ${data.transaction.txHash}`);

      await loadDisputes();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     RESOLVE / REJECT
  ===================================================== */

  async function updateDispute(action) {
    if (!selected || !user?.id) return;

    if (!resolution.trim()) {
      setMessage("Enter a resolution before continuing.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/disputes/${selected.id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          resolution,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update dispute.");
      }

      setMessage(`${data.message} Transaction: ${data.transaction.txHash}`);

      setResolution("");

      await loadDisputes();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     STATUS
  ===================================================== */

  function statusClass(status) {
    return `dispute-status ${status?.toLowerCase().replaceAll("_", "-")}`;
  }

  return (
    <DashboardLayout title="Dispute Resolution & Audit Trail">
      <div className="owner-dispute-layout">
        {/* =================================================
            DISPUTE LIST
        ================================================= */}

        <section className="dashboard-card dispute-inbox">
          <p className="section-label">DISPUTE INBOX</p>

          <h2>Incoming disputes</h2>

          <p className="section-description">
            Review, freeze and resolve disputes raised across the InfraFlow
            platform.
          </p>

          {disputes.length === 0 ? (
            <div className="empty-state">
              <p>No disputes found.</p>
            </div>
          ) : (
            <div className="owner-dispute-list">
              {disputes.map((dispute) => (
                <button
                  key={dispute.id}
                  className={`owner-dispute-item ${
                    selected?.id === dispute.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelected(dispute);
                    setMessage("");
                    setResolution(dispute.resolution || "");
                  }}
                >
                  <div>
                    <strong>{dispute.title}</strong>

                    <span>
                      Raised by {dispute.raised_by_name || "Unknown user"}
                    </span>
                  </div>

                  <div className="owner-dispute-meta">
                    <span className={statusClass(dispute.status)}>
                      {dispute.status}
                    </span>

                    <span
                      className={`priority-badge ${dispute.priority?.toLowerCase()}`}
                    >
                      {dispute.priority}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            REVIEW PANEL
        ================================================= */}

        <section className="dashboard-card dispute-review">
          {!selected ? (
            <div className="empty-state">
              <p>Select a dispute to review its details.</p>
            </div>
          ) : (
            <>
              <p className="section-label">DISPUTE REVIEW</p>

              <div className="review-header">
                <div>
                  <h2>{selected.title}</h2>

                  <p>
                    Dispute #{selected.id} · {selected.issue_type}
                  </p>
                </div>

                <span className={statusClass(selected.status)}>
                  {selected.status}
                </span>
              </div>

              {/* DETAILS */}

              <div className="dispute-details-grid">
                <div>
                  <small>Raised by</small>
                  <strong>{selected.raised_by_name}</strong>
                </div>

                <div>
                  <small>Email</small>
                  <strong>{selected.raised_by_email}</strong>
                </div>

                <div>
                  <small>Escalated to</small>
                  <strong>{selected.target_role}</strong>
                </div>

                <div>
                  <small>Priority</small>
                  <strong>{selected.priority}</strong>
                </div>

                <div>
                  <small>Created</small>
                  <strong>{formatDate(selected.created_at)}</strong>
                </div>

                <div>
                  <small>Project</small>
                  <strong>{selected.project_name || "-"}</strong>
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="dispute-review-section">
                <h3>Issue description</h3>

                <p>{selected.description}</p>
              </div>

              {/* EVIDENCE */}

              <div className="dispute-review-section">
                <h3>Supporting evidence</h3>

                {parseEvidence(selected.evidence).length === 0 ? (
                  <p className="muted-text">No evidence attached.</p>
                ) : (
                  <div className="evidence-photos">
                    {parseEvidence(selected.evidence).map((file, index) => (
                      <a
                        key={`${file.path}-${index}`}
                        className="photo-button"
                        href={`http://localhost:5000${file.path}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📎 Evidence {index + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* FREEZE */}

              {selected.status !== "RESOLVED" &&
                selected.status !== "REJECTED" && (
                  <div className="dispute-action-box">
                    <div>
                      <h3>Escalation control</h3>

                      <p>
                        Freeze the dispute to mark the case as escalated and
                        create a blockchain transaction record.
                      </p>
                    </div>

                    <button
                      className="secondary-button"
                      disabled={loading || selected.frozen}
                      onClick={freezeDispute}
                    >
                      {selected.frozen ? "Dispute Frozen" : "Freeze & Escalate"}
                    </button>
                  </div>
                )}

              {/* RESOLUTION */}

              {selected.status !== "RESOLVED" &&
                selected.status !== "REJECTED" && (
                  <div className="dispute-resolution-box">
                    <h3>Resolution decision</h3>

                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Enter the decision, corrective action or reason for rejection..."
                      rows="5"
                    />

                    <div className="dispute-action-buttons">
                      <button
                        className="primary-button"
                        disabled={loading}
                        onClick={() => updateDispute("RESOLVE")}
                      >
                        Resolve Dispute
                      </button>

                      <button
                        className="secondary-button"
                        disabled={loading}
                        onClick={() => updateDispute("REJECT")}
                      >
                        Reject Dispute
                      </button>
                    </div>
                  </div>
                )}

              {/* FINAL RESOLUTION */}

              {selected.resolution && (
                <div className="dispute-resolution">
                  <strong>Final resolution</strong>

                  <p>{selected.resolution}</p>

                  {selected.resolved_by_name && (
                    <small>Decided by {selected.resolved_by_name}</small>
                  )}
                </div>
              )}

              {message && <p className="success-message">{message}</p>}
            </>
          )}
        </section>

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <section className="dashboard-card notifications-card">
          <p className="section-label">NOTIFICATIONS</p>

          <h2>Dispute updates</h2>

          {disputes.length === 0 ? (
            <p className="muted-text">No dispute notifications yet.</p>
          ) : (
            <div className="notification-list">
              {disputes.slice(0, 5).map((dispute) => (
                <div className="notification-item" key={dispute.id}>
                  <div>
                    <strong>{dispute.title}</strong>

                    <p>
                      {dispute.status === "RESOLVED"
                        ? "Dispute has been resolved."
                        : dispute.status === "REJECTED"
                          ? "Dispute has been rejected."
                          : dispute.frozen
                            ? "Dispute is frozen and escalated."
                            : "Dispute requires review."}
                    </p>
                  </div>

                  <span>#{dispute.id}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

export default OwnerDisputes;
