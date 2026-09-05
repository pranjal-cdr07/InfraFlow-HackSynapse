import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

function ContractorTenders() {
  const [tenders, setTenders] = useState([]);
  const [selectedTender, setSelectedTender] = useState(null);

  const [bidAmount, setBidAmount] = useState("");
  const [proposalDocument, setProposalDocument] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bidSubmitted, setBidSubmitted] = useState(false);

  // GET AVAILABLE TENDERS
  async function loadTenders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/tenders");

      if (!response.ok) {
        throw new Error("Failed to load tenders");
      }

      const data = await response.json();
      setTenders(data);
    } catch (error) {
      console.error("Load tenders error:", error);
      setError("Unable to load tenders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenders();
  }, []);

  // FORMAT MONEY
  function formatMoney(value) {
    return `₹${Number(value).toLocaleString("en-IN")}`;
  }

  // FORMAT DEADLINE
  function formatDate(value) {
    if (!value) return "No deadline";

    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // SELECT TENDER
  function selectTender(tender) {
    setSelectedTender(tender);
    setBidSubmitted(false);
    setBidAmount("");
    setProposalDocument("");
  }

  // SUBMIT BID
  async function submitBid() {
    if (!bidAmount.trim()) {
      alert("Please enter your bid amount.");
      return;
    }

    if (!proposalDocument.trim()) {
      alert("Please enter your proposal document name.");
      return;
    }

    let user;

    try {
      user = JSON.parse(localStorage.getItem("infraflowUser") || "null");
    } catch (error) {
      console.error("User data error:", error);
      localStorage.removeItem("infraflowUser");
      alert("Please login again.");
      return;
    }

    if (!user) {
      alert("Please login again.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `http://localhost:5000/api/tenders/${selectedTender.id}/bids`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractorId: user.id,
            bidAmount: bidAmount.replace(/[₹,]/g, ""),
            securityDeposit: selectedTender.security_deposit,
            documents: proposalDocument,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to submit bid.");
        return;
      }

      setBidSubmitted(true);

      setBidAmount("");
      setProposalDocument("");

      alert("Bid submitted successfully.");
    } catch (error) {
      console.error("Submit bid error:", error);
      alert("Unable to connect to server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Tender Discovery & Bids">
      {/* AVAILABLE TENDERS */}
      <section className="dashboard-card tender-directory">
        <p className="section-label">AVAILABLE PROJECTS</p>

        <h2>Platform tender directory</h2>

        {loading && <p>Loading tenders...</p>}

        {error && <p className="login-error">{error}</p>}

        {!loading && tenders.length === 0 && (
          <p>No tenders are currently available.</p>
        )}

        {!loading && tenders.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Contract value</th>
                <th>Security deposit</th>
                <th>Deadline</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {tenders.map((tender) => (
                <tr key={tender.id}>
                  <td>{tender.title}</td>

                  <td>{formatMoney(tender.tender_amount)}</td>

                  <td>{formatMoney(tender.security_deposit)}</td>

                  <td>{formatDate(tender.deadline)}</td>

                  <td>
                    <button
                      className="table-button"
                      onClick={() => selectTender(tender)}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* BID SUBMISSION */}
      {selectedTender && (
        <section className="dashboard-card bid-panel">
          <p className="section-label">BID SUBMISSION</p>

          <h2>Submit bid for {selectedTender.title}</h2>

          <label>
            Your bid amount
            <input
              value={bidAmount}
              onChange={(event) => setBidAmount(event.target.value)}
              placeholder="Example: ₹4,00,00,000"
            />
          </label>

          <label>
            Proposal document name
            <input
              value={proposalDocument}
              onChange={(event) => setProposalDocument(event.target.value)}
              placeholder="Example: Atlas Civil Proposal.pdf"
            />
          </label>

          <div className="security-box">
            <p>Required bid security deposit</p>

            <h3>{formatMoney(selectedTender.security_deposit)}</h3>

            <span>Security deposit will be recorded with this bid.</span>
          </div>

          <button
            className="primary-button"
            onClick={submitBid}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Deposit security and submit bid"}
          </button>

          {bidSubmitted && (
            <p className="success-message">
              Bid submitted successfully for {selectedTender.title}.
            </p>
          )}
        </section>
      )}

      {/* MY BID STATUS */}
      <section className="dashboard-card">
        <p className="section-label">MY BID STATUS</p>

        <h2>Active bids and refund status</h2>

        <div className="activity-item">
          <span className="activity-dot pending"></span>

          <div>
            <strong>North Basin Waterworks</strong>
            <p>Bid is under evaluation.</p>
          </div>
        </div>

        <div className="activity-item">
          <span className="activity-dot success"></span>

          <div>
            <strong>Old Harbor Drainage</strong>
            <p>Security deposit refund: ₹4,15,000</p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default ContractorTenders;
