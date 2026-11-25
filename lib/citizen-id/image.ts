// Stretch grayscale contrast using a bounded histogram; no pixels leave the browser.
export function enhancePixels(pixels: Uint8ClampedArray): void {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
    pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
    histogram[gray]++;
  }
  const cutoff = pixels.length / 4 * 0.01;
  let low = 0, high = 255, count = 0;
  while (low < 255 && (count += histogram[low]) < cutoff) low++;
  count = 0;
  while (high > 0 && (count += histogram[high]) < cutoff) high--;
  if (high <= low) return;
  for (let i = 0; i < pixels.length; i += 4) {
    const value = Math.round(Math.max(0, Math.min(255, (pixels[i] - low) * 255 / (high - low))));
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
  }
}

export async function prepareImage(image: Blob, enhance = true): Promise<Blob> {
  const bitmap = await createImageBitmap(image, { imageOrientation: "from-image" });
  try {
    // Enlarge small text, but bound memory for very large uploads.
    const scale = Math.min(3, 1800 / bitmap.width, (enhance ? 3600 : 4000) / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (enhance) {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      enhancePixels(pixels.data);
      context.putImageData(pixels, 0, 0);
    }
    return await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error("Image processing failed")), "image/png"));
  } finally { bitmap.close(); }
}
