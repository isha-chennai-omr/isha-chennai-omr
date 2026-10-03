import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function AdminRoute() {
  const { loading, user, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="admin-page">
        <section className="panel">
          <div className="status">Checking authentication...</div>
        </section>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <main className="admin-page">
        <section className="panel admin-panel">
          <span className="eyebrow">Admin</span>
          <h1>Access denied</h1>
          <p>Your Google account is authenticated, but it isn't registered as an administrator.</p>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
