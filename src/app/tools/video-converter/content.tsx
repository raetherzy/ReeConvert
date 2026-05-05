"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { convertVideo } from "@/lib/converters/media"
import { downloadBlob } from "@/lib/converters/pdf"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { VideoIcon, Download, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

const formats = [
  { value: "mp4" as const, label: "MP4" },
  { value: "webm" as const, label: "WEBM" },
  { value: "mov" as const, label: "MOV" },
]

export default function Content() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<"mp4" | "webm" | "mov">("mp4")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ data: Uint8Array; name: string } | null>(null)
  const [status, setStatus] = useState("")

  const handleFile = useCallback((f: File[]) => {
    if (f.length) { setFile(f[0]); setResult(null) }
  }, [])

  const convert = async () => {
    if (!file) return
    if (file.size > 200 * 1024 * 1024) {
      setStatus("File too large. Max 200 MB for browser conversion.")
      return
    }
    setProcessing(true)
    setProgress(10)
    setStatus("Loading FFmpeg (~31 MB)...")
    try {
      const r = await convertVideo(file, format)
      setProgress(100)
      setResult(r)
      setStatus("")
    } catch (err) {
      console.error(err)
      setStatus("Conversion failed")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {!result && (
        <>
          <FileUploader onFilesSelected={handleFile} accept="video/*" label="Drop your video file" hint="Convert between MP4, MOV, WEBM. Max 200 MB. FFmpeg loads on first use (~31 MB)." />
          {file && (
            <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                <p className="text-sm font-medium">Convert to</p>
                <div className="flex gap-2">
                  {formats.map((f) => (
                    <Button key={f.value} variant={format === f.value ? "default" : "outline"} size="sm" onClick={() => setFormat(f.value)}>{f.label}</Button>
                  ))}
                </div>
                <p className="text-xs text-amber-500">Note: Browser conversion is slow for large videos. Best for clips under 50 MB.</p>
              </div>
              <div className="flex justify-center">
                <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base" onClick={convert} disabled={processing}>
                  {processing ? <><Loader2 className="size-5 animate-spin mr-2" />{status}</> : <><VideoIcon className="size-5 mr-2" />Convert Video</>}
                </Button>
              </div>
              {processing && <div className="text-center"><Progress value={progress} className="h-2 max-w-md mx-auto" /></div>}
            </motion.div>
          )}
        </>
      )}
      {result && (
        <motion.div className="text-center space-y-6 py-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }}>
          <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto"><VideoIcon className="size-10 text-emerald-500" /></div>
          <div><h2 className="text-xl font-semibold">Converted!</h2><p className="text-muted-foreground mt-1">{result.name}</p></div>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-8 rounded-xl" onClick={() => downloadBlob(result.data, result.name, format === "mp4" ? "video/mp4" : `video/${format}`)}><Download className="size-5 mr-2" />Download</Button>
            <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl" onClick={() => { setResult(null); setFile(null) }}>Convert Another</Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
