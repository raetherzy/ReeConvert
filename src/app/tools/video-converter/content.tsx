"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { VideoIcon, Download, Loader2, X, Clock } from "lucide-react"
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
  }, [])

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  const convert = async () => {
    if (files.length === 0) return

    setProcessing(true)
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

        setStatus(`Converting ${i + 1} of ${files.length}: ${f.name}`)

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
                  setStatus(`Converting: ${f.name} (${msg.speed}x speed)`)
                }
              }
            } catch { /* ignore malformed lines */ }
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
        console.error("Failed:", f.name, err)
      }
    }

    abortRef.current = null
    setProgress(100)
    setResults(converted)
    setStatus("")
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

  return (
    <div className="space-y-6">
      {!results && (
        <>
          <FileUploader
            onFilesSelected={handleFiles}
            accept="video/*"
            multiple
            label="Drop your video files here"
            hint="Convert between MP4, MOV, WEBM. Files are processed on a fast cloud server. Max 200 MB per file."
          />

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                  <p className="text-sm font-medium">{files.length} file(s) selected</p>
                  <button onClick={() => setFiles([])} className="text-xs text-muted-foreground hover:text-destructive">Clear all</button>
                </div>

                <div className="space-y-2 max-h-48 overflow-auto">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-xs truncate flex-1">{f.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button onClick={() => removeFile(i)} className="shrink-0 text-muted-foreground hover:text-destructive">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                  <p className="text-sm font-medium">Convert to</p>
                  <div className="flex gap-2">
                    {formats.map((f) => (
                      <Button key={f.value} variant={format === f.value ? "default" : "outline"} size="sm" onClick={() => setFormat(f.value)}>{f.label}</Button>
                    ))}
                  </div>
                  <p className="text-xs text-emerald-600">Processed on 4-core cloud server. Native FFmpeg, much faster than browser.</p>
                </div>

                <div className="flex justify-center gap-2">
                  <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base" onClick={convert} disabled={processing}>
                    {processing ? <><Loader2 className="size-5 animate-spin mr-2" />{status}</> : <><VideoIcon className="size-5 mr-2" />Convert {files.length} Video(s)</>}
                  </Button>
                  {processing && (
                    <Button variant="outline" size="lg" className="h-12 px-6 rounded-xl" onClick={cancel}>
                      Cancel
                    </Button>
                  )}
                </div>

                {processing && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin text-amber-500" />
                        {status}
                      </span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock className="size-3" />
                        {Math.floor(elapsed / 60000)}:{String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0")}
                      </span>
                    </div>
                    <Progress value={Math.max(progress, 2)} className="h-3 max-w-full" />
                    <p className="text-center text-xs font-medium tabular-nums">{Math.max(progress, 2)}%</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {results && (
        <motion.div className="space-y-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }}>
          <div className="text-center py-4">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto mb-4">
              <VideoIcon className="size-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold">Converted!</h2>
            <p className="text-muted-foreground mt-1">{results.length} video(s) ready</p>
          </div>

          <div className="space-y-2 max-h-96 overflow-auto">
            {results.map(({ name, data }, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <VideoIcon className="size-5 text-brand-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">{(data.byteLength / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDownload(data, name)}>
                  <Download className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button className="gradient-brand text-white h-11 px-6 rounded-xl" onClick={handleDownloadAll}>
              <Download className="size-4 mr-2" />Download All (ZIP)
            </Button>
            <Button variant="outline" className="h-11 px-6 rounded-xl" onClick={() => { setResults(null); setFiles([]) }}>
              Convert More
            </Button>
          </div>

          {status && <p className="text-center text-xs text-muted-foreground">{status}</p>}
        </motion.div>
      )}
    </div>
  )
}
