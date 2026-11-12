/**
 * metadata.js
 *
 * Client-side helper to strip EXIF / metadata from an image file.
 *
 * Approach: no external library is required. The file is turned into an image,
 * drawn onto an HTML <canvas> at its natural size, then re-encoded with
 * canvas.toDataURL(). Re-encoding through a canvas inherently discards EXIF
 * markers (Orientation, GPS, MakerNote, etc.) because the canvas bitmap does
 * not carry the original JPEG/TIFF metadata segments.
 *
 * Exported function: stripExif(file) -> Promise<string> (clean data-URI)
 */

// Read a File as a data-URI (base64).
const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

// Create an HTMLImageElement from a data-URI and wait for it to load.
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for re-encoding"));
    img.src = src;
  });

/**
 * Strip EXIF/metadata from an image file by re-encoding it on a canvas.
 *
 * @param {File} file - The image file picked via <input type="file" accept="image/*">
 * @param {object} [options]
 * @param {number} [options.quality=0.92] - JPEG re-encoding quality (0-1). Only used for JPEG output.
 * @param {string} [options.type='image/jpeg'] - Output MIME type.
 * @returns {Promise<string>} A clean data-URI with all EXIF metadata removed.
 */
export async function stripExif(file, { quality = 0.92, type = "image/jpeg" } = {}) {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    throw new Error("stripExif: expected an image File");
  }

  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  // Use the image's natural (decoded) dimensions so orientation is applied
  // by the browser decode and then discarded during re-encode.
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  // Re-encode: EXIF is not part of the canvas bitmap, so it is dropped here.
  const cleanDataUrl = canvas.toDataURL(type, quality);

  // Revoke the object-URL-free data URL is not a blob, nothing to revoke.
  // Return the clean data-URI ready to be stored in state / displayed.
  return cleanDataUrl;
}

export default { stripExif };
