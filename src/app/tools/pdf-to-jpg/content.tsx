"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { pdfToImages } from "@/lib/converters/image"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileImage, Download, Loader2, ImageIcon } from "lucide-react"
import { motion } from "framer-motion"
import JSZip from "jszip"

export default function PDFToJPGContent() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ name: string; blob: Blob }[] | null>(null)
  const [format, setFormat] = useState<"jpg" | "png">("jpg")

  const handleFileSelected = useCallback((newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
      setResults(null)
    }
  }, [])

  const handleConvert = async () => {
    if (!file) return
    setProcessing(true)
    setProgress(10)
    try {
      const images = await pdfToImages(file, format)
      setProgress(100)
      setResults(images)
    } catch (err) {
      console.error("Conversion failed:", err)
    } finally {
      setProcessing(false)
    }
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
    results.forEach(({ name, blob }) => {
      zip.file(name, blob)
    })
    const content = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(content)
    const link = document.createElement("a")
    link.href = url
    link.download = `${file!.name.replace(/\.pdf$/i, "")}_images.zip`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {!results && (
        <>
          <FileUploader
            onFilesSelected={handleFileSelected}
            accept=".pdf"
            label="Drop your PDF file here"
            hint="Each page will be converted to an image. You can download them individually or as a ZIP."
          />

          {file && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                <p className="text-sm font-medium">Output format</p>
                <div className="flex gap-2">
                  <Button
                    variant={format === "jpg" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormat("jpg")}
                  >
                    JPG
                  </Button>
                  <Button
                    variant={format === "png" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormat("png")}
                  >
                    PNG
                  </Button>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base"
                  onClick={handleConvert}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="size-5 animate-spin mr-2" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileImage className="size-5 mr-2" />
                      Convert to {format.toUpperCase()}
                    </>
                  )}
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

      {results && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-center py-4">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto mb-4">
              <FileImage className="size-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold">Conversion Complete!</h2>
            <p className="text-muted-foreground mt-1">
              {results.length} image{results.length > 1 ? "s" : ""} generated
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-auto p-1">
            {results.map(({ name, blob }, i) => (
              <button
                key={i}
                onClick={() => handleDownload(blob, name)}
                className="group relative flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-4 hover:border-brand-500/30 hover:bg-muted/50 transition-all cursor-pointer"
              >
                <div className="flex size-16 items-center justify-center rounded-xl bg-brand-500/10">
                  <ImageIcon className="size-8 text-brand-500" />
                </div>
                <span className="text-xs font-medium text-center truncate w-full">
                  Page {i + 1}
                </span>
                <Download className="size-4 text-muted-foreground group-hover:text-brand-500 transition-colors" />
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              className="gradient-brand text-white h-11 px-6 rounded-xl"
              onClick={handleDownloadAll}
            >
              <Download className="size-4 mr-2" />
              Download All (ZIP)
            </Button>
            <Button
              variant="outline"
              className="h-11 px-6 rounded-xl"
              onClick={() => { setResults(null); setFile(null) }}
            >
              Convert Another
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
