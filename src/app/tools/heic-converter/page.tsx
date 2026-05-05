"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { convertHeic } from "@/lib/converters/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Images, Download, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

const tool = tools.find((t) => t.id === "heic-converter")!

export default function HeicConverterPage() {
  const [file, setFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState<"jpg" | "png">("jpg")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null)

  const handleFileSelected = useCallback((newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
      setResult(null)
    }
  }, [])

  const handleConvert = async () => {
    if (!file) return
    setProcessing(true)
    setProgress(20)
    try {
      const blob = await convertHeic(file, targetFormat)
      const baseName = file.name.replace(/\.[^.]+$/, "")
      setProgress(100)
      setResult({ blob, name: `${baseName}.${targetFormat}` })
    } catch (err) {
      console.error("HEIC conversion failed:", err)
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
              accept=".heic,.heif,image/heic,image/heif"
              label="Drop your HEIC file here"
              hint="Convert iPhone HEIC photos to JPG or PNG. Works entirely in your browser."
            />

            {file && (
              <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                  <p className="text-sm font-medium">Convert to</p>
                  <div className="flex gap-2">
                    <Button variant={targetFormat === "jpg" ? "default" : "outline"} size="sm" onClick={() => setTargetFormat("jpg")}>JPG</Button>
                    <Button variant={targetFormat === "png" ? "default" : "outline"} size="sm" onClick={() => setTargetFormat("png")}>PNG</Button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base" onClick={handleConvert} disabled={processing}>
                    {processing ? <><Loader2 className="size-5 animate-spin mr-2" />Converting...</> : <><Images className="size-5 mr-2" />Convert HEIC</>}
                  </Button>
                </div>

                {processing && (
                  <div className="text-center">
                    <Progress value={progress} className="h-2 max-w-md mx-auto" />
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}

        {result && (
          <motion.div className="text-center space-y-6 py-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto">
              <Images className="size-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">HEIC Converted!</h2>
              <p className="text-muted-foreground mt-1">{result.name}</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-8 rounded-xl" onClick={handleDownload}>
                <Download className="size-5 mr-2" />Download
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl" onClick={() => { setResult(null); setFile(null) }}>
                Convert Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
