import DashboardLayout from "../components/DashboardLayout";

function OwnerMilestones() {
  const milestones = [
    {
      name: "Foundation and groundworks",
      progress: 100,
      status: "Payment released",
    },
    {
      name: "Structural frame",
      progress: 78,
      status: "Under verification",
    },
    {
      name: "Envelope and MEP",
      progress: 22,
      status: "Scheduled",
    },
  ];

  return (
    <DashboardLayout title="Project Milestones & Activity">
      <section className="stats-grid">
        

        <article className="stat-card">
          <p>Budget disbursed</p>
          <h2>₹12.28 Cr</h2>
        </article>

        <article className="stat-card">
          <p>Retainage locked</p>
          <h2>₹1.36 Cr</h2>
        </article>
      </section>

      

      <section className="dashboard-card">
        <p className="section-label">AUTOMATED SETTLEMENT ACTIVITY</p>
        <h2>Recent activity</h2>

        <div className="activity-item">
          <span className="activity-dot success"></span>
          <div>
            <strong>Foundation milestone completed</strong>
            <p>₹1.49 Cr released to subcontractor.</p>
          </div>
        </div>

        <div className="activity-item">
          <span className="activity-dot pending"></span>
          <div>
            <strong>Structural frame inspection received</strong>
            <p>Waiting for General Contractor verification.</p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

export default OwnerMilestones;