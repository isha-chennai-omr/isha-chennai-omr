import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_PUBLISHABLE_KEY);

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

    const { data: link, error } = await supabase.from("links").select("slug, name, landing_url, image_path").eq("slug", slug).maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).send("Failed to load link");
    }

    if (!link) {
      return res.status(404).send("Link not found");
    }

    const title = link.name || slug;
    const description = link.name || slug;

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

    const safeTitle = escapeHtml(`ISHA OMR - ${title}`);
    const safeDescription = escapeHtml(description);
    const safeImageUrl = escapeAttribute(imageUrl);
    const safePreviewUrl = escapeAttribute(previewUrl);
    const safeLandingUrl = JSON.stringify(landingUrl.toString());

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");

    res.setHeader("Content-Type", "text/html; charset=utf-8");

    return res.status(200).send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />

  <title>${safeTitle}</title>

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
  <main style="text-align:center;font-family:sans-serif;">
    ${
      imageUrl ?
        `<img
            src="${safeImageUrl}"
            alt="${safeDescription}"
            style="max-width:100%;height:auto;"
          />`
      : ""
    }

    <p>Opening link...</p>
  </main>

  <script>
    setTimeout(function () {
      window.location.replace(${safeLandingUrl});
    }, 1200);
  </script>
</body>
</html>
    `);
  } catch (error) {
    console.error("Preview error:", error);
    return res.status(500).send("Internal server error");
  }
}
