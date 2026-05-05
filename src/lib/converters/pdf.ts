import { PDFDocument, rgb, StandardFonts, PageSizes, degrees } from "pdf-lib-with-encrypt"

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create()

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer()
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
    const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices())
    copiedPages.forEach((page) => mergedDoc.addPage(page))
  }

  return await mergedDoc.save()
}

export async function splitPDF(file: File, ranges: { start: number; end: number }[]): Promise<Uint8Array[]> {
  const arrayBuffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
  const totalPages = doc.getPageCount()

  const results: Uint8Array[] = []

  for (const range of ranges) {
    const start = Math.max(0, range.start - 1)
    const end = Math.min(totalPages, range.end)
    if (start >= end) continue

    const newDoc = await PDFDocument.create()
    const indices = Array.from({ length: end - start }, (_, i) => start + i)
    const copiedPages = await newDoc.copyPages(doc, indices)
    copiedPages.forEach((page) => newDoc.addPage(page))
    results.push(await newDoc.save())
  }

  return results
}

export async function splitPDFAllPages(file: File): Promise<Uint8Array[]> {
  const arrayBuffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
  const totalPages = doc.getPageCount()
  const results: Uint8Array[] = []

  for (let i = 0; i < totalPages; i++) {
    const newDoc = await PDFDocument.create()
    const [copiedPage] = await newDoc.copyPages(doc, [i])
    newDoc.addPage(copiedPage)
    results.push(await newDoc.save())
  }

  return results
}

export async function rotatePDF(
  file: File,
  rotations: { pageIndex: number; angle: 90 | 180 | 270 }[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

  for (const { pageIndex, angle } of rotations) {
    const page = doc.getPage(pageIndex)
    const currentRotation = page.getRotation().angle
    page.setRotation(degrees(currentRotation + angle))
  }

  return await doc.save()
}

export async function imagesToPDF(
  images: Array<{ data: Uint8Array; type: "jpg" | "png" }>
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()

  for (const image of images) {
    let embeddedImage

    if (image.type === "jpg") {
      embeddedImage = await doc.embedJpg(image.data)
    } else {
      embeddedImage = await doc.embedPng(image.data)
    }

    const page = doc.addPage([embeddedImage.width, embeddedImage.height])
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: embeddedImage.width,
      height: embeddedImage.height,
    })
  }

  return await doc.save()
}

export async function imagesToPDFA4(
  images: Array<{ data: Uint8Array; type: "jpg" | "png" }>
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const [pageWidth, pageHeight] = PageSizes.A4

  for (const image of images) {
    let embeddedImage

    if (image.type === "jpg") {
      embeddedImage = await doc.embedJpg(image.data)
    } else {
      embeddedImage = await doc.embedPng(image.data)
    }

    const page = doc.addPage([pageWidth, pageHeight])
    const imgRatio = embeddedImage.width / embeddedImage.height
    const pageRatio = pageWidth / pageHeight

    let drawWidth: number
    let drawHeight: number

    if (imgRatio > pageRatio) {
      drawWidth = pageWidth - 40
      drawHeight = drawWidth / imgRatio
    } else {
      drawHeight = pageHeight - 40
      drawWidth = drawHeight * imgRatio
    }

    page.drawImage(embeddedImage, {
      x: (pageWidth - drawWidth) / 2,
      y: (pageHeight - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    })
  }

  return await doc.save()
}

export async function compressPDF(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

  return await doc.save({
    objectsPerTick: 100,
    useObjectStreams: true,
    addDefaultPage: false,
  })
}

export async function lockPDF(file: File, password: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })

  await doc.encrypt({
    userPassword: password,
    ownerPassword: password,
    permissions: {
      printing: "highResolution",
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
    },
  })

  return await doc.save({ useObjectStreams: false })
}

export async function unlockPDF(file: File, password: string): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(arrayBuffer, { password })

  return await doc.save()
}

export function downloadBlob(data: Uint8Array, filename: string, mimeType = "application/pdf") {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
