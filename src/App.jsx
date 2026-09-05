import "./index.css";

const roles = [
  {
    name: "Project Owner",
    description: "Manage tenders, milestones, disputes and audit records.",
  },
  {
    name: "General Contractor",
    description: "Bid on tenders, manage payroll and verify milestones.",
  },
  {
    name: "Subcontractor",
    description: "Upload work proof and track payments.",
  },
  {
    name: "Public Site Inspector",
    description: "Review assigned inspections and submit evidence.",
  },
  {
    name: "Laborer",
    description: "Track direct wages and raise support requests.",
  },
];

function App() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <h1>InfraFlow</h1>
        <button>Demo Mode</button>
      </header>

      <section className="hero">
        <p className="eyebrow">BLOCKCHAIN INFRASTRUCTURE FINANCE</p>
        <h2>Build trust into every milestone.</h2>
        <p>
          A single platform for transparent construction funding,
          verification, and payment tracking.
        </p>
      </section>

      <section className="role-grid">
        {roles.map((role) => (
          <article className="role-card" key={role.name}>
            <h3>{role.name}</h3>
            <p>{role.description}</p>
            <button>Open portal →</button>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;