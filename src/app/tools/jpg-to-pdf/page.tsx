"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { imagesToPDFA4, downloadBlob } from "@/lib/converters/pdf"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Image, Download, Loader2, FileImage } from "lucide-react"
import { motion } from "framer-motion"

const tool = tools.find((t) => t.id === "jpg-to-pdf")!

export default function JPGToPDFPage() {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Uint8Array | null>(null)

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles)
    setResult(null)
  }, [])

  const handleConvert = async () => {
    if (files.length === 0) return
    setProcessing(true)
    setProgress(20)
    try {
      const images = await Promise.all(
        files.map(async (file) => {
          const buffer = await file.arrayBuffer()
          const ext = file.name.split(".").pop()?.toLowerCase()
          return {
            data: new Uint8Array(buffer),
            type: (ext === "jpg" || ext === "jpeg" ? "jpg" : "png") as "jpg" | "png",
          }
        })
      )
      const pdf = await imagesToPDFA4(images)
      setProgress(100)
      setResult(pdf)
    } catch (err) {
      console.error("Conversion failed:", err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {!result && (
          <>
            <FileUploader
              onFilesSelected={handleFilesSelected}
              accept="image/jpeg,image/png,image/webp"
              multiple
              label="Drop your images here"
              hint="JPG, PNG, or WEBP images. Each image becomes a PDF page."
            />

            {files.length > 0 && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {files.map((file, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl border border-border/50 bg-muted/30 flex items-center justify-center overflow-hidden"
                    >
                      <FileImage className="size-8 text-muted-foreground" />
                      <span className="absolute bottom-1 text-[10px] text-muted-foreground">
                        {i + 1}
                      </span>
                    </div>
                  ))}
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
                        <Image className="size-5 mr-2" />
                        Convert to PDF
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

        {result && (
          <motion.div
            className="text-center space-y-6 py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto">
              <Image className="size-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">PDF Created!</h2>
              <p className="text-muted-foreground mt-1">
                {files.length} image{files.length > 1 ? "s" : ""} converted to PDF.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-8 rounded-xl"
                onClick={() =>
                  downloadBlob(result, "images_to_pdf.pdf")
                }
              >
                <Download className="size-5 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl"
                onClick={() => { setResult(null); setFiles([]) }}
              >
                Convert More
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
