import express from "express"
import multer from "multer"
import { spawn } from "child_process"
import crypto from "crypto"
import path from "path"
import fs from "fs"
import cors from "cors"

const PORT = Number(process.env.PORT) || 3001
const TEMP_DIR = "/tmp/video-api"
const MAX_FILE_SIZE = 200 * 1024 * 1024
const CLEANUP_INTERVAL = 300_000
const FILE_TTL = 3600_000

fs.mkdirSync(TEMP_DIR, { recursive: true })

const app = express()
app.use(cors())

const upload = multer({
  dest: TEMP_DIR,
  limits: { fileSize: MAX_FILE_SIZE },
})

const downloadStore = new Map<string, string>()

/* ------- Cleanup old files periodically ------- */
setInterval(() => {
  const now = Date.now()
  for (const [id, filePath] of downloadStore) {
    try {
      if (!fs.existsSync(filePath)) { downloadStore.delete(id); continue }
      if (now - fs.statSync(filePath).mtimeMs > FILE_TTL) {
        fs.unlinkSync(filePath)
        downloadStore.delete(id)
      }
    } catch { downloadStore.delete(id) }
  }
  for (const f of fs.readdirSync(TEMP_DIR)) {
    try {
      const fp = path.join(TEMP_DIR, f)
      if (now - fs.statSync(fp).mtimeMs > FILE_TTL) fs.unlinkSync(fp)
    } catch {}
  }
}, CLEANUP_INTERVAL)

/* ------- POST /api/convert ------- */
app.post("/api/convert", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" })
    return
  }

  const inputPath = req.file.path
  const outputId = crypto.randomUUID()
  const outputPath = path.join(TEMP_DIR, `${outputId}.mp4`)

  res.setHeader("Content-Type", "text/plain; charset=utf-8")
  res.setHeader("Transfer-Encoding", "chunked")
  res.setHeader("X-Content-Type-Options", "nosniff")

  let totalDurationSec = 0
  try {
    totalDurationSec = await probeDuration(inputPath)
  } catch {}

  const args = [
    "-i", inputPath,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-progress", "pipe:1",
    "-nostats",
    "-y",
    outputPath,
  ]

  const ffmpeg = spawn("ffmpeg", args)
  let buf = ""
  let lastPct = -1

  ffmpeg.stdout.on("data", (data: Buffer) => {
    buf += data.toString()
    const lines = buf.split("\n")
    buf = lines.pop() || ""

    let outTimeSec = 0
    let speed = ""

    for (const line of lines) {
      if (line.startsWith("out_time=")) {
        outTimeSec = parseTime(line.slice(9))
      } else if (line.startsWith("speed=")) {
        speed = line.slice(6).replace(/x$/i, "").trim()
      }
    }

    if (outTimeSec > 0 && totalDurationSec > 0) {
      const pct = Math.min(Math.round((outTimeSec / totalDurationSec) * 100), 99)
      if (pct > lastPct) {
        lastPct = pct
        res.write(JSON.stringify({ progress: pct, speed }) + "\n")
      }
    } else if (outTimeSec > 0 && lastPct < 90) {
      // No total duration — increment slowly
      lastPct = Math.min(lastPct + 2, 90)
      res.write(JSON.stringify({ progress: lastPct, speed }) + "\n")
    }
  })

  ffmpeg.stderr.on("data", (data: Buffer) => {
    const txt = data.toString().trim()
    if (txt) console.error("[ffmpeg]", txt.slice(0, 300))
  })

  ffmpeg.on("error", (err) => {
    console.error("ffmpeg spawn error:", err)
    try { res.write(JSON.stringify({ error: "Conversion engine failed to start" }) + "\n"); res.end() } catch {}
  })

  ffmpeg.on("close", (code) => {
    try { fs.unlinkSync(inputPath) } catch {}
    if (code === 0 && fs.existsSync(outputPath)) {
      downloadStore.set(outputId, outputPath)
      res.write(JSON.stringify({ done: true, fileId: outputId, progress: 100 }) + "\n")
    } else {
      res.write(JSON.stringify({ error: `Conversion failed (exit ${code})` }) + "\n")
    }
    res.end()
  })

  req.on("close", () => { ffmpeg.kill("SIGTERM") })
})

/* ------- GET /api/download/:fileId ------- */
app.get("/api/download/:fileId", (req, res) => {
  const filePath = downloadStore.get(req.params.fileId)
  if (!filePath || !fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found or expired" })
    return
  }
  res.download(filePath, "converted.mp4")
})

/* ------- GET /api/health ------- */
app.get("/api/health", (_, res) => {
  res.json({ status: "ok" })
})

/* ------- Helpers ------- */
function parseTime(t: string): number {
  // "00:00:05.123456" or "00:00:05.123"
  const m = t.match(/^(\d+):(\d+):(\d+)\.?(\d*)/)
  if (!m) return 0
  return +m[1] * 3600 + +m[2] * 60 + +m[3] + (+m[4] || 0) / 1_000_000
}

function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const ffprobe = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ])
    let out = ""
    ffprobe.stdout.on("data", (d: Buffer) => (out += d.toString()))
    ffprobe.stderr.on("data", () => {})
    ffprobe.on("close", (code) => resolve(code === 0 ? parseFloat(out.trim()) || 0 : 0))
    ffprobe.on("error", () => resolve(0))
  })
}

app.listen(PORT, () => console.log(`Video API running on port ${PORT}`))
