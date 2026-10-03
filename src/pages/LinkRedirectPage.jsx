import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { supabase } from "../supabase";

export function LinkRedirectPage() {
  const { slug } = useParams();

  const [message, setMessage] = useState("Loading preview...");
  const [imageUrl, setImageUrl] = useState("");
  const [linkName, setLinkName] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLink() {
      try {
        const cleanSlug = decodeURIComponent(slug || "");

        const { data: link, error } = await supabase
          .from("links")
          .select("slug, name, landing_url, image_path")
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
          setImageUrl(previewImageUrl);
          setLinkName(link.name || cleanSlug);
          setMessage("Opening link...");
        }

        window.setTimeout(
          () => {
            window.location.replace(landingUrl);
          },
          previewImageUrl ? 1200 : 0,
        );
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
      {linkName && (
        <Helmet>
          <title>ISHA OMR - {linkName}</title>

          <meta name="description" content={linkName} />

          <meta property="og:type" content="website" />

          <meta property="og:title" content={linkName} />

          <meta property="og:description" content={linkName} />

          {imageUrl && <meta property="og:image" content={imageUrl} />}

          <meta name="twitter:card" content="summary_large_image" />

          <meta name="twitter:title" content={linkName} />

          {imageUrl && <meta name="twitter:image" content={imageUrl} />}
        </Helmet>
      )}

      <section className="redirect-panel">
        {imageUrl && <img className="redirect-image" src={imageUrl} alt="Preview" />}

        <p>{message}</p>
      </section>
    </main>
  );
}
