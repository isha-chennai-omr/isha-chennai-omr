import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { supabase } from "../supabase";

export function LinkRedirectPage() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLink() {
      try {
        const cleanSlug = decodeURIComponent(slug || "");

        const { data: link, error } = await supabase
          .from("links")
          .select("slug, name, title, description, landing_url, image_path")
          .eq("slug", cleanSlug)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!link) {
          if (active) {
            setMessage("Link not found.");
          }
          return;
        }

        const landingUrl = link.landing_url;

        let previewImageUrl = "";

        if (link.image_path) {
          const { data } = supabase.storage.from("preview-images").getPublicUrl(link.image_path);

          previewImageUrl = data.publicUrl;
        }

        if (!landingUrl) {
          if (active) {
            setMessage("This link has no destination.");
          }
          return;
        }

        if (active) {
          const previewTitle = link.title || link.name || cleanSlug;

          setImageUrl(previewImageUrl);
          setLinkTitle(previewTitle);
          setLinkDescription(link.description || "");
          setLoading(true);
        }

        window.location.replace(landingUrl);
      } catch (error) {
        console.error("Failed to load link:", error);

        if (active) {
          setMessage("Unable to open this link. Please try again.");
        }
      }
    }

    loadLink();

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <main className="redirect-page">
      {linkTitle && (
        <Helmet>
          <title>ISHA OMR - {linkTitle}</title>

          <meta name="description" content={linkDescription} />

          <meta property="og:type" content="website" />
          <meta property="og:title" content={linkTitle} />
          <meta property="og:description" content={linkDescription} />
          {imageUrl && <meta property="og:image" content={imageUrl} />}

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={linkTitle} />
          {imageUrl && <meta name="twitter:image" content={imageUrl} />}
        </Helmet>
      )}

      <section className="redirect-panel">
        {loading && <span className="redirect-loader" aria-label="Opening link" />}
      </section>
    </main>
  );
}
