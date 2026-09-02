import React from "react";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Elevated event links",
    text: "Create polished, shareable preview links for satsangs, events, and community moments.",
  },
  {
    title: "Instant social preview",
    text: "Upload an image and generate a clean link that presents beautifully before the destination opens.",
  },
  {
    title: "Built for community",
    text: "Designed for Isha-inspired communication with warm visuals, simple flow, and a calm, focused experience.",
  },
];

const stats = [
  { value: "1-click", label: "link generation" },
  { value: "8 MB", label: "image limit" },
  { value: "JPG/PNG/WebP", label: "supported formats" },
];

export function HomePage() {
  return (
    <main className="home-shell">
      <section className="home-hero">
        <div className="home-copy">
          <p className="home-kicker">ISHA CHENNAI · OMR</p>
          <h1>Share your moments with a calmer, more beautiful connection.</h1>
          <p className="home-subtitle">
            Create thoughtful event links that open with an image preview, a clear message, and a spiritual sense of presence.
          </p>

          <div className="home-actions">
            <Link to="/link_generator" className="primary-btn">
              Create Link
            </Link>
            <a href="#features" className="secondary-btn">
              Explore
            </a>
          </div>

          <div className="home-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="home-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
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

      <section id="features" className="home-features">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <div className="feature-icon">✦</div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
