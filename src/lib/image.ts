"use client";

/**
 * Photos from the phone gallery are often 3–8 MB. Before upload we shrink them
 * in the browser to ~1280px (full) and ~420px (thumbnail) WebP, usually
 * 80–200 KB and 15–40 KB. This keeps the free storage (1 GB) and bandwidth
 * (5 GB/month) far from their limits and pages fast on weak internet.
 */

export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const ACCEPTED = /^image\/(jpeg|png|webp|heic|heif|gif|avif)$/i;

export interface Compressed {
  full: Blob;
  thumb: Blob;
  ext: "webp" | "jpg";
}

export function validateImage(file: File): string | null {
  if (!ACCEPTED.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) return "الملف ده ما صورة.";
  if (file.size > MAX_INPUT_BYTES) return "الصورة كبيرة جداً (أكثر من 25MB).";
  return null;
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // older browsers
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return img;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

function draw(src: ImageBitmap | HTMLImageElement, max: number): HTMLCanvasElement {
  const w = "naturalWidth" in src ? src.naturalWidth : src.width;
  const h = "naturalHeight" in src ? src.naturalHeight : src.height;
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob | null> {
  return new Promise((res) => canvas.toBlob(res, type, q));
}

export async function compressImage(file: File): Promise<Compressed> {
  const src = await decode(file);
  const big = draw(src, 1280);
  const small = draw(src, 420);
  if ("close" in src) src.close();

  // Safari can't encode WebP and silently returns PNG; fall back to JPEG there.
  let full = await toBlob(big, "image/webp", 0.8);
  let ext: Compressed["ext"] = "webp";
  if (!full || full.type !== "image/webp") {
    full = await toBlob(big, "image/jpeg", 0.82);
    ext = "jpg";
  }
  const thumb = await toBlob(small, ext === "webp" ? "image/webp" : "image/jpeg", 0.75);
  if (!full || !thumb) throw new Error("تعذر تجهيز الصورة.");
  return { full, thumb, ext };
}
