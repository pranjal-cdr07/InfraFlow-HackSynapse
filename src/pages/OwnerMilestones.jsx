import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

const API = "http://localhost:5000/api";

function OwnerMilestones() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("infraflowUser") || "null");

    if (!user?.id) return;

    fetch(`${API}/notifications/${user.id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load notifications");
        }

        return response.json();
      })
      .then((data) => {
        const refunds = data.filter(
          (notification) =>
            notification.type === "SECURITY_DEPOSIT_REFUND" ||
            notification.message?.toLowerCase().includes("security deposit"),
        );

        setNotifications(refunds.slice(0, 5));
      })
      .catch((error) => {
        console.error("Failed to load owner activity:", error);
      });
  }, []);

  return (
    <DashboardLayout title="Project Milestones & Activity">
      <section className="stats-grid">
        <article className="stat-card">
          <p>Physical completion</p>
          <h2>68%</h2>
        </article>

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

        {notifications.length === 0 ? (
          <div className="activity-item">
            <span className="activity-dot pending"></span>
            <div>
              <strong>No refund activity yet</strong>
              <p>
                Security deposit refunds will appear here when losing bidders
                are refunded.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notification) => (
            <div className="activity-item" key={notification.id}>
              <span className="activity-dot success"></span>

              <div>
                <strong>Security deposit refunded</strong>
                <p>{notification.message}</p>
              </div>
            </div>
          ))
        )}
      </section>
    </DashboardLayout>
  );
}

export default OwnerMilestones;
