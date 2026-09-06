import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import programFirebaseService from "../services/program.firebase.service";

function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`));
}

export function AdminProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [status, setStatus] = useState("Loading programs...");

  const loadPrograms = async () => {
    setStatus("Loading programs...");
    const result = await programFirebaseService.listPrograms();
    if (!result.success) {
      setStatus(result.error);
      return;
    }
    setPrograms(result.programs);
    setStatus(result.programs.length ? "" : "No programs created yet.");
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  return (
    <section className="panel admin-panel">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Programs</h1>
        </div>
        <div className="admin-actions">
          <button className="check" onClick={loadPrograms}>
            Refresh
          </button>
          <Link className="generate admin-new-link" to="/admin/program">
            Add program
          </Link>
        </div>
      </div>

      {status && <div className="status">{status}</div>}
      <div className="program-admin-list">
        {programs.map((program) => (
          <article className="program-admin-row" key={program.id}>
            <div>
              <strong>{program.name}</strong>
              {program.description && <p>{program.description}</p>}
            </div>
            <time dateTime={program.startDate || program.date}>
              {formatDate(program.startDate || program.date)} {program.startTime || ""} - {formatDate(program.endDate || program.date)}{" "}
              {program.endTime || ""}
            </time>
          </article>
        ))}
      </div>
    </section>
  );
}
