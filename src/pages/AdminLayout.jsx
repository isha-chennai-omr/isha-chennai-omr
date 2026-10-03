import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
      <header className="admin-nav">
        <div>
          <span className="eyebrow">Admin</span>
          <strong className="admin-brand">Link manager</strong>

          {user?.email && <div className="admin-user">{user.email}</div>}
        </div>

        <nav className="admin-tabs" aria-label="Admin sections">
          <NavLink to="/admin/links">Links</NavLink>
          <NavLink to="/admin/programs">Programs</NavLink>

          <button type="button" className="link-row-button" onClick={logout}>
            Sign out
          </button>
        </nav>
      </header>

      <Outlet />
    </main>
  );
}
