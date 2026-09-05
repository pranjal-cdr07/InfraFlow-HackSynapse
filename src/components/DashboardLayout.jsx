import Sidebar from "./Sidebar";

function DashboardLayout({ title, children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p>InfraFlow Workspace</p>
            <h1>{title}</h1>
          </div>

          <button>Demo Mode</button>
        </header>

        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;