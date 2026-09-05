import InspectorSurprise from "./pages/InspectorSurprise";
import DisputePage from "./pages/DisputePage";
import InspectorAudits from "./pages/InspectorAudits";
import SubcontractorTreasury from "./pages/SubcontractorTreasury";
import SubcontractorMilestones from "./pages/SubcontractorMilestones";
import ContractorMilestones from "./pages/ContractorMilestones";
import ContractorPayroll from "./pages/ContractorPayroll";
import OwnerMilestones from "./pages/OwnerMilestones";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import OwnerTenders from "./pages/OwnerTenders";
import ContractorTenders from "./pages/ContractorTenders";
import LaborWages from "./pages/LaborWages";
import OwnerDisputes from "./pages/OwnerDisputes";

function Home() {
  return (
    <div>
      <h1>InfraFlow</h1>
      <p>Choose a portal:</p>

      <nav>
        <Link to="/owner/tenders">Project Owner</Link>
        <br />
        <Link to="/contractor/tenders">General Contractor</Link>
        <br />
        <Link to="/labor/wages">Laborer</Link>
      </nav>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/inspector/surprise" element={<InspectorSurprise />} />
        <Route
  path="/contractor/disputes"
  element={
    <DisputePage
      role="General Contractor"
      target="Project Owner"
    />
  }
/>

<Route
  path="/subcontractor/disputes"
  element={
    <DisputePage
      role="Subcontractor"
      target="General Contractor or Project Owner"
    />
  }
/>

<Route
  path="/inspector/disputes"
  element={
    <DisputePage
      role="Public Site Inspector"
      target="General Contractor or Project Owner"
    />
  }
/>

<Route
  path="/labor/disputes"
  element={
    <DisputePage
      role="Laborer"
      target="Subcontractor, Contractor, or Project Owner"
    />
  }
/>
        <Route path="/inspector/audits" element={<InspectorAudits />} />
        <Route
  path="/subcontractor/treasury"
  element={<SubcontractorTreasury />}
/>
        <Route
  path="/subcontractor/milestones"
  element={<SubcontractorMilestones />}
/>
        <Route
  path="/contractor/milestones"
  element={<ContractorMilestones />}
/>
        <Route path="/contractor/payroll" element={<ContractorPayroll />} />
        <Route path="/owner/disputes" element={<OwnerDisputes />} />
        <Route path="/owner/milestones" element={<OwnerMilestones />} />
        <Route path="/" element={<Home />} />
        <Route path="/owner/tenders" element={<OwnerTenders />} />
        <Route path="/contractor/tenders" element={<ContractorTenders />} />
        <Route path="/labor/wages" element={<LaborWages />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;