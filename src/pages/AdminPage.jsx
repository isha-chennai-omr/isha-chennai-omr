import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import linkFirebaseService from "../services/link.firebase.service";

export function AdminPage() {
  const [links, setLinks] = useState([]);
  const [status, setStatus] = useState("Loading links...");
  const [copiedId, setCopiedId] = useState("");

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

  const copyLink = async (slug) => {
    const url = `${window.location.origin}/p/${encodeURIComponent(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(slug);
      window.setTimeout(() => setCopiedId((current) => (current === slug ? "" : current)), 1800);
    } catch {
      setStatus("Unable to copy the link. Please copy it from the address bar.");
    }
  };

  const deleteLink = async (slug) => {
    if (!window.confirm(`Delete the link "${slug}"?`)) return;

    setStatus("Deleting link...");
    const result = await linkFirebaseService.deleteLink(slug);
    if (!result.success) {
      setStatus(result.error);
      return;
    }

    setLinks((current) => current.filter((link) => link.id !== slug));
    setStatus("Link deleted.");
  };

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
          <div className="link-row" key={link.id}>
            <strong>{link.name || link.id}</strong>
            <span>{link.link || "No destination"}</span>
            <div className="link-row-actions">
              <Link className="link-row-button" to={`/admin/link/${encodeURIComponent(link.id)}`}>
                Edit
              </Link>
              <button className="link-row-button" onClick={() => copyLink(link.id)}>
                {copiedId === link.id ? "Copied" : "Copy link"}
              </button>
              <button className="link-row-button link-row-delete" onClick={() => deleteLink(link.id)}>
                Delete link
              </button>
            </div>
            <a className="link-row-public" href={`/p/${encodeURIComponent(link.id)}`} target="_blank" rel="noreferrer">
              {window.location.origin}/p/{encodeURIComponent(link.id)}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
