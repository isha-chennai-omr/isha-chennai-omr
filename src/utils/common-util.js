class CommonUtil {
  /**
   * Validate slug format
   * @param {string} slug - The slug to validate
   * @returns {boolean} - True if slug is valid
   */
  slugIsValid(slug) {
    return /^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(slug);
  }

  /**
   * Validate URL format
   * @param {string} url - The URL to validate
   * @returns {URL|null} - URL object if valid, null otherwise
   */
  validateUrl(url) {
    try {
      const target = new URL(url.trim());
      if (!["http:", "https:"].includes(target.protocol)) return null;
      return target;
    } catch {
      return null;
    }
  }
}

const commonUtil = new CommonUtil();
export default commonUtil;
