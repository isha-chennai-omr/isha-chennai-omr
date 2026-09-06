import { NavLink, Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <main className="admin-page">
      <header className="admin-nav">
        <div>
          <span className="eyebrow">Admin</span>
          <strong className="admin-brand">Link manager</strong>
        </div>
        <nav className="admin-tabs" aria-label="Admin sections">
          <NavLink to="/admin/links">Links</NavLink>
          <NavLink to="/admin/programs">Programs</NavLink>
        </nav>
      </header>
      <Outlet />
    </main>
  );
}
