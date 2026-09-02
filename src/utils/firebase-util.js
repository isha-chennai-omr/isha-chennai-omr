import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../firebase";
import { slugIsValid } from "./common-util";
import { sanitizeFilename } from "./file-util";

class FirebaseUtil {
  /**
   * Check if slug is available in Firebase
   * @param {string} slug - The slug to check
   * @returns {object} - { available: boolean, error: string|null }
   */
  async checkSlugAvailability(slug) {
    const clean = slug.trim();

    if (!slugIsValid(clean)) {
      return { available: false, error: "Use 3–64 characters: letters, numbers, _ or -." };
    }

    try {
      const snap = await getDoc(doc(db, "links", clean));
      if (snap.exists()) {
        return { available: false, error: "That link ending is already in use." };
      }
      return { available: true, error: null };
    } catch (err) {
      return { available: false, error: err.message || "Failed to check availability." };
    }
  }

  /**
   * Generate and save link to Firebase
   * @param {object} params - Parameters object
   * @param {string} params.slug - The slug for the link
   * @param {string} params.landingUrl - The destination URL
   * @param {File} params.file - The preview image file
   * @returns {object} - { success: boolean, url: string|null, error: string|null }
   */
  async generateLink({ slug, landingUrl, file }) {
    const clean = slug.trim();

    if (!slugIsValid(clean)) {
      return { success: false, url: null, error: "Use 3–64 characters: letters, numbers, _ or -." };
    }

    if (!file) {
      return { success: false, url: null, error: "Please upload a preview image." };
    }

    try {
      // Check if slug already exists
      const linkRef = doc(db, "links", clean);
      const existing = await getDoc(linkRef);
      if (existing.exists()) {
        return { success: false, url: null, error: "That link ending is already in use." };
      }

      // Upload image
      const safeName = sanitizeFilename(file.name);
      const storageRef = ref(storage, `preview-images/${clean}/${Date.now()}-${safeName}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const imageUrl = await getDownloadURL(storageRef);

      // Save link metadata to Firestore
      await setDoc(linkRef, {
        slug: clean,
        landingUrl,
        imageUrl,
        imagePath: storageRef.fullPath,
        createdAt: serverTimestamp(),
      });

      // Generate shareable URL
      const base = window.location.origin;
      const generatedUrl = `${base}/p/${encodeURIComponent(clean)}`;

      return { success: true, url: generatedUrl, error: null };
    } catch (err) {
      console.error(err);
      return { success: false, url: null, error: err.message || "Something went wrong." };
    }
  }
}

const firebaseUtil = new FirebaseUtil();
export default firebaseUtil;
