"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { VideoIcon, Download, X, Clock, Zap, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import JSZip from "jszip"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://62.146.237.6"

const formats = [
  { value: "mp4" as const, label: "MP4" },
  { value: "mov" as const, label: "MOV" },
  { value: "webm" as const, label: "WEBM" },
]

export default function Content() {
  const [files, setFiles] = useState<File[]>([])
  const [format, setFormat] = useState<"mp4" | "webm" | "mov">("mp4")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ data: Uint8Array; name: string }[] | null>(null)
  const [status, setStatus] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!processing) return
    const t0 = Date.now()
    const iv = setInterval(() => setElapsed(Date.now() - t0), 1000)
    return () => clearInterval(iv)
  }, [processing])

  const handleFiles = useCallback((f: File[]) => {
    setFiles(f)
    setResults(null)
    setErrorMsg("")
  }, [])

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0)

  const convert = async () => {
    if (files.length === 0) return

    setProcessing(true)
    setErrorMsg("")
    setElapsed(0)
    setProgress(2)
    setStatus("Warming up server...")

    const converted: { data: Uint8Array; name: string }[] = []

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const fileBase = Math.round((i / files.length) * 100)
      setProgress(Math.max(fileBase, 2))
      setStatus(`Uploading ${i + 1} of ${files.length}: ${f.name}`)

      try {
        setStatus(`Converting ${i + 1} of ${files.length}: ${f.name}`)
        const formData = new FormData()
        formData.append("file", f)

        const controller = new AbortController()
        abortRef.current = controller

        const response = await fetch(`${API_URL}/api/convert`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`)
        }

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let fileId: string | null = null
        let hasError: string | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const msg = JSON.parse(line)
              if (msg.error) {
                hasError = msg.error
              } else if (msg.done && msg.fileId) {
                fileId = msg.fileId
                setProgress(fileBase + Math.round(99 / files.length))
              } else if (msg.progress !== undefined) {
                const overall = fileBase + Math.round(msg.progress / files.length)
                setProgress(Math.min(overall, 99))
                if (msg.speed) {
                  setStatus(`Converting: ${f.name} · ${msg.speed}x`)
                }
              }
            } catch { /* ignore */ }
          }
        }

        if (hasError) throw new Error(hasError)
        if (!fileId) throw new Error("No file returned from server")

        setStatus(`Downloading ${i + 1} of ${files.length}: ${f.name}`)
        const dlRes = await fetch(`${API_URL}/api/download/${fileId}`, {
          signal: controller.signal,
        })
        if (!dlRes.ok) throw new Error(`Download failed (${dlRes.status})`)

        const blob = await dlRes.blob()
        const data = new Uint8Array(await blob.arrayBuffer())
        const baseName = f.name.replace(/\.[^.]+$/, "")
        converted.push({ data, name: `${baseName}.${format}` })
      } catch (err) {
        if ((err as Error).name === "AbortError") break
        const msg = (err as Error).message || String(err)
        console.error("Failed:", f.name, msg)
        setErrorMsg(`"${f.name}": ${msg}`)
      }
    }

    abortRef.current = null
    setProgress(100)
    if (converted.length > 0) {
      setResults(converted)
    } else if (errorMsg) {
      setStatus(errorMsg)
    } else {
      setStatus("Server unreachable. Check your connection and try again.")
    }
    setProcessing(false)
  }

  const cancel = () => {
    abortRef.current?.abort()
    setProcessing(false)
    setProgress(100)
    setStatus("")
  }

  const handleDownload = (data: Uint8Array, name: string) => {
    const mime = format === "mp4" ? "video/mp4" : `video/${format}`
    const blob = new Blob([data as BlobPart], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadAll = async () => {
    if (!results) return
    setStatus("Creating ZIP...")
    const zip = new JSZip()
    results.forEach(({ data, name }) => zip.file(name, data))
    const content = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(content)
    const a = document.createElement("a")
    a.href = url; a.download = "videos_converted.zip"; a.click()
    URL.revokeObjectURL(url)
    setStatus("")
  }

  /* ═══════ Processing State ═══════ */
  if (processing) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <motion.div
          className="w-full max-w-md space-y-6 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Animated icon */}
          <motion.div
            className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-amber-500/10"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Zap className="size-10 text-amber-500" />
          </motion.div>

          <div>
            <h3 className="text-lg font-semibold">Processing Video</h3>
            <p className="text-sm text-muted-foreground mt-1">{status}</p>
          </div>

          <div className="space-y-3">
            <Progress value={Math.max(progress, 3)} className="h-2.5 w-full" />
            <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
              <span>{Math.max(progress, 3)}%</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {Math.floor(elapsed / 60000)}:{String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* File chip */}
          <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-4 py-2 text-sm">
            <VideoIcon className="size-4 text-muted-foreground" />
            <span className="max-w-[200px] truncate">{files[0]?.name}</span>
            {files.length > 1 && (
              <span className="text-xs text-muted-foreground">+{files.length - 1} more</span>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={cancel} className="rounded-full px-6">
            Cancel
          </Button>
        </motion.div>
      </div>
    )
  }

  /* ═══════ Results State ═══════ */
  if (results) {
    return (
      <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="text-center py-4">
          <motion.div
            className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto mb-3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            <VideoIcon className="size-8 text-emerald-500" />
          </motion.div>
          <h2 className="text-xl font-semibold">Ready</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {results.length} file{results.length > 1 ? "s" : ""} converted
          </p>
        </div>

        <div className="space-y-2">
          {results.map(({ name, data }, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3 hover:bg-muted/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <VideoIcon className="size-5 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(data.byteLength)}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleDownload(data, name)}>
                <Download className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button className="gradient-brand text-white h-11 px-6 rounded-xl" onClick={handleDownloadAll}>
            <Download className="size-4 mr-2" />Download All (ZIP)
          </Button>
          <Button
            variant="outline"
            className="h-11 px-6 rounded-xl"
            onClick={() => { setResults(null); setFiles([]) }}
          >
            Convert More
          </Button>
        </div>
      </motion.div>
    )
  }

  /* ═══════ Upload State ═══════ */
  return (
    <div className="space-y-5">
      {/* Step label */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium">1</span>
        <span>Select videos</span>
        <ArrowRight className="size-3.5" />
        <span className="flex items-center justify-center size-6 rounded-full bg-muted/50 text-xs font-medium">2</span>
        <span className="text-muted-foreground/60">Choose format & convert</span>
      </div>

      {/* Upload area — compact when files exist */}
      <AnimatePresence mode="wait">
        {files.length === 0 ? (
          <motion.div key="upload-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <FileUploader
              onFilesSelected={handleFiles}
              accept="video/*"
              multiple
              label="Drop your video files here"
              hint="MOV, MP4, WEBM. Processed on a 4-core cloud server."
            />
          </motion.div>
        ) : (
          <motion.div
            key="upload-compact"
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Compact drop zone */}
            <FileUploader
              onFilesSelected={handleFiles}
              accept="video/*"
              multiple
              label="Add more videos"
              hint=""
              className="!p-6"
            />

            {/* File chips */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5 group hover:bg-muted/50 transition-colors"
                >
                  <VideoIcon className="size-4 text-brand-500 shrink-0" />
                  <span className="text-sm truncate flex-1 font-medium">{f.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{formatSize(f.size)}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="opacity-0 group-hover:opacity-100 shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary + clear */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{files.length} file{files.length > 1 ? "s" : ""} · {formatSize(totalSize)}</span>
              <button onClick={() => setFiles([])} className="hover:text-destructive transition-colors">Clear all</button>
            </div>

            {/* Format selector */}
            <div className="rounded-xl border border-border/40 bg-card/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Convert to</p>
              <div className="flex gap-2">
                {formats.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      format === f.value
                        ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            {/* Status */}
            {!processing && status && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                {status}
              </div>
            )}

            {/* Convert button */}
            <div className="flex justify-center pt-1">
              <Button
                size="lg"
                className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base gap-2"
                onClick={convert}
                disabled={processing}
              >
                <Zap className="size-5" />
                Convert {files.length} Video{files.length > 1 ? "s" : ""}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
