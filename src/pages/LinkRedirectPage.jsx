import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export function LinkRedirectPage() {
  const { slug } = useParams();
  const [message, setMessage] = useState("Loading preview...");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLink() {
      try {
        const cleanSlug = decodeURIComponent(slug || "");
        let snapshot = await getDoc(doc(db, "link-ref", cleanSlug));

        if (!snapshot.exists()) {
          snapshot = await getDoc(doc(db, "links", cleanSlug));
        }

        if (!snapshot.exists()) {
          if (active) setMessage("Link not found.");
          return;
        }

        const link = snapshot.data();
        const landingUrl = link.link || link.landingUrl;
        let imageData = link.imageData || link.imageUrl || "";

        if (link.imageRef) {
          const imageSnapshot = await getDoc(doc(db, "image-ref", link.imageRef));
          imageData = imageSnapshot.exists() ? imageSnapshot.data().imageData || "" : "";
        }

        if (!landingUrl) {
          if (active) setMessage("This link has no destination.");
          return;
        }

        if (active) {
          setImageUrl(imageData);
          setMessage("Opening link...");
          document.title = link.title || "Link Preview";
        }

        window.setTimeout(
          () => {
            window.location.replace(landingUrl);
          },
          imageData ? 1200 : 0,
        );
      } catch (error) {
        console.error(error);
        if (active) setMessage("Unable to open this link. Please try again.");
      }
    }

    loadLink();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <main className="redirect-page">
      <section className="redirect-panel">
        {imageUrl && <img className="redirect-image" src={imageUrl} alt="Preview" />}
        <p>{message}</p>
      </section>
    </main>
  );
}
