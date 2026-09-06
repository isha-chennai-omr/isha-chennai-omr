import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import linkFirebaseService from "../services/link.firebase.service";
import commonUtil from "../utils/common-util";
import fileUtil from "../utils/file-util";

export function AdminLinkPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(slug);
  const [currentSlug, setCurrentSlug] = useState(slug ? decodeURIComponent(slug) : "");
  const [name, setName] = useState(slug ? decodeURIComponent(slug) : "");
  const [landingUrl, setLandingUrl] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState(editing ? "Loading link..." : "");
  const [busy, setBusy] = useState(editing);

  useEffect(() => {
    if (!editing) return;

    async function loadLink() {
      const result = await linkFirebaseService.getLink(currentSlug);
      setBusy(false);
      if (!result.success) {
        setStatus(result.error);
        return;
      }
      setName(result.link.name || currentSlug);
      setLandingUrl(result.link.link || "");
      setPreview(result.imageData);
      setStatus("");
    }

    loadLink();
  }, [currentSlug, editing]);

  const selectFile = (selectedFile) => {
    if (!selectedFile) return;
    const result = fileUtil.validateFile(selectedFile);
    if (!result.valid) {
      setStatus(result.error);
      return;
    }
    setFile(selectedFile);
    setPreview(fileUtil.createPreviewUrl(selectedFile));
    setStatus("");
  };

  const save = async () => {
    const cleanName = name.trim();
    if (!commonUtil.slugIsValid(cleanName)) {
      setStatus("Use 3–64 characters: letters, numbers, _ or -.");
      return;
    }
    if (!commonUtil.validateUrl(landingUrl)) {
      setStatus("Enter a valid http/https landing URL.");
      return;
    }
    if (!editing && !file) {
      setStatus("Please upload a preview image.");
      return;
    }

    setBusy(true);
    setStatus("");
    const result =
      editing ?
        await linkFirebaseService.updateLink({ slug: currentSlug, name: cleanName, landingUrl, file })
      : await linkFirebaseService.generateLink({ slug: cleanName, landingUrl, file });
    setBusy(false);

    if (!result.success) {
      setStatus(result.error);
      return;
    }

    if (editing && cleanName !== currentSlug) {
      navigate(`/admin/link/${encodeURIComponent(cleanName)}`, { replace: true });
      setCurrentSlug(cleanName);
    }
    setStatus(editing ? "Link updated successfully." : "Link created successfully.");
  };

  return (
    <section className="panel admin-panel">
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>{editing ? "Edit link" : "New link"}</h1>
        </div>
        <Link className="secondary-btn admin-back" to="/admin/links">
          All links
        </Link>
      </div>

      <label htmlFor="admin-name">Link name</label>
      <input
        id="admin-name"
        value={name}
        onChange={(event) => setName(event.target.value.replace(/\s/g, "_"))}
        placeholder="OMR_SEP_Satsang"
      />

      <label htmlFor="admin-url">Landing URL</label>
      <input
        id="admin-url"
        value={landingUrl}
        onChange={(event) => setLandingUrl(event.target.value)}
        placeholder="https://example.com/register"
      />

      <label>Preview Image</label>
      <div className={`dropzone ${preview ? "has-file" : ""}`} onClick={() => document.getElementById("admin-file").click()}>
        <input
          id="admin-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
        {preview ?
          <>
            <img src={preview} alt="Preview" />
            <strong>{file?.name || "Current preview image"}</strong>
            <span>Click to replace the image</span>
          </>
        : <>
            <strong>Choose a preview image</strong>
            <span>JPG, PNG or WebP</span>
          </>
        }
      </div>

      <button className="generate" onClick={save} disabled={busy}>
        {busy ?
          "Saving..."
        : editing ?
          "Save changes"
        : "Create link"}
      </button>
      {status && <div className="status">{status}</div>}
    </section>
  );
}
