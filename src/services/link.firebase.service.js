import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

import commonUtil from "../utils/common-util";
import fileUtil from "../utils/file-util";

export class LinkFirebaseService {
  constructor() {
    this.db = db;
    this.linkCollection = "link-ref";
    this.imageCollection = "image-ref";
  }

  offlineMessage() {
    return "You appear to be offline. Please connect to the internet and try again.";
  }

  async checkSlugAvailability(slug) {
    const clean = String(slug || "").trim();

    if (!navigator.onLine) {
      return { available: false, error: this.offlineMessage() };
    }

    if (!commonUtil.slugIsValid(clean)) {
      return { available: false, error: "Use 3–64 characters: letters, numbers, _ or -." };
    }

    try {
      const snap = await getDoc(doc(this.db, this.linkCollection, clean));
      const legacySnap = snap.exists() ? snap : await getDoc(doc(this.db, "links", clean));

      if (legacySnap.exists()) {
        return { available: false, error: "That link ending is already in use." };
      }

      return { available: true, error: null };
    } catch (err) {
      if (err?.code === "unavailable" || /offline/i.test(err?.message || "")) {
        return { available: false, error: this.offlineMessage() };
      }

      return { available: false, error: err.message || "Failed to check availability." };
    }
  }

  async generateLink({ slug, landingUrl, file }) {
    const clean = String(slug || "").trim();

    if (!navigator.onLine) {
      return { success: false, url: null, error: this.offlineMessage() };
    }

    if (!commonUtil.slugIsValid(clean)) {
      return { success: false, url: null, error: "Use 3–64 characters: letters, numbers, _ or -." };
    }

    if (!file) {
      return { success: false, url: null, error: "Please upload a preview image." };
    }

    try {
      const linkRef = doc(this.db, this.linkCollection, clean);
      const existing = await getDoc(linkRef);

      if (existing.exists()) {
        return { success: false, url: null, error: "That link ending is already in use." };
      }

      const { dataUrl: imageData, error: imageError } = await fileUtil.createFirestoreImage(file);
      if (imageError) {
        return { success: false, url: null, error: imageError };
      }

      const imageRef = doc(this.db, this.imageCollection, clean);
      const batch = writeBatch(this.db);
      batch.set(imageRef, {
        name: file.name,
        imageData,
        createdAt: serverTimestamp(),
      });
      batch.set(linkRef, {
        link: landingUrl,
        name: clean,
        imageRef: imageRef.id,
        createdAt: serverTimestamp(),
      });
      await batch.commit();

      const generatedUrl = `${window.location.origin}/p/${encodeURIComponent(clean)}`;

      return { success: true, url: generatedUrl, error: null };
    } catch (err) {
      console.error(err);

      if (err?.code === "unavailable" || /offline/i.test(err?.message || "")) {
        return { success: false, url: null, error: this.offlineMessage() };
      }

      return { success: false, url: null, error: err.message || "Something went wrong." };
    }
  }
}

const linkFirebaseService = new LinkFirebaseService();
export default linkFirebaseService;
