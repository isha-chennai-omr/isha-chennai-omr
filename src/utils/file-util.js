export class FileUtil {
  constructor() {
    this.ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    this.MAX_BYTES = 8 * 1024 * 1024;
    this.MAX_DATA_URL_CHARS = 900 * 1024;
  }

  validateFile(file) {
    if (!file) {
      return { valid: false, error: "Please upload a preview image." };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: "Please upload JPG, PNG or WebP." };
    }

    if (file.size > this.MAX_BYTES) {
      return { valid: false, error: "Image must be 8 MB or smaller." };
    }

    return { valid: true, error: null };
  }

  createPreviewUrl(file) {
    return URL.createObjectURL(file);
  }

  async createFirestoreImage(file) {
    const objectUrl = this.createPreviewUrl(file);

    try {
      const image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("Unable to read the image."));
        element.src = objectUrl;
      });

      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.78, 0.65, 0.52]) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= this.MAX_DATA_URL_CHARS) {
          return { dataUrl, error: null };
        }
      }

      return { dataUrl: null, error: "Image is too large for Firestore. Please choose a smaller image." };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  sanitizeFilename(filename) {
    return String(filename || "").replace(/[^A-Za-z0-9._-]/g, "_");
  }
}

const fileUtil = new FileUtil();
export default fileUtil;