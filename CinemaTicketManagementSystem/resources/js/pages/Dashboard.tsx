import { Link } from "react-router-dom";

const Dashboard = () => (
  <div className="page-container">
    <div className="page-head dashboard-welcome">
      <div>
        <p className="eyebrow">Overview</p>
        <h1>Admin dashboard</h1>
        <p className="page-sub">Keep your cinema catalog and daily operations moving.</p>
      </div>
      <div className="dashboard-date">September 08, 2026</div>
    </div>

    <section className="stat-grid">
      <article className="stat-card stat-blue"><span className="stat-icon">▣</span><div><p>Total movies</p><strong>05</strong></div><span className="stat-note">Catalog</span></article>
      <article className="stat-card stat-orange"><span className="stat-icon">▤</span><div><p>Cinemas</p><strong>02</strong></div><span className="stat-note">Locations</span></article>
      <article className="stat-card stat-green"><span className="stat-icon">▥</span><div><p>Bookings</p><strong>24</strong></div><span className="stat-note">This month</span></article>
      <article className="stat-card stat-purple"><span className="stat-icon">♙</span><div><p>Admin users</p><strong>02</strong></div><span className="stat-note">Active</span></article>
    </section>

    <section className="dashboard-grid">
      <div className="card activity-card"><div className="section-title"><div><p className="eyebrow">Shortcuts</p><h2>Manage your cinema</h2></div></div><div className="quick-actions"><Link to="/admin/movies" className="quick-action"><span>▣</span><div><strong>Movies</strong><small>Manage catalog and titles</small></div><b>→</b></Link><Link to="/admin/cinemas" className="quick-action"><span>▤</span><div><strong>Cinemas</strong><small>Manage halls and locations</small></div><b>→</b></Link><Link to="/admin/bookings" className="quick-action"><span>▥</span><div><strong>Bookings</strong><small>Review customer bookings</small></div><b>→</b></Link></div></div>
      <div className="card notice-card"><p className="eyebrow">System status</p><h2>Everything is ready</h2><p>Use the menu to manage your catalog, users, bookings, and reports.</p><div className="status-line"><span className="status-dot" />All services operational</div></div>
    </section>
  </div>
);

export default Dashboard;
