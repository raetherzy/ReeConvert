"use client"

import { useState, useCallback, useEffect } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { compressVideo, setFFmpegMode, isMultiThreadSupported } from "@/lib/converters/media"
import { formatFileSize } from "@/lib/converters/pdf"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shrink, Download, Loader2, Cpu } from "lucide-react"
import { motion } from "framer-motion"

export default function Content() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ data: Uint8Array; name: string } | null>(null)
  const [crf, setCrf] = useState(28)
  const [status, setStatus] = useState("")
  const [multiCore, setMultiCore] = useState(false)
  const originalSize = file?.size ?? 0

  useEffect(() => {
    if (isMultiThreadSupported()) {
      setMultiCore(true)
      setFFmpegMode(true)
    }
  }, [])

  const handleFile = useCallback((f: File[]) => {
    if (f.length) { setFile(f[0]); setResult(null) }
  }, [])

  const compress = async () => {
    if (!file) return
    if (file.size > 200 * 1024 * 1024) {
      setStatus("File too large. Max 200 MB.")
      return
    }
    setProcessing(true)
    setProgress(10)
    setStatus("Loading FFmpeg (~31 MB)...")
    try {
      const r = await compressVideo(file, crf)
      setProgress(100)
      setResult(r)
      setStatus("")
    } catch (err) {
      console.error(err)
      setStatus("Compression failed")
    } finally {
      setProcessing(false)
    }
  }

  const ratio = result ? Math.round((1 - result.data.byteLength / originalSize) * 100) : 0

  return (
    <div className="space-y-6">
      {!result && (
        <>
          <FileUploader onFilesSelected={handleFile} accept="video/*" label="Drop your video file" hint="Compress video by adjusting quality. FFmpeg loads on first use (~31 MB)." />
          {file && (
            <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-sm truncate flex-1">{file.name}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                <p className="text-sm font-medium">Quality: CRF {crf}</p>
                <input type="range" min="18" max="40" value={crf} onChange={(e) => setCrf(Number(e.target.value))} className="w-full accent-brand-500" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Higher quality (larger)</span>
                  <span>Smaller file</span>
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
              </div>
              <div className="flex justify-center">
                <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base" onClick={compress} disabled={processing}>
                  {processing ? <><Loader2 className="size-5 animate-spin mr-2" />{status}</> : <><Shrink className="size-5 mr-2" />Compress</>}
                </Button>
              </div>
              {processing && <div className="text-center"><Progress value={progress} className="h-2 max-w-md mx-auto" /></div>}
            </motion.div>
          )}
        </>
      )}
      {result && (
        <motion.div className="text-center space-y-6 py-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }}>
          <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto"><Shrink className="size-10 text-emerald-500" /></div>
          <div>
            <h2 className="text-xl font-semibold">Compressed!</h2>
            <p className="text-muted-foreground mt-1">{formatFileSize(originalSize)} to {formatFileSize(result.data.byteLength)} ({ratio}%)</p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-8 rounded-xl" onClick={() => {
              const ext = file!.name.split(".").pop() || "mp4"
              const blob = new Blob([result.data as unknown as BlobPart], { type: `video/${ext}` })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url; a.download = result.name; a.click()
              URL.revokeObjectURL(url)
            }}><Download className="size-5 mr-2" />Download</Button>
            <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl" onClick={() => { setResult(null); setFile(null) }}>Compress Another</Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
