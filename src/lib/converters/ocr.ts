import { createWorker } from "tesseract.js"

export async function extractTextFromImage(
  file: File,
  language: string = "eng",
  onProgress?: (progress: number) => void
): Promise<string> {
  const worker = await createWorker(language)
  const { data } = await worker.recognize(file)
  await worker.terminate()
  return data.text
}

export async function extractTextFromImages(
  files: File[],
  language: string = "eng",
  onProgress?: (progress: number) => void
): Promise<{ text: string; fileName: string }[]> {
  const results: { text: string; fileName: string }[] = []

  for (let i = 0; i < files.length; i++) {
    const text = await extractTextFromImage(files[i], language)
    results.push({ text, fileName: files[i].name })
    if (onProgress) {
      onProgress(((i + 1) / files.length) * 100)
    }
  }

  return results
}
