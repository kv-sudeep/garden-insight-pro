export type PhotoQuality = {
  ok: boolean;
  level: "good" | "warn" | "bad";
  brightness: number;
  sharpness: number;
  message: string;
  tip?: string;
};

/** Downscale an image file to a small grayscale buffer for analysis. */
async function toGray(file: File, size = 220) {
  const bitmap = await createImageBitmap(file);
  const scale = size / Math.max(bitmap.width, bitmap.height);
  const w = Math.max(8, Math.round(bitmap.width * scale));
  const h = Math.max(8, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    const p = i * 4;
    gray[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  bitmap.close?.();
  return { gray, w, h };
}

/** Checks brightness and blur so users don't submit unusable photos. */
export async function checkPhotoQuality(file: File): Promise<PhotoQuality> {
  try {
    const { gray, w, h } = await toGray(file);
    let sum = 0;
    for (let i = 0; i < gray.length; i++) sum += gray[i];
    const brightness = sum / gray.length;

    // Laplacian variance = sharpness proxy
    let lapSum = 0;
    let lapSqSum = 0;
    let count = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const v =
          -4 * gray[i] + gray[i - 1] + gray[i + 1] + gray[i - w] + gray[i + w];
        lapSum += v;
        lapSqSum += v * v;
        count++;
      }
    }
    const mean = lapSum / count;
    const sharpness = lapSqSum / count - mean * mean;

    if (brightness < 45)
      return {
        ok: false,
        level: "bad",
        brightness,
        sharpness,
        message: "Too dark",
        tip: "Move to daylight or turn on more light.",
      };
    if (brightness > 225)
      return {
        ok: false,
        level: "bad",
        brightness,
        sharpness,
        message: "Overexposed",
        tip: "Avoid direct sun or flash glare on the leaf.",
      };
    if (sharpness < 45)
      return {
        ok: false,
        level: "bad",
        brightness,
        sharpness,
        message: "Looks blurry",
        tip: "Hold steady and tap to focus before shooting.",
      };
    if (sharpness < 120)
      return {
        ok: true,
        level: "warn",
        brightness,
        sharpness,
        message: "Slightly soft",
        tip: "A sharper close-up will improve accuracy.",
      };
    return { ok: true, level: "good", brightness, sharpness, message: "Good quality" };
  } catch {
    return {
      ok: true,
      level: "warn",
      brightness: 0,
      sharpness: 0,
      message: "Could not check quality",
    };
  }
}

/** Stable SHA-256 of the file bytes, used to spot a photo already diagnosed. */
export async function hashFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
