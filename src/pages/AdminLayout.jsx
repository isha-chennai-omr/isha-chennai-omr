import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import sadhguruImage from "../assets/Sadhguru-Image.jpg";

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  const logout = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <main className="admin-page">
      <button
        type="button"
        className="admin-menu-button"
        aria-label={navOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={navOpen}
        onClick={() => setNavOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      {navOpen && (
        <button
          type="button"
          className="admin-nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside className={`admin-nav ${navOpen ? "is-open" : ""}`}>
        <nav className="admin-tabs" aria-label="Admin sections">
          <NavLink to="/admin/links" onClick={() => setNavOpen(false)}>
            Links
          </NavLink>
          <NavLink to="/admin/programs" onClick={() => setNavOpen(false)}>
            Programs
          </NavLink>

          <button type="button" className="link-row-button" onClick={logout}>
            Sign out
          </button>
        </nav>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div className="admin-title">
            <img className="admin-avatar" src={sadhguruImage} alt="Sadhguru" />

            <div>
              <span className="eyebrow">Admin</span>
              <strong className="admin-brand">ISHA Chennai OMR</strong>

              {user?.email && <div className="admin-user">{user.email}</div>}
            </div>
          </div>
        </header>

        <Outlet />
      </section>
    </main>
  );
}
