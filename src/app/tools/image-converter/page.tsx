"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { convertImage } from "@/lib/converters/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ImageIcon, Download, Loader2, FileImage } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import JSZip from "jszip"

const tool = tools.find((t) => t.id === "image-converter")!

const formats = [
  { value: "jpg" as const, label: "JPG" },
  { value: "png" as const, label: "PNG" },
  { value: "webp" as const, label: "WEBP" },
]

export default function ImageConverterPage() {
  const [files, setFiles] = useState<File[]>([])
  const [targetFormat, setTargetFormat] = useState<"jpg" | "png" | "webp">("png")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ blob: Blob; name: string }[] | null>(null)
  const [status, setStatus] = useState("")

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles)
    setResults(null)
  }, [])

  const handleConvert = async () => {
    if (files.length === 0) return
    setProcessing(true)
    setStatus(`Converting ${files.length} file(s)...`)

    const converted: { blob: Blob; name: string }[] = []

    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round((i / files.length) * 100))
      setStatus(`Converting ${i + 1} of ${files.length}: ${files[i].name}`)
      try {
        const blob = await convertImage(files[i], targetFormat)
        const baseName = files[i].name.replace(/\.[^.]+$/, "")
        converted.push({ blob, name: `${baseName}.${targetFormat}` })
      } catch (err) {
        console.error("Failed:", files[i].name, err)
      }
    }

    setProgress(100)
    setResults(converted)
    setStatus("")
    setProcessing(false)
  }

  const handleDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadAll = async () => {
    if (!results) return
    const zip = new JSZip()
    results.forEach(({ blob, name }) => zip.file(name, blob))
    const content = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(content)
    const a = document.createElement("a")
    a.href = url; a.download = "images_converted.zip"; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {!results && (
          <>
            <FileUploader
              onFilesSelected={handleFilesSelected}
              accept="image/jpeg,image/png,image/webp"
              multiple
              label="Drop your images here"
              hint="Convert JPG, PNG, WEBP between formats. Select multiple at once."
            />

            <AnimatePresence>
              {files.length > 0 && (
                <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                    <p className="text-sm font-medium">{files.length} file(s) selected</p>
                    <button onClick={() => setFiles([])} className="text-xs text-muted-foreground hover:text-destructive">Clear all</button>
                  </div>

                  <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                    <p className="text-sm font-medium">Convert to</p>
                    <div className="flex gap-2">
                      {formats.map((fmt) => (
                        <Button key={fmt.value} variant={targetFormat === fmt.value ? "default" : "outline"} size="sm" onClick={() => setTargetFormat(fmt.value)}>{fmt.label}</Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base" onClick={handleConvert} disabled={processing}>
                      {processing ? <><Loader2 className="size-5 animate-spin mr-2" />{status}</> : <><ImageIcon className="size-5 mr-2" />Convert {files.length} File(s)</>}
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
                <ImageIcon className="size-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold">Converted!</h2>
              <p className="text-muted-foreground mt-1">{results.length} file(s) ready</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-auto p-1">
              {results.map(({ name, blob }, i) => (
                <button
                  key={i}
                  onClick={() => handleDownload(blob, name)}
                  className="group relative flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-4 hover:border-brand-500/30 hover:bg-muted/50 transition-all cursor-pointer"
                >
                  <div className="flex size-14 items-center justify-center rounded-xl bg-brand-500/10">
                    <FileImage className="size-7 text-brand-500" />
                  </div>
                  <span className="text-xs font-medium text-center truncate w-full">{name}</span>
                  <Download className="size-4 text-muted-foreground group-hover:text-brand-500 transition-colors" />
                </button>
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
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
