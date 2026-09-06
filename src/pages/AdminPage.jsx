import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import linkFirebaseService from "../services/link.firebase.service";

export function AdminPage() {
  const [links, setLinks] = useState([]);
  const [status, setStatus] = useState("Loading links...");

  const loadLinks = async () => {
    setStatus("Loading links...");
    const result = await linkFirebaseService.listLinks();
    if (!result.success) {
      setStatus(result.error);
      return;
    }
    setLinks(result.links);
    setStatus(result.links.length ? "" : "No links created yet.");
  };

  useEffect(() => {
    loadLinks();
  }, []);

  return (
    <section className="panel admin-list-panel">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Links</h1>
        </div>
        <div className="admin-actions">
          <button className="check" onClick={loadLinks}>
            Refresh
          </button>
          <Link className="generate admin-new-link" to="/admin/link">
            New link
          </Link>
        </div>
      </div>

      {status && <div className="status">{status}</div>}
      <div className="link-list">
        {links.map((link) => (
          <Link className="link-row" to={`/admin/link/${encodeURIComponent(link.id)}`} key={link.id}>
            <strong>{link.name || link.id}</strong>
            <span>{link.link || "No destination"}</span>
            <span className="link-row-arrow">Edit</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
