import * as pdfjsLib from "pdfjs-dist"

let workerInitialized = false

export async function initPdfWorker() {
  if (workerInitialized) return
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  workerInitialized = true
}

export async function pdfToImages(
  file: File,
  format: "jpg" | "png" = "jpg",
  scale: number = 2
): Promise<{ name: string; blob: Blob }[]> {
  await initPdfWorker()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const results: { name: string; blob: Blob }[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({ canvas, viewport }).promise

    const mimeType = format === "jpg" ? "image/jpeg" : "image/png"
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), mimeType, format === "jpg" ? 0.9 : undefined)
    })

    const baseName = file.name.replace(/\.pdf$/i, "")
    results.push({
      name: `${baseName}_page_${i}.${format}`,
      blob,
    })
  }

  return results
}
