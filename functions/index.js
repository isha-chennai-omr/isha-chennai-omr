const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

exports.linkPreview = onRequest(
  { region: "asia-south1", cors: false },
  async (req, res) => {
    const match = req.path.match(/^\/p\/([^/]+)\/?$/);
    if (!match) return res.status(404).send("Not found");

    const slug = decodeURIComponent(match[1]);
    const snap = await db.collection("links").doc(slug).get();

    if (!snap.exists) return res.status(404).send("Link not found");

    const data = snap.data();
    const title = data.title || "Link Preview";
    const description = data.description || "Open this link";
    const landingUrl = data.landingUrl;
    const imageUrl = data.imageUrl;
    const canonical = `${req.protocol}://${req.get("host")}/p/${encodeURIComponent(slug)}`;

    res.set("Cache-Control", "public, max-age=300, s-maxage=300");
    res.status(200).send(
`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${esc(imageUrl)}">
    <meta property="og:url" content="${esc(canonical)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${esc(imageUrl)}">
    <meta http-equiv="refresh" content="0;url=${esc(landingUrl)}">
  </head>
  <body>
    <p>Redirecting…</p>
    <script>window.location.replace(${JSON.stringify(landingUrl)});</script>
  </body>
</html>`);
  }
);
