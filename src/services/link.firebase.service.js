import { collection, doc, getDoc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
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

  async getLink(slug) {
    const clean = String(slug || "").trim();

    try {
      const snapshot = await getDoc(doc(this.db, this.linkCollection, clean));
      if (!snapshot.exists()) {
        return { success: false, link: null, imageData: "", error: "Link not found." };
      }

      const link = snapshot.data();
      let imageData = "";
      if (link.imageRef) {
        const imageSnapshot = await getDoc(doc(this.db, this.imageCollection, link.imageRef));
        imageData = imageSnapshot.exists() ? imageSnapshot.data().imageData || "" : "";
      }

      return { success: true, link, imageData, error: null };
    } catch (err) {
      return { success: false, link: null, imageData: "", error: err.message || "Failed to load link." };
    }
  }

  async listLinks() {
    try {
      const snapshot = await getDocs(collection(this.db, this.linkCollection));
      const links = snapshot.docs.map((linkSnapshot) => ({
        id: linkSnapshot.id,
        ...linkSnapshot.data(),
      }));
      links.sort((first, second) => String(first.name || first.id).localeCompare(String(second.name || second.id)));
      return { success: true, links, error: null };
    } catch (err) {
      return { success: false, links: [], error: err.message || "Failed to load links." };
    }
  }

  async updateLink({ slug, name, landingUrl, file }) {
    const clean = String(slug || "").trim();
    const newName = String(name || "").trim();
    const target = commonUtil.validateUrl(landingUrl);

    if (!commonUtil.slugIsValid(newName)) {
      return { success: false, error: "Use 3–64 characters: letters, numbers, _ or -." };
    }

    if (!target) {
      return { success: false, error: "Enter a valid http/https landing URL." };
    }

    try {
      const linkRef = doc(this.db, this.linkCollection, clean);
      const existing = await getDoc(linkRef);
      if (!existing.exists()) {
        return { success: false, error: "Link not found." };
      }

      const link = existing.data();
      const batch = writeBatch(this.db);
      const newLinkRef = doc(this.db, this.linkCollection, newName);
      if (newName !== clean && (await getDoc(newLinkRef)).exists()) {
        return { success: false, error: "That new link ending is already in use." };
      }
      const changes = {
        link: target.toString(),
        name: newName,
        updatedAt: serverTimestamp(),
      };

      if (file) {
        const { dataUrl: imageData, error: imageError } = await fileUtil.createFirestoreImage(file);
        if (imageError) return { success: false, error: imageError };

        const imageRef = doc(this.db, this.imageCollection, link.imageRef || clean);
        batch.set(
          imageRef,
          {
            name: file.name,
            imageData,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        changes.imageRef = imageRef.id;
      }

      batch.set(newLinkRef, { ...link, ...changes }, { merge: true });
      if (newName !== clean) batch.delete(linkRef);
      await batch.commit();
      return { success: true, error: null };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message || "Failed to update link." };
    }
  }
}

const linkFirebaseService = new LinkFirebaseService();
export default linkFirebaseService;
