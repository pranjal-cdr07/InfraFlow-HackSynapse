import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import InspectorSurprise from "./pages/InspectorSurprise";
import DisputePage from "./pages/DisputePage";
import InspectorAudits from "./pages/InspectorAudits";
import SubcontractorTreasury from "./pages/SubcontractorTreasury";
import SubcontractorMilestones from "./pages/SubcontractorMilestones";
import ContractorMilestones from "./pages/ContractorMilestones";
import ContractorPayroll from "./pages/ContractorPayroll";
import OwnerMilestones from "./pages/OwnerMilestones";
import OwnerTenders from "./pages/OwnerTenders";
import ContractorTenders from "./pages/ContractorTenders";
import LaborWages from "./pages/LaborWages";
import OwnerDisputes from "./pages/OwnerDisputes";

function Home() {
  const roles = [
    {
      title: "Project Owner",
      description: "Publish tenders, track milestones, and resolve disputes.",
      path: "/owner/tenders",
    },
    {
      title: "General Contractor",
      description: "Browse tenders, set payroll rules, and verify work.",
      path: "/contractor/tenders",
    },
    {
      title: "Subcontractor",
      description: "Upload work proof and track payments.",
      path: "/subcontractor/milestones",
    },
    {
      title: "Public Site Inspector",
      description: "Complete site inspections and submit evidence.",
      path: "/inspector/audits",
    },
    {
      title: "Laborer",
      description: "View direct wages and raise support requests.",
      path: "/labor/wages",
    },
  ];

  return (
    <main className="home-page">
      <header className="home-header">
        <h1>InfraFlow</h1>
        <span>Demo Mode</span>
      </header>

      <section className="home-hero">
        <p className="section-label">BLOCKCHAIN INFRASTRUCTURE FINANCE</p>
        <h2>Build trust into every milestone.</h2>
        <p>
          Manage construction tenders, verification, payment flows, and
          accountability in one shared workspace.
        </p>
      </section>

      <section className="portal-grid">
        {roles.map((role) => (
          <Link className="portal-card" to={role.path} key={role.title}>
            <p className="section-label">OPEN PORTAL</p>
            <h3>{role.title}</h3>
            <p>{role.description}</p>
            <strong>Enter workspace →</strong>
          </Link>
        ))}
      </section>
    </main>
  );
}

const roleNames = {
  owner: "Project Owner",
  contractor: "General Contractor",
  subcontractor: "Subcontractor",
  inspector: "Public Site Inspector",
  labor: "Laborer",
};

function ProtectedRoute({ authenticatedRoles, children }) {
  const location = useLocation();
  const roleKey = location.pathname.split("/")[1];

  if (!authenticatedRoles[roleKey]) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function Login({ onLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const destination = location.state?.from || "/";
  const roleKey = destination.split("/")[1];
  const role = roleNames[roleKey] || "InfraFlow";

  function handleLogin(event) {
    event.preventDefault();

    if (!userId.trim() || !password.trim()) {
      setError("Enter both your ID and password to continue.");
      return;
    }

    onLogin(roleKey);
    navigate(destination, { replace: true });
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <Link className="login-logo" to="/">InfraFlow</Link>
        <p className="section-label">SECURE PORTAL ACCESS</p>
        <h1>Sign in to {role}</h1>
        <p className="login-copy">
          Use any ID and password for this frontend demo.
        </p>

        <form onSubmit={handleLogin}>
          <label>
            User ID
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Enter your user ID"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button className="primary-button login-button" type="submit">
            Sign in
          </button>
        </form>

        <Link className="login-back" to="/">← Return to portal selection</Link>
      </section>
    </main>
  );
}

function App() {
  const [authenticatedRoles, setAuthenticatedRoles] = useState({});

  function protect(page) {
    return (
      <ProtectedRoute authenticatedRoles={authenticatedRoles}>
        {page}
      </ProtectedRoute>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Login
              onLogin={(roleKey) =>
                setAuthenticatedRoles((currentRoles) => ({
                  ...currentRoles,
                  [roleKey]: true,
                }))
              }
            />
          }
        />
        <Route path="/inspector/surprise" element={protect(<InspectorSurprise />)} />
        <Route
  path="/contractor/disputes"
  element={
    protect(<DisputePage
      role="General Contractor"
      target="Project Owner"
    />)
  }
/>

<Route
  path="/subcontractor/disputes"
  element={
    protect(<DisputePage
      role="Subcontractor"
      target="General Contractor or Project Owner"
    />)
  }
/>

<Route
  path="/inspector/disputes"
  element={
    protect(<DisputePage
      role="Public Site Inspector"
      target="General Contractor or Project Owner"
    />)
  }
/>

<Route
  path="/labor/disputes"
  element={
    protect(<DisputePage
      role="Laborer"
      target="Subcontractor, Contractor, or Project Owner"
    />)
  }
/>
        <Route path="/inspector/audits" element={protect(<InspectorAudits />)} />
        <Route
  path="/subcontractor/treasury"
  element={protect(<SubcontractorTreasury />)}
/>
        <Route
  path="/subcontractor/milestones"
  element={protect(<SubcontractorMilestones />)}
/>
        <Route
  path="/contractor/milestones"
  element={protect(<ContractorMilestones />)}
/>
        <Route path="/contractor/payroll" element={protect(<ContractorPayroll />)} />
        <Route path="/owner/disputes" element={protect(<OwnerDisputes />)} />
        <Route path="/owner/milestones" element={protect(<OwnerMilestones />)} />
        <Route path="/" element={<Home />} />
        <Route path="/owner/tenders" element={protect(<OwnerTenders />)} />
        <Route path="/contractor/tenders" element={protect(<ContractorTenders />)} />
        <Route path="/labor/wages" element={protect(<LaborWages />)} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
