// Browser-only helpers: shrink images (or grab a video frame) so uploads stay small.
const MAX_SIDE = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = src;
  });
}

function loadVideoFrame(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.onloadeddata = () => {
      v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
    };
    v.onseeked = () => resolve(v);
    v.onerror = () => reject(new Error("Could not read that video"));
    v.src = src;
  });
}

function drawToJpeg(source: CanvasImageSource, w: number, h: number): Promise<Blob> {
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Compression failed"))), "image/jpeg", 0.85),
  );
}

/** Photo or video file -> compressed JPEG blob. */
export async function fileToJpeg(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    if (file.type.startsWith("video/")) {
      const v = await loadVideoFrame(url);
      return await drawToJpeg(v, v.videoWidth, v.videoHeight);
    }
    const img = await loadImage(url);
    return await drawToJpeg(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadImage(file: File): Promise<string> {
  const blob = await fileToJpeg(file);
  const form = new FormData();
  form.append("file", new File([blob], "image.jpg", { type: "image/jpeg" }));
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url as string;
}
