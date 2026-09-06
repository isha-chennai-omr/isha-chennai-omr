import { useEffect, useState } from "react";

import programFirebaseService from "../services/program.firebase.service";

function formatProgramDate(date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`));
}

function formatProgramSchedule(program) {
  const startDate = program.startDate || program.date;
  const endDate = program.endDate || startDate;
  const start = `${formatProgramDate(startDate)}${program.startTime ? `, ${program.startTime}` : ""}`;
  const end = `${formatProgramDate(endDate)}${program.endTime ? `, ${program.endTime}` : ""}`;
  return start === end ? start : `${start} - ${end}`;
}

function isUpcomingProgram(program) {
  const startDate = program.startDate || program.date;
  if (!startDate) return false;

  const startTime = program.startTime || "00:00";
  return new Date(`${startDate}T${startTime}:00`) > new Date();
}

export function HomePage() {
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    programFirebaseService.listPrograms().then((result) => {
      if (result.success) {
        setPrograms(result.programs.filter(isUpcomingProgram));
      }
    });
  }, []);

  return (
    <main className="home-shell">
      <section className="home-hero">
        <div className="home-copy">
          <p className="home-kicker">ISHA CHENNAI · OMR</p>
          <h1>Share your moments with a calmer, more beautiful connection.</h1>
          <p className="home-subtitle">
            Create thoughtful event links that open with an image preview, a clear message, and a spiritual sense of presence.
          </p>
        </div>

        <div className="home-visual" aria-label="Preview card illustration">
          <div className="preview-card">
            <div className="preview-badge">LIVE EVENT</div>
            <div className="preview-image" />
            <div className="preview-content">
              <span className="meta">Isha Chennai OMR</span>
              <h2>Inner Awakening</h2>
              <p>Join us for a mindful evening of meditation, presence, and connection.</p>
            </div>
          </div>
        </div>
      </section>

      {programs.length > 0 && (
        <section className="programs-section">
          <div className="programs-heading">
            <p className="home-kicker">UPCOMING</p>
            <h2>Programs and gatherings</h2>
          </div>
          <div className="program-grid">
            {programs.map((program) => {
              const content = (
                <>
                  <time dateTime={program.startDate || program.date}>{formatProgramSchedule(program)}</time>
                  <h3>{program.name}</h3>
                  {program.description && <p className="program-description">{program.description.trim()}</p>}
                  {program.destination && <span className="program-card-action">Learn more</span>}
                </>
              );

              return program.destination ?
                  <a className="program-card" href={program.destination} target="_blank" rel="noreferrer" key={program.id}>
                    {content}
                  </a>
                : <article className="program-card" key={program.id}>
                    {content}
                  </article>;
            })}
          </div>
        </section>
      )}
    </main>
  );
}
