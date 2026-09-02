import { useCallback, useState } from "react";

import linkFirebaseService from "../services/link.firebase.service";

import commonUtil from "../utils/common-util";
import fileUtil from "../utils/file-util";

export function LinkGeneratorPage() {
  const [landingUrl, setLandingUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState("");

  const selectFile = useCallback((f) => {
    if (!f) return;

    const { valid, error } = fileUtil.validateFile(f);
    if (!valid) {
      setStatus(error);
      return;
    }

    setFile(f);
    setPreview(fileUtil.createPreviewUrl(f));
    setStatus("");
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    selectFile(e.dataTransfer.files?.[0]);
  };

  const checkSlug = async () => {
    const { available, error } = await linkFirebaseService.checkSlugAvailability(slug);

    if (!available) {
      setStatus(error);
      return false;
    }

    setStatus("✓ Link ending is available.");
    return true;
  };

  const generate = async () => {
    setStatus("");
    setGenerated("");

    // Validate URL
    const target = commonUtil.validateUrl(landingUrl);
    if (!target) {
      setStatus("Enter a valid http/https landing URL.");
      return;
    }

    // Validate slug
    if (!commonUtil.slugIsValid(slug.trim())) {
      setStatus("Use 3–64 characters: letters, numbers, _ or -.");
      return;
    }

    // Validate file
    const { valid: fileValid, error: fileError } = fileUtil.validateFile(file);
    if (!fileValid) {
      setStatus(fileError);
      return;
    }

    setBusy(true);
    try {
      const { success, url, error } = await linkFirebaseService.generateLink({
        slug: slug.trim(),
        landingUrl: target.toString(),
        file,
      });

      if (success) {
        setGenerated(url);
        setStatus("✓ Link created successfully.");
      } else {
        setStatus(error);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <section className="panel">
        <h1>ISHA OMR Link Preview Generator</h1>
        <p className="intro">
          Upload an image and create a unique link that shows the image as a social preview before opening the destination.
        </p>

        {/* Landing URL Form */}
        <label>Landing URL</label>
        <input value={landingUrl} onChange={(e) => setLandingUrl(e.target.value)} placeholder="https://example.com/register" />

        {/* Unique Link Ending */}
        <label>Unique Link Ending</label>
        <div className="slug-row">
          <span>{window.location.origin}/p/</span>
          <input value={slug} onChange={(e) => setSlug(e.target.value.replace(/\s/g, "_"))} placeholder="OMR_SEP_Satsang" />
        </div>

        {/* Preview Image Upload */}
        <label>Preview Image</label>
        <div
          className={`dropzone ${file ? "has-file" : ""}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => document.getElementById("file").click()}
        >
          <input id="file" type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => selectFile(e.target.files?.[0])} />
          {preview ?
            <>
              <img src={preview} alt="Preview" />
              <strong>{file.name}</strong>
              <span>Click or drop another image to replace it</span>
            </>
          : <>
              <div className="upload-icon">↑</div>
              <strong>Drag & drop your image here</strong>
              <span>or click to browse · JPG, PNG, WebP · max 8 MB</span>
            </>
          }
        </div>

        <button className="check" onClick={checkSlug} disabled={busy}>
          Check availability
        </button>

        <button className="generate" onClick={generate} disabled={busy}>
          {busy ? "Creating..." : "Generate Link"}
        </button>

        {status && <div className="status">{status}</div>}

        {/* Generated Link Result */}
        {generated && (
          <div className="result">
            <div className="result-label">YOUR LINK</div>
            <a href={generated} target="_blank" rel="noreferrer">
              {generated}
            </a>
            <button onClick={() => navigator.clipboard.writeText(generated)}>Copy link</button>
          </div>
        )}
      </section>
    </main>
  );
}
