"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { resizeImage } from "@/lib/converters/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Maximize, Download, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

const tool = tools.find((t) => t.id === "image-resize")!

const presets = [
  { label: "Icon", w: 64, h: 64 },
  { label: "Thumbnail", w: 256, h: 256 },
  { label: "HD", w: 1280, h: 720 },
  { label: "Full HD", w: 1920, h: 1080 },
]

export default function ImageResizePage() {
  const [file, setFile] = useState<File | null>(null)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null)

  const handleFileSelected = useCallback((newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
      setResult(null)
    }
  }, [])

  const handleResize = async () => {
    if (!file) return
    setProcessing(true)
    try {
      const blob = await resizeImage(file, width, height)
      const baseName = file.name.replace(/\.[^.]+$/, "")
      setResult({ blob, name: `${baseName}_${width}x${height}.${file.name.split(".").pop()}` })
    } catch (err) {
      console.error("Resize failed:", err)
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

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {!result && (
          <>
            <FileUploader
              onFilesSelected={handleFileSelected}
              accept="image/jpeg,image/png,image/webp"
              label="Drop your image here"
              hint="Resize your image to exact dimensions."
            />

            {file && (
              <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
                  <p className="text-sm font-medium">Presets</p>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <Button key={p.label} variant="outline" size="sm" onClick={() => { setWidth(p.w); setHeight(p.h) }}>
                        {p.label} ({p.w}×{p.h})
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Width</label>
                      <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm" />
                    </div>
                    <span className="text-muted-foreground mt-5">×</span>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Height</label>
                      <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base" onClick={handleResize} disabled={processing}>
                    {processing ? <><Loader2 className="size-5 animate-spin mr-2" />Resizing...</> : <><Maximize className="size-5 mr-2" />Resize</>}
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}

        {result && (
          <motion.div className="text-center space-y-6 py-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto">
              <Maximize className="size-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Resized!</h2>
              <p className="text-muted-foreground mt-1">{width}×{height}</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-8 rounded-xl" onClick={handleDownload}>
                <Download className="size-5 mr-2" />Download
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl" onClick={() => { setResult(null); setFile(null) }}>
                Resize Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
