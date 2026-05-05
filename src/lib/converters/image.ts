export async function convertImage(
  file: File,
  targetFormat: "jpg" | "png" | "webp"
): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0)

  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b!),
      mimeMap[targetFormat],
      targetFormat === "jpg" ? 0.92 : undefined
    )
  })
}

export async function convertHeic(
  file: File,
  targetFormat: "jpg" | "png" = "jpg"
): Promise<Blob> {
  const heic2any = (await import("heic2any")).default
  const converted = await heic2any({
    blob: file,
    toType: targetFormat === "jpg" ? "image/jpeg" : "image/png",
    quality: 0.9,
  })

  const res = Array.isArray(converted) ? converted[0] : converted
  return res as Blob
}

export async function compressImage(
  file: File,
  options?: { maxSizeMB?: number; maxWidthOrHeight?: number; quality?: number }
): Promise<Blob> {
  const imageCompression = (await import("browser-image-compression")).default

  const compressed = await imageCompression(file, {
    maxSizeMB: options?.maxSizeMB ?? 1,
    maxWidthOrHeight: options?.maxWidthOrHeight ?? 1920,
    useWebWorker: true,
    initialQuality: options?.quality ?? 0.8,
  })

  return compressed
}

export async function resizeImage(
  file: File,
  width: number,
  height: number
): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(img, 0, 0, width, height)

  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b!), getMimeType(file.type), 0.92)
  })
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function getMimeType(type: string): string {
  if (type === "image/png") return "image/png"
  if (type === "image/webp") return "image/webp"
  return "image/jpeg"
}
