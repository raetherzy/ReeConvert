"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { compressImage } from "@/lib/converters/image"
import { formatFileSize } from "@/lib/converters/pdf"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shrink, Download, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

const tool = tools.find((t) => t.id === "image-compress")!

export default function ImageCompressPage() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null)
  const [quality, setQuality] = useState(80)
  const originalSize = file?.size ?? 0

  const handleFileSelected = useCallback((newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
      setResult(null)
    }
  }, [])

  const handleCompress = async () => {
    if (!file) return
    setProcessing(true)
    setProgress(20)
    try {
      const blob = await compressImage(file, {
        quality: quality / 100,
        maxWidthOrHeight: 2560,
      })
      const baseName = file.name.replace(/\.[^.]+$/, "")
      setProgress(100)
      setResult({ blob, name: `${baseName}_compressed.${file.name.split(".").pop()}` })
    } catch (err) {
      console.error("Compress failed:", err)
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const url = URL.createObjectURL(result.blob)
    const link = document.createElement("a")
    link.href = url
    link.download = result.name
    link.click()
    URL.revokeObjectURL(url)
  }

  const ratio = result ? Math.round((1 - result.blob.size / originalSize) * 100) : 0

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {!result && (
          <>
            <FileUploader
              onFilesSelected={handleFileSelected}
              accept="image/jpeg,image/png,image/webp"
              label="Drop your image here"
              hint="Compress JPG, PNG, or WEBP images while keeping good quality."
            />

            {file && (
              <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                  <p className="text-sm font-medium">Quality: {quality}%</p>
                  <input type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-brand-500" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base" onClick={handleCompress} disabled={processing}>
                    {processing ? <><Loader2 className="size-5 animate-spin mr-2" />Compressing...</> : <><Shrink className="size-5 mr-2" />Compress</>}
                  </Button>
                </div>

                {processing && <div className="text-center"><Progress value={progress} className="h-2 max-w-md mx-auto" /></div>}
              </motion.div>
            )}
          </>
        )}

        {result && (
          <motion.div className="text-center space-y-6 py-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto">
              <Shrink className="size-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Compressed!</h2>
              <p className="text-muted-foreground mt-1">
                {formatFileSize(originalSize)} → {formatFileSize(result.blob.size)} ({ratio}% smaller)
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-8 rounded-xl" onClick={handleDownload}>
                <Download className="size-5 mr-2" />Download
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl" onClick={() => { setResult(null); setFile(null) }}>
                Compress Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
