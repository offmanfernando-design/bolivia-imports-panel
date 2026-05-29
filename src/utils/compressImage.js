export async function compressImageFile(file, options = {}) {
  if (!file) return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml") return file;
  if (file.size < 500 * 1024) return file;

  const maxWidth  = options.maxWidth  ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const quality   = options.quality   ?? 0.78;

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el  = new Image();
      el.onload  = () => resolve(el);
      el.onerror = reject;
      el.src     = url;
    });

    let { naturalWidth: w, naturalHeight: h } = img;
    if (w > maxWidth || h > maxHeight) {
      const ratio = Math.min(maxWidth / w, maxHeight / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const canvas  = document.createElement("canvas");
    canvas.width  = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);

    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );

    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], baseName + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
  } catch (err) {
    console.warn("[compressImage] fallo, usando original:", err);
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
