import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

interface AdminNotification {
  notificationId: number;
  paymentId: number | null;
  title: string;
  message: string;
  created_at: string;
}

const formatNotificationDate = (date: string) => new Date(date).toLocaleString("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const menuItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "⌂" },
  { label: "Movies", path: "/admin/movies", icon: "▣" },
  { label: "Cinemas", path: "/admin/cinemas", icon: "▤" },
  { label: "Seats", path: "/admin/seats", icon: "▦" },
  { label: "Bookings", path: "/admin/bookings", icon: "▥" },
  { label: "Payments", path: "/admin/payments", icon: "◉" },
  { label: "Payment Methods", path: "/admin/payment-methods", icon: "$" },
  { label: "Users", path: "/admin/users", icon: "♙" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = localStorage.getItem("admin_user_type");
  const isSuperadmin = userType === "3";
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(location.pathname === "/admin/reports");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationError, setNotificationError] = useState("");

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
    if (location.pathname === "/admin/reports") setReportsOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) return undefined;

    const loadNotifications = async () => {
      try {
        const response = await api.get("/admin/notifications");
        setNotifications(Array.isArray(response.data) ? response.data : []);
        setNotificationError("");
      } catch {
        setNotificationError("Unable to load admin notifications.");
      }
    };

    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const openNotification = async (notification: AdminNotification) => {
    try {
      await api.patch(`/admin/notifications/${notification.notificationId}/read`);
      setNotifications((current) => current.filter((item) => item.notificationId !== notification.notificationId));
      setNotificationError("");
      setNotificationsOpen(false);
      navigate(notification.paymentId ? "/admin/payments" : "/admin/bookings");
    } catch {
      setNotificationError("Unable to open this notification. Please try again.");
    }
  };

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
            {reportsOpen && <div className="sidebar-submenu"><NavLink to="/admin/reports" className={({ isActive }) => `sidebar-link sidebar-submenu-link${isActive ? " active" : ""}`}><span className="sidebar-icon">◒</span><span>Reports overview</span></NavLink></div>}
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
            <div className="notification-menu">
              <button
                className="notification-bell"
                type="button"
                aria-label={`Admin notifications${notifications.length ? `, ${notifications.length} unread` : ""}`}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <span className="notification-bell-icon" aria-hidden="true">🔔</span>
                {notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}
              </button>
              {notificationsOpen && <div className="profile-notifications">
                <div className="notification-dropdown-head"><strong>Admin notifications</strong><small>{notifications.length} unread</small></div>
                {notificationError && <p className="notification-error" role="alert">{notificationError}</p>}
                {notifications.length === 0 && !notificationError && <p className="notification-empty">No unread notifications.</p>}
                {notifications.map((notification) => <button
                  className="notification-item unread"
                  type="button"
                  key={notification.notificationId}
                  onClick={() => void openNotification(notification)}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <small>{formatNotificationDate(notification.created_at)}</small>
                </button>)}
              </div>}
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
