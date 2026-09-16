import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "⌂" },
  { label: "Movies", path: "/admin/movies", icon: "▣" },
  { label: "Cinemas", path: "/admin/cinemas", icon: "▤" },
  { label: "Seats", path: "/admin/seats", icon: "▦" },
  { label: "Bookings", path: "/admin/bookings", icon: "▥" },
  { label: "Payment Methods", path: "/admin/payment-methods", icon: "$" },
  { label: "Users", path: "/admin/users", icon: "♙" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = localStorage.getItem("admin_user_type");
  const isSuperadmin = userType === "3";
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(location.pathname === "/admin/payments");

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user_type");
    localStorage.removeItem("admin_user_id");
    navigate("/admin/login", { replace: true });
  };

  useEffect(() => {
    if (!profileOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [profileOpen]);

  useEffect(() => {
    if (location.pathname === "/admin/payments") setReportsOpen(true);
  }, [location.pathname]);

  const menuPath = (item: (typeof menuItems)[number]) => {
    if (item.label !== "Users") return item.path;
    return isSuperadmin ? "/admin/users?type=admins" : "/admin/users?type=users";
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img className="sidebar-logo" src="/cinema-logo.svg" alt="Cinema" />
          <span className="sidebar-title">Cinema Admin</span>
        </div>
        <nav className="sidebar-nav" aria-label="Admin navigation">
          {menuItems.map((item) => <NavLink key={item.path} to={menuPath(item)} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}><span className="sidebar-icon">{item.icon}</span><span>{item.label}</span></NavLink>)}
          <div className={`sidebar-menu-group${reportsOpen ? " open" : ""}`}>
            <button className={`sidebar-link sidebar-menu-toggle${location.pathname === "/admin/reports" ? " active" : ""}`} type="button" aria-expanded={reportsOpen} onClick={() => setReportsOpen((open) => !open)}><span className="sidebar-icon">◒</span><span>Reports</span><span className="sidebar-chevron" aria-hidden="true">{reportsOpen ? "▾" : "▸"}</span></button>
            {reportsOpen && <div className="sidebar-submenu"><NavLink to="/admin/reports" className={({ isActive }) => `sidebar-link sidebar-submenu-link${isActive ? " active" : ""}`}><span className="sidebar-icon">◒</span><span>Reports overview</span></NavLink><NavLink to="/admin/payments" className={({ isActive }) => `sidebar-link sidebar-submenu-link${isActive ? " active" : ""}`}><span className="sidebar-icon">$</span><span>Payments</span></NavLink></div>}
          </div>
        </nav>
        <button className="sidebar-logout" type="button" onClick={logout}>
          <span>↪</span> Sign out
        </button>
      </aside>

      <div className="main-wrapper">
        <header className="top-header">
          <div>
            <p className="header-kicker">Cinema ticket management</p>
            <p className="header-greeting">Administrator workspace</p>
          </div>
          <div className="header-right">
            <span className="role-badge">{userType === "3" ? "Superadmin" : "Admin"}</span>
            <div className="admin-profile-menu">
              <button className="avatar" type="button" aria-label="Open admin profile menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>A</button>
              {profileOpen && <div className="admin-profile-dropdown"><button type="button" onClick={() => setProfileOpen(false)}>Profile</button><button type="button" onClick={() => setProfileOpen(false)}>Settings</button><button type="button" onClick={logout}>Sign out</button></div>}
            </div>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
