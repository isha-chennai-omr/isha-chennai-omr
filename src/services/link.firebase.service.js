import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../firebase";

import commonUtil from "../utils/common-util";
import fileUtil from "../utils/file-util";

export class LinkFirebaseService {
  constructor() {
    this.db = db;
    this.storage = storage;
    this.docName = "links";
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
      const snap = await getDoc(doc(this.db, this.docName, clean));

      if (snap.exists()) {
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
      const linkRef = doc(this.db, this.docName, clean);
      const existing = await getDoc(linkRef);

      if (existing.exists()) {
        return { success: false, url: null, error: "That link ending is already in use." };
      }

      const safeName = fileUtil.sanitizeFilename(file.name);
      const storageRef = ref(this.storage, `preview-images/${clean}/${Date.now()}-${safeName}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const imageUrl = await getDownloadURL(storageRef);

      await setDoc(linkRef, {
        slug: clean,
        landingUrl,
        imageUrl,
        imagePath: storageRef.fullPath,
        createdAt: serverTimestamp(),
      });

      const generatedUrl = `${window.location.origin}/p/${encodeURIComponent(clean)}`;

      return { success: true, url: generatedUrl, error: null };
    } catch (err) {
      console.error(err);

      if (err?.code === "storage/bucket-not-found" || err?.code === "storage/unknown") {
        return { success: false, url: null, error: "Firebase Storage is not enabled for this project. Enable Storage in the Firebase Console and try again." };
      }

      if (err?.code === "unavailable" || /offline/i.test(err?.message || "")) {
        return { success: false, url: null, error: this.offlineMessage() };
      }

      return { success: false, url: null, error: err.message || "Something went wrong." };
    }
  }
}

const linkFirebaseService = new LinkFirebaseService();
export default linkFirebaseService;
