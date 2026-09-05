import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { tenders as initialTenders } from "../data/tenders";

function OwnerTenders() {
  const [tenderList, setTenderList] = useState(initialTenders);
  const [selectedTender, setSelectedTender] = useState(null);

  const [project, setProject] = useState("");
  const [amount, setAmount] = useState("");
  const [deposit, setDeposit] = useState("");

  function postTender() {
    if (project === "" || amount === "" || deposit === "") {
      alert("Please fill in all tender details.");
      return;
    }

    const newTender = {
      id: Date.now(),
      project: project,
      amount: amount,
      deposit: deposit,
      applicants: 0,
      deadline: "14 days remaining",
      status: "Open",
    };

    setTenderList([newTender, ...tenderList]);

    setProject("");
    setAmount("");
    setDeposit("");

    alert("Tender posted successfully.");
  }

  function viewTender(tender) {
    setSelectedTender(tender);
  }

  return (
    <DashboardLayout title="Tender Publishing & Awards">
      <section className="stats-grid">
        <article className="stat-card">
          <p>Active tenders</p>
          <h2>{tenderList.length}</h2>
        </article>

        <article className="stat-card">
          <p>Capital committed</p>
          <h2>₹19.9 Cr</h2>
        </article>

        <article className="stat-card">
          <p>Security pool</p>
          <h2>₹23.7 L</h2>
        </article>
      </section>

      <section className="dashboard-card">
        <p className="section-label">STEP 01 · TENDER PUBLICATION</p>
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

        <button className="primary-button" onClick={postTender}>
          Post tender
        </button>
      </section>

      <section className="dashboard-card tender-directory">
        <p className="section-label">ACTIVE TENDERS</p>
        <h2>Tender directory</h2>

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
                <td>{tender.project}</td>
                <td>{tender.amount}</td>
                <td>{tender.applicants}</td>
                <td>{tender.deadline}</td>
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
      </section>

      {selectedTender && (
        <section className="dashboard-card selected-tender">
          <p className="section-label">SELECTED TENDER</p>
          <h2>{selectedTender.project}</h2>
          <p>Contract value: {selectedTender.amount}</p>
          <p>Bid security deposit: {selectedTender.deposit}</p>
          <p>Applicants: {selectedTender.applicants}</p>

          <button
            className="secondary-button"
            onClick={() => setSelectedTender(null)}
          >
            Close details
          </button>
        </section>
      )}
    </DashboardLayout>
  );
}

export default OwnerTenders;