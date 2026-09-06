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

  const deleteProgram = async (program) => {
    if (!window.confirm(`Delete the program "${program.name}"?`)) return;

    setStatus("Deleting program...");
    const result = await programFirebaseService.deleteProgram(program.id);
    if (!result.success) {
      setStatus(result.error);
      return;
    }

    setPrograms((current) => current.filter((item) => item.id !== program.id));
    setStatus("Program deleted.");
  };

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
            </div>
            <time dateTime={program.startDate || program.date}>
              {formatDate(program.startDate || program.date)} {program.startTime || ""} - {formatDate(program.endDate || program.date)}{" "}
              {program.endTime || ""}
            </time>
            <div className="program-admin-actions">
              <Link className="link-row-button" to={`/admin/program/${encodeURIComponent(program.id)}`}>
                Edit
              </Link>
              <button className="link-row-button link-row-delete" onClick={() => deleteProgram(program)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
