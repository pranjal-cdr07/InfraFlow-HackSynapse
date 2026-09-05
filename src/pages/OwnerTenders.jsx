import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

function OwnerTenders() {
  const [tenderList, setTenderList] = useState([]);
  const [selectedTender, setSelectedTender] = useState(null);

  const [project, setProject] = useState("");
  const [amount, setAmount] = useState("");
  const [deposit, setDeposit] = useState("");
  const [deadline, setDeadline] = useState("");
  const [bidDocument, setBidDocument] = useState(null);

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [bidders, setBidders] = useState([]);
  const [biddersLoading, setBiddersLoading] = useState(false);

  const [selectingWinner, setSelectingWinner] = useState(false);
  const [winnerSelected, setWinnerSelected] = useState(false);

  // GET TENDERS
  async function loadTenders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/tenders");

      if (!response.ok) {
        throw new Error("Failed to load tenders");
      }

      const data = await response.json();
      setTenderList(data);
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

  // CREATE TENDER
  async function postTender() {
    if (
      project.trim() === "" ||
      amount.trim() === "" ||
      deposit.trim() === "" ||
      deadline === ""
    ) {
      alert("Please fill in all tender details.");
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
      setPosting(true);

      const response = await fetch("http://localhost:5000/api/tenders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ownerId: user.id,
          title: project,
          description: "",
          tenderAmount: amount.replace(/[₹,]/g, ""),
          securityDeposit: deposit.replace(/[₹,]/g, ""),
          deadline: deadline,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create tender.");
        return;
      }

      setTenderList((current) => [data.tender, ...current]);

      setProject("");
      setAmount("");
      setDeposit("");
      setDeadline("");
      setBidDocument(null);

      alert("Tender posted successfully.");
    } catch (error) {
      console.error("Create tender error:", error);
      alert("Unable to connect to server.");
    } finally {
      setPosting(false);
    }
  }

  async function viewTender(tender) {
    setSelectedTender(tender);
    setBidders([]);
    setBiddersLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/tenders/${tender.id}/bids`,
      );

      if (!response.ok) {
        throw new Error("Failed to load bidders");
      }

      const data = await response.json();
      setBidders(data);
    } catch (error) {
      console.error("Load bidders error:", error);
      alert("Unable to load bidders.");
    } finally {
      setBiddersLoading(false);
    }
  }

  async function selectWinner(bid) {
    const confirmed = window.confirm(
      `Select ${bid.contractor_name} as the winner?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSelectingWinner(true);

      const response = await fetch(
        `http://localhost:5000/api/tenders/${selectedTender.id}/winner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bidId: bid.id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to select winner.");
        return;
      }

      setWinnerSelected(true);

      // Update displayed bidder statuses
      setBidders((current) =>
        current.map((item) => ({
          ...item,
          status: item.id === bid.id ? "ACCEPTED" : "REJECTED",
        })),
      );

      // Update displayed tender
      setSelectedTender((current) => ({
        ...current,
        status: "AWARDED",
        winner_id: bid.contractor_id,
      }));

      setTenderList((current) =>
        current.map((item) =>
          item.id === selectedTender.id
            ? {
                ...item,
                status: "AWARDED",
                winner_id: bid.contractor_id,
              }
            : item,
        ),
      );

      alert(`${bid.contractor_name} selected as the winner.`);
    } catch (error) {
      console.error("Select winner error:", error);
      alert("Unable to connect to server.");
    } finally {
      setSelectingWinner(false);
    }
  }

  // DISPLAY HELPERS
  function formatMoney(value) {
    return `₹${Number(value).toLocaleString("en-IN")}`;
  }

  function formatDate(value) {
    if (!value) return "No deadline";

    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <DashboardLayout title="Tender Publishing & Awards">
      {/* STATS */}
      <section className="stats-grid">
        <article className="stat-card">
          <p>Active tenders</p>
          <h2>{tenderList.length}</h2>
        </article>

        <article className="stat-card">
          <p>Capital committed</p>
          <h2>₹19.9 Cr</h2>
        </article>

        
      </section>

      {/* CREATE TENDER */}
      <section className="dashboard-card">
        <p className="section-label">TENDER PUBLICATION</p>

        <h2>Create and post tender</h2>

        <label>
          Project name
          <input
            value={project}
            onChange={(event) => setProject(event.target.value)}
            placeholder="Example: Eastline Transit Hub"
          />
        </label>

        <label>
          Tender amount
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Example: ₹4,15,00,000"
          />
        </label>

        <label>
          Bid security deposit
          <input
            value={deposit}
            onChange={(event) => setDeposit(event.target.value)}
            placeholder="Example: ₹4,15,000"
          />
        </label>

        <label>
          Tender deadline
          <input
            type="datetime-local"
            value={deadline}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </label>

        <label className="document-upload">
          Bid document
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(event) =>
              setBidDocument(event.target.files?.[0] || null)
            }
          />
          <span>
            {bidDocument
              ? `Selected: ${bidDocument.name}`
              : "Upload tender specifications, BOQ, or bid instructions (PDF/DOC)."}
          </span>
        </label>

        <button
          className="primary-button"
          onClick={postTender}
          disabled={posting}
        >
          {posting ? "Posting..." : "Post tender"}
        </button>
      </section>

      {/* TENDER DIRECTORY */}
      <section className="dashboard-card tender-directory">
        <p className="section-label">ACTIVE TENDERS</p>

        <h2>Tender directory</h2>

        {loading && <p>Loading tenders...</p>}

        {error && <p className="login-error">{error}</p>}

        {!loading && tenderList.length === 0 && (
          <p>No tenders have been posted yet.</p>
        )}

        {!loading && tenderList.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Amount</th>
                <th>Applicants</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {tenderList.map((tender) => (
                <tr key={tender.id}>
                  <td>{tender.title}</td>

                  <td>{formatMoney(tender.tender_amount)}</td>

                  <td>{tender.applicants || 0}</td>

                  <td>{formatDate(tender.deadline)}</td>

                  <td>
                    <span className={`status ${tender.status.toLowerCase()}`}>
                      {tender.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="table-button"
                      onClick={() => viewTender(tender)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* SELECTED TENDER */}

      {selectedTender && (
        <section className="dashboard-card selected-tender">
          <p className="section-label">TENDER EVALUATION</p>

          <h2>{selectedTender.title}</h2>

          <p>Contract value: {formatMoney(selectedTender.tender_amount)}</p>

          <p>
            Bid security deposit: {formatMoney(selectedTender.security_deposit)}
          </p>

          <p>Tender deadline: {formatDate(selectedTender.deadline)}</p>

          <p>Applicants: {selectedTender.applicants || 0}</p>

          <h3>Submitted bids</h3>

          {biddersLoading && <p>Loading bidders...</p>}

          {!biddersLoading && bidders.length === 0 && (
            <p>No bids have been submitted yet.</p>
          )}

          {!biddersLoading && bidders.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Contractor</th>
                  <th>Email</th>
                  <th>Bid amount</th>
                  <th>Security deposit</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {bidders.map((bid) => (
                  <tr key={bid.id}>
                    <td>{bid.contractor_name}</td>

                    <td>{bid.contractor_email}</td>

                    <td>{formatMoney(bid.bid_amount)}</td>

                    <td>{formatMoney(bid.security_deposit)}</td>

                    <td>
                      <span className={`status ${bid.status.toLowerCase()}`}>
                        {bid.status}
                      </span>

                      {selectedTender.status === "OPEN" &&
                        bid.status === "PENDING" && (
                          <button
                            className="table-button"
                            onClick={() => selectWinner(bid)}
                            disabled={selectingWinner}
                            style={{ marginLeft: "8px" }}
                          >
                            {selectingWinner ? "Selecting..." : "Select Winner"}
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button
            className="secondary-button"
            onClick={() => {
              setSelectedTender(null);
              setBidders([]);
            }}
          >
            Close details
          </button>
        </section>
      )}
    </DashboardLayout>
  );
}

export default OwnerTenders;
