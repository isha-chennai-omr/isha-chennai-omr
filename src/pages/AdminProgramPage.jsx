import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import programFirebaseService from "../services/program.firebase.service";

export function AdminProgramPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [linkRef, setLinkRef] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;

    setBusy(true);
    programFirebaseService.getProgram(id).then((result) => {
      setBusy(false);
      if (!result.success) {
        setStatus(result.error);
        return;
      }
      const program = result.program;
      setName(program.name || "");
      setStartDate(program.startDate || program.date || "");
      setEndDate(program.endDate || program.date || "");
      setStartTime(program.startTime || "");
      setEndTime(program.endTime || "");
      setDescription(program.description || "");
      setLink(program.link || "");
      setLinkRef(program.linkRef || "");
    });
  }, [editing, id]);

  const createProgram = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const fields = { name, startDate, endDate, startTime, endTime, description, link, linkRef };
    const result = editing ? await programFirebaseService.updateProgram(id, fields) : await programFirebaseService.createProgram(fields);
    setBusy(false);

    if (!result.success) {
      setStatus(result.error);
      return;
    }

    navigate("/admin/programs");
  };

  return (
    <section className="panel admin-panel">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>{editing ? "Edit program" : "Add program"}</h1>
        </div>
        <Link className="secondary-btn admin-back" to="/admin/programs">
          All programs
        </Link>
      </div>

      <form onSubmit={createProgram}>
        <label htmlFor="program-name">Program name</label>
        <input id="program-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Inner Engineering" required />

        <div className="program-field-grid">
          <div>
            <label htmlFor="program-start-date">Start date</label>
            <input id="program-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="program-end-date">End date</label>
            <input id="program-end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="program-start-time">Start time</label>
            <input id="program-start-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="program-end-time">End time</label>
            <input id="program-end-time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
          </div>
        </div>

        <label htmlFor="program-description">Description</label>
        <textarea
          id="program-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="A short invitation for the program"
          rows="3"
        />

        <label htmlFor="program-link">Program link (optional)</label>
        <input
          id="program-link"
          type="url"
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="https://isha.sadhguru.org"
        />

        <label htmlFor="program-link-ref">Linked link ending (optional)</label>
        <input
          id="program-link-ref"
          value={linkRef}
          onChange={(event) => setLinkRef(event.target.value.replace(/\s/g, "_"))}
          placeholder="OMR_SEP_Satsang"
        />

        <button className="generate" type="submit" disabled={busy}>
          {busy ?
            "Saving..."
          : editing ?
            "Save changes"
          : "Add program"}
        </button>
      </form>

      {status && <div className="status">{status}</div>}
    </section>
  );
}
