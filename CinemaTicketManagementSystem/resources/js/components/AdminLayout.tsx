import { NavLink, Outlet, useNavigate } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "⌂" },
  { label: "Movies", path: "/admin/movies", icon: "▣" },
  { label: "Cinemas", path: "/admin/cinemas", icon: "▤" },
  { label: "Bookings", path: "/admin/bookings", icon: "▥" },
  { label: "Users", path: "/admin/users", icon: "♙" },
  { label: "Reports", path: "/admin/reports", icon: "◒" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const userType = localStorage.getItem("admin_user_type");

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user_type");
    localStorage.removeItem("admin_user_id");
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img className="sidebar-logo" src="/cinema-logo.svg" alt="Cinema" />
          <span className="sidebar-title">Cinema Admin</span>
        </div>
        <nav className="sidebar-nav" aria-label="Admin navigation">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
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
            <div className="avatar">A</div>
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
