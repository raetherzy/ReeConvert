"use client"

import { useState, useCallback, useEffect } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { convertVideo, setFFmpegMode, isMultiThreadSupported } from "@/lib/converters/media"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { VideoIcon, Download, Loader2, X, Cpu } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import JSZip from "jszip"

const formats = [
  { value: "mp4" as const, label: "MP4" },
  { value: "webm" as const, label: "WEBM" },
  { value: "mov" as const, label: "MOV" },
]

export default function Content() {
  const [files, setFiles] = useState<File[]>([])
  const [format, setFormat] = useState<"mp4" | "webm" | "mov">("mp4")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ data: Uint8Array; name: string }[] | null>(null)
  const [status, setStatus] = useState("")
  const [multiCore, setMultiCore] = useState(false)

  useEffect(() => {
    if (isMultiThreadSupported()) {
      setMultiCore(true)
      setFFmpegMode(true)
    }
  }, [])

  const handleFiles = useCallback((f: File[]) => {
    setFiles(f)
    setResults(null)
  }, [])

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  const convert = async () => {
    if (files.length === 0) return

    const totalSize = files.reduce((s, f) => s + f.size, 0)
    if (totalSize > 500 * 1024 * 1024) {
      setStatus("Total file size exceeds 500 MB limit.")
      return
    }

    setProcessing(true)
    setStatus("Loading FFmpeg engine (~31 MB)...")
    setProgress(5)

    const converted: { data: Uint8Array; name: string }[] = []

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      setProgress(5 + Math.round((i / files.length) * 90))
      setStatus(`Converting ${i + 1} of ${files.length}: ${f.name}`)
      try {
        const r = await convertVideo(f, format)
        converted.push(r)
      } catch (err) {
        console.error("Failed:", f.name, err)
      }
    }

    setProgress(100)
    setResults(converted)
    setStatus("")
    setProcessing(false)
  }

  const handleDownload = (data: Uint8Array, name: string) => {
    const mime = format === "mp4" ? "video/mp4" : `video/${format}`
    const blob = new Blob([data.buffer as ArrayBuffer], { type: mime })
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

  const mimeLabel = (fmt: string) => {
    if (fmt === "mp4") return "video/mp4"
    return `video/${fmt}`
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
            hint="Convert between MP4, MOV, WEBM. Select multiple files at once. Max 500 MB total. FFmpeg loads on first use (~31 MB)."
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
                  {isMultiThreadSupported() && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                      <Cpu className="size-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Multi-core:</span>
                      <button
                        onClick={() => { setMultiCore(!multiCore); setFFmpegMode(!multiCore) }}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${
                          multiCore ? "bg-emerald-500/10 text-emerald-500 font-medium" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {multiCore ? "ON (faster)" : "OFF"}
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-amber-500">MOV/MP4 same codec uses instant remux. Other formats re-encode.</p>
                </div>

                <div className="flex justify-center">
                  <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base" onClick={convert} disabled={processing}>
                    {processing ? <><Loader2 className="size-5 animate-spin mr-2" />{status}</> : <><VideoIcon className="size-5 mr-2" />Convert {files.length} Video(s)</>}
                  </Button>
                </div>

                {processing && (
                  <div className="text-center">
                    <Progress value={progress} className="h-2 max-w-md mx-auto" />
                    <p className="text-xs text-muted-foreground mt-2">{status}</p>
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
