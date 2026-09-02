export class FileUtil {
  constructor() {
    this.ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    this.MAX_BYTES = 8 * 1024 * 1024;
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

  sanitizeFilename(filename) {
    return String(filename || "").replace(/[^A-Za-z0-9._-]/g, "_");
  }
}

const fileUtil = new FileUtil();
export default fileUtil;