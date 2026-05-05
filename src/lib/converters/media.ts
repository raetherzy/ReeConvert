import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util"

let ffmpeg: FFmpeg | null = null

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg && ffmpeg.loaded) return ffmpeg

  const instance = new FFmpeg()
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd"

  await instance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  })

  ffmpeg = instance
  return instance
}

export async function convertAudio(
  file: File,
  outputFormat: "mp3" | "wav" | "ogg" | "flac" | "aac" | "m4a"
): Promise<{ data: Uint8Array; name: string }> {
  const ff = await getFFmpeg()
  const inputName = "input." + (file.name.split(".").pop() || "mp3")
  const outputName = "output." + outputFormat

  await ff.writeFile(inputName, await fetchFile(file))

  const codecMap: Record<string, string[]> = {
    mp3: ["-b:a", "192k"],
    wav: [],
    ogg: ["-c:a", "libvorbis"],
    flac: ["-c:a", "flac", "-compression_level", "8"],
    aac: ["-c:a", "aac", "-b:a", "192k"],
    m4a: ["-c:a", "aac", "-b:a", "192k"],
  }

  const ext = outputFormat === "m4a" ? "m4a" : outputFormat
  await ff.exec(["-i", inputName, ...codecMap[outputFormat], `${outputName}.${ext}`])

  const data = (await ff.readFile(`${outputName}.${ext}`)) as Uint8Array

  const baseName = file.name.replace(/\.[^.]+$/, "")
  return { data, name: `${baseName}.${ext}` }
}

export async function extractAudio(
  file: File,
  outputFormat: "mp3" | "wav" | "aac" = "mp3"
): Promise<{ data: Uint8Array; name: string }> {
  const ff = await getFFmpeg()
  const inputName = "input." + (file.name.split(".").pop() || "mp4")
  const outputName = `output.${outputFormat}`

  await ff.writeFile(inputName, await fetchFile(file))

  await ff.exec(["-i", inputName, "-vn", "-b:a", "192k", outputName])

  const data = (await ff.readFile(outputName)) as Uint8Array

  const baseName = file.name.replace(/\.[^.]+$/, "")
  return { data, name: `${baseName}_audio.${outputFormat}` }
}

export async function convertVideo(
  file: File,
  outputFormat: "mp4" | "webm" | "mov" | "avi"
): Promise<{ data: Uint8Array; name: string }> {
  const ff = await getFFmpeg()
  const inputName = "input." + (file.name.split(".").pop() || "mp4")
  const outputName = "output." + outputFormat

  await ff.writeFile(inputName, await fetchFile(file))

  const codecArgs: string[] = []
  if (outputFormat === "mp4") {
    codecArgs.push("-c:v", "libx264", "-preset", "fast", "-crf", "23")
  } else if (outputFormat === "webm") {
    codecArgs.push("-c:v", "libvpx-vp9", "-b:v", "1M")
  }

  await ff.exec(["-i", inputName, ...codecArgs, "-c:a", "aac", "-b:a", "128k", outputName])

  const data = (await ff.readFile(outputName)) as Uint8Array

  const baseName = file.name.replace(/\.[^.]+$/, "")
  return { data, name: `${baseName}.${outputFormat}` }
}

export async function compressVideo(
  file: File,
  crf: number = 28
): Promise<{ data: Uint8Array; name: string }> {
  const ff = await getFFmpeg()
  const ext = file.name.split(".").pop() || "mp4"
  const inputName = "input." + ext
  const outputName = "output." + ext

  await ff.writeFile(inputName, await fetchFile(file))

  await ff.exec([
    "-i", inputName,
    "-c:v", "libx264", "-preset", "fast", "-crf", String(crf),
    "-c:a", "aac", "-b:a", "96k",
    outputName,
  ])

  const data = (await ff.readFile(outputName)) as Uint8Array

  const baseName = file.name.replace(/\.[^.]+$/, "")
  return { data, name: `${baseName}_compressed.${ext}` }
}
