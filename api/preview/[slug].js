import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const faviconPath = "/favicon.ico?v=2";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

export default async function handler(req, res) {
  try {
    const slug = decodeURIComponent(req.query.slug || "").trim();

    if (!slug) {
      return res.status(400).send("Missing slug");
    }

    const { data: link, error } = await supabase
      .from("links")
      .select("slug, name, title, description, landing_url, image_path")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).send("Failed to load link");
    }

    if (!link) {
      return res.status(404).send("Link not found");
    }

    const title = link.title || link.name || slug;
    const description = link.description || "";

    let imageUrl = "";

    if (link.image_path) {
      const { data } = supabase.storage.from("preview-images").getPublicUrl(link.image_path);

      imageUrl = data?.publicUrl || "";
    }

    const landingUrl = new URL(link.landing_url);

    if (!["http:", "https:"].includes(landingUrl.protocol)) {
      return res.status(400).send("Invalid destination URL");
    }

    const host = req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || "https";

    const previewUrl = `${protocol}://${host}/p/${encodeURIComponent(slug)}`;

    const safePageTitle = escapeHtml(`ISHA OMR - ${title}`);
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const safeImageUrl = escapeAttribute(imageUrl);
    const safePreviewUrl = escapeAttribute(previewUrl);
    const safeLandingUrl = JSON.stringify(landingUrl.toString());
    const safeFaviconUrl = escapeAttribute(`${protocol}://${host}${faviconPath}`);

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");

    res.setHeader("Content-Type", "text/html; charset=utf-8");

    return res.status(200).send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=${safeLandingUrl}" />

  <title>${safePageTitle}</title>
  <link rel="icon" type="image/vnd.microsoft.icon" href="${safeFaviconUrl}" />
  <link rel="shortcut icon" href="${safeFaviconUrl}" />

  <meta
    name="description"
    content="${safeDescription}"
  />

  <meta property="og:type" content="website" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:url" content="${safePreviewUrl}" />

  ${
    safeImageUrl ?
      `
  <meta property="og:image" content="${safeImageUrl}" />
  <meta property="og:image:secure_url" content="${safeImageUrl}" />
  `
    : ""
  }

  <meta
    name="twitter:card"
    content="summary_large_image"
  />

  <meta
    name="twitter:title"
    content="${safeTitle}"
  />

  <meta
    name="twitter:description"
    content="${safeDescription}"
  />

  ${
    safeImageUrl ?
      `
  <meta
    name="twitter:image"
    content="${safeImageUrl}"
  />
  `
    : ""
  }
</head>

<body>
  <main class="loader-container">
    <div class="loader-content">
      <div class="loader-logo">✦</div>

      <h2>Getting things ready...</h2>
      <p>Please wait while we redirect you.</p>

      <div class="progress-track">
        <div class="progress-bar"></div>
      </div>

      <span class="loading-text">Redirecting...</span>
    </div>
  </main>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #fffdf5, #f7f0df);
    }

    .loader-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }

    .loader-content {
      width: 100%;
      max-width: 360px;
    }

    .loader-logo {
      font-size: 48px;
      color: #b68a35;
      margin-bottom: 20px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    h2 {
      color: #292929;
      font-size: 22px;
      margin: 0 0 10px;
    }

    p {
      color: #777;
      font-size: 14px;
      margin-bottom: 28px;
    }

    .progress-track {
      width: 100%;
      height: 6px;
      background: #e7dfce;
      border-radius: 20px;
      overflow: hidden;
    }

    .progress-bar {
      width: 35%;
      height: 100%;
      border-radius: 20px;
      background: linear-gradient(90deg, #b68a35, #e8c66b);
      animation: loading 1.2s ease-in-out infinite;
    }

    .loading-text {
      display: inline-block;
      margin-top: 14px;
      font-size: 12px;
      color: #9b7b39;
      letter-spacing: 1px;
    }

    @keyframes loading {
      0% {
        transform: translateX(-120%);
      }
      100% {
        transform: translateX(350%);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 0.65;
        transform: scale(0.95);
      }
      50% {
        opacity: 1;
        transform: scale(1.05);
      }
    }
  </style>

  <script>
    location.replace(${safeLandingUrl});
  </script>
</body>

</html>
    `);
  } catch (error) {
    console.error("Preview error:", error);
    return res.status(500).send("Internal server error");
  }
}
