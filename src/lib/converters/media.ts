import { FFmpeg } from "@ffmpeg/ffmpeg"
import { fetchFile, toBlobURL } from "@ffmpeg/util"

let ffmpeg: FFmpeg | null = null
let ffmpegMT: FFmpeg | null = null
let useMultiThread = false

export function setFFmpegMode(multiThread: boolean) {
  useMultiThread = multiThread
}

export function isMultiThreadSupported(): boolean {
  return typeof SharedArrayBuffer !== "undefined"
}

async function loadFFmpegCore(instance: FFmpeg, isMT: boolean): Promise<void> {
  const localPath = "/ffmpeg/ffmpeg-core"
  const cdnPath = `https://unpkg.com/@ffmpeg/core${isMT ? "-mt" : ""}@0.12.6/dist/umd`

  const fileName = isMT ? "ffmpeg-core-mt" : "ffmpeg-core"

  try {
    const localJS = `${localPath}${isMT ? "-mt" : ""}.js`
    const localWasm = `${localPath}${isMT ? "-mt" : ""}.wasm`
    await instance.load({
      coreURL: await toBlobURL(localJS, "text/javascript"),
      wasmURL: await toBlobURL(localWasm, "application/wasm"),
    })
  } catch {
    await instance.load({
      coreURL: await toBlobURL(`${cdnPath}/${fileName}.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${cdnPath}/${fileName}.wasm`, "application/wasm"),
    })
  }
}

export async function getFFmpeg(): Promise<FFmpeg> {
  if (useMultiThread && isMultiThreadSupported()) {
    if (ffmpegMT && ffmpegMT.loaded) return ffmpegMT
    const instance = new FFmpeg()
    await loadFFmpegCore(instance, true)
    ffmpegMT = instance
    return instance
  }

  if (ffmpeg && ffmpeg.loaded) return ffmpeg
  const instance = new FFmpeg()
  await loadFFmpegCore(instance, false)
  ffmpeg = instance
  return instance
}

export async function convertAudio(
  file: File,
  outputFormat: "mp3" | "wav" | "ogg" | "flac" | "aac" | "m4a"
): Promise<{ data: Uint8Array; name: string }> {
  const ff = await getFFmpeg()
  const inputExt = file.name.split(".").pop()?.toLowerCase() || "mp3"
  const inputName = `input.${inputExt}`
  const outputName = "output." + (outputFormat === "m4a" ? "m4a" : outputFormat)

  await ff.writeFile(inputName, await fetchFile(file))

  const ext = outputFormat === "m4a" ? "m4a" : outputFormat
  const codecMap: Record<string, string[]> = {
    mp3: ["-b:a", "192k"],
    wav: [],
    ogg: ["-c:a", "libvorbis"],
    flac: ["-c:a", "flac", "-compression_level", "5"],
    aac: ["-c:a", "aac", "-b:a", "192k"],
    m4a: ["-c:a", "aac", "-b:a", "192k"],
  }

  await ff.exec(["-i", inputName, ...codecMap[outputFormat], "-y", outputName])
  const data = (await ff.readFile(outputName)) as Uint8Array
  const baseName = file.name.replace(/\.[^.]+$/, "")
  return { data, name: `${baseName}.${ext}` }
}

export async function extractAudio(
  file: File,
  outputFormat: "mp3" | "wav" | "aac" = "mp3"
): Promise<{ data: Uint8Array; name: string }> {
  const ff = await getFFmpeg()
  const inputExt = file.name.split(".").pop()?.toLowerCase() || "mp4"
  const inputName = `input.${inputExt}`
  const outputName = `output.${outputFormat}`

  await ff.writeFile(inputName, await fetchFile(file))

  if (outputFormat === "aac" || outputFormat === inputExt) {
    await ff.exec(["-i", inputName, "-vn", "-c:a", "copy", "-y", outputName])
  } else {
    await ff.exec(["-i", inputName, "-vn", "-b:a", "192k", "-y", outputName])
  }

  const data = (await ff.readFile(outputName)) as Uint8Array
  const baseName = file.name.replace(/\.[^.]+$/, "")
  return { data, name: `${baseName}_audio.${outputFormat}` }
}

export async function compressVideo(
  file: File,
  crf: number = 28,
  onProgress?: (percent: number) => void
): Promise<{ data: Uint8Array; name: string }> {
  const ff = await getFFmpeg()
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4"
  const inputName = `input.${ext}`
  const outputName = `output.${ext}`

  let handler: ((e: { progress: number; time: number }) => void) | null = null
  if (onProgress) {
    handler = ({ progress }) => onProgress(Math.round(progress * 100))
    ff.on("progress", handler)
  }

  try {
    await ff.writeFile(inputName, await fetchFile(file))

    await ff.exec([
      "-i", inputName,
      "-c:v", "libx264", "-preset", "ultrafast", "-crf", String(crf),
      "-c:a", "aac", "-b:a", "96k",
      "-tune", "zerolatency",
      "-movflags", "+faststart",
      outputName,
    ])

    const data = (await ff.readFile(outputName)) as Uint8Array
    const baseName = file.name.replace(/\.[^.]+$/, "")
    return { data, name: `${baseName}_compressed.${ext}` }
  } finally {
    if (handler) ff.off("progress", handler)
  }
}
