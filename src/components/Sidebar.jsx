import { Link, useLocation } from "react-router-dom";

const roleMenus = {
  owner: {
    title: "Project Owner",
    links: [
      { name: "Tenders & Awards", path: "/owner/tenders" },
      { name: "Milestones & Activity", path: "/owner/milestones" },
      { name: "Disputes & Audit Trail", path: "/owner/disputes" },
    ],
  },

  contractor: {
    title: "General Contractor",
    links: [
      { name: "Tender Discovery & Bids", path: "/contractor/tenders" },
      { name: "Payroll & Trade Setup", path: "/contractor/payroll" },
      { name: "Milestones & Inspections", path: "/contractor/milestones" },
      { name: "Disputes & Rule Changes", path: "/contractor/disputes" },
    ],
  },

  subcontractor: {
    title: "Subcontractor",
    links: [
      { name: "Milestones & Work Proof", path: "/subcontractor/milestones" },
      { name: "Earnings & Retainage", path: "/subcontractor/treasury" },
      { name: "Disputes & Rule Changes", path: "/subcontractor/disputes" },
    ],
  },

  inspector: {
    title: "Public Site Inspector",
    links: [
      { name: "Assigned Inspections", path: "/inspector/audits" },
      { name: "Surprise Audits", path: "/inspector/surprise" },
      { name: "Disputes & Rule Changes", path: "/inspector/disputes" },
    ],
  },

  labor: {
    title: "Laborer",
    links: [
      { name: "Direct Wages", path: "/labor/wages" },
      { name: "Support & Disputes", path: "/labor/disputes" },
    ],
  },
};

function Sidebar() {
  const location = useLocation();

  const role = location.pathname.split("/")[1];
  const menu = roleMenus[role];

  if (!menu) {
    return null;
  }

  return (
    <aside className="sidebar">
      <Link className="logo-link" to="/">
        InfraFlow
      </Link>

      <p className="sidebar-label">{menu.title} Portal</p>

      <nav className="sidebar-nav">
        {menu.links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={location.pathname === link.path ? "active-link" : ""}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      <Link className="back-home" to="/">
        ← Switch portal
      </Link>
    </aside>
  );
}

export default Sidebar;