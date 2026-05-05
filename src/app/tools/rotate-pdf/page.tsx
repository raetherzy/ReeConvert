"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { rotatePDF, downloadBlob } from "@/lib/converters/pdf"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RotateCw, Download, Loader2, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"

const tool = tools.find((t) => t.id === "rotate-pdf")!

export default function RotatePDFPage() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Uint8Array | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [rotations, setRotations] = useState<Map<number, number>>(new Map())

  const handleFileSelected = useCallback(async (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
      setResult(null)
      setRotations(new Map())
      const arrayBuffer = await newFiles[0].arrayBuffer()
      const { PDFDocument } = await import("pdf-lib-with-encrypt")
      const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      setTotalPages(doc.getPageCount())
    }
  }, [])

  const toggleRotation = (pageIndex: number) => {
    setRotations((prev) => {
      const next = new Map(prev)
      const current = next.get(pageIndex) || 0
      const newAngle = ((current + 90) % 360) as 90 | 180 | 270 | 0
      if (newAngle === 0) {
        next.delete(pageIndex)
      } else {
        next.set(pageIndex, newAngle)
      }
      return next
    })
  }

  const getRotationLabel = (pageIndex: number) => {
    const angle = rotations.get(pageIndex) || 0
    return `${angle}\u00B0`
  }

  const handleRotate = async () => {
    if (!file) return
    setProcessing(true)
    setProgress(20)
    try {
      const rotationArr = Array.from(rotations.entries()).map(([pageIndex, angle]) => ({
        pageIndex,
        angle: angle as 90 | 180 | 270,
      }))
      const rotated = await rotatePDF(file, rotationArr)
      setProgress(100)
      setResult(rotated)
    } catch (err) {
      console.error("Rotate failed:", err)
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
              onFilesSelected={handleFileSelected}
              accept=".pdf"
              label="Drop your PDF file here"
              hint="Select pages to rotate them 90°, 180°, or 270°."
            />

            {file && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="rounded-2xl border border-border/50 bg-card p-5">
                  <p className="text-sm font-medium mb-4">
                    Click a page to rotate it clockwise ({totalPages} pages)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => toggleRotation(i)}
                        className="relative flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-4 hover:border-brand-500/30 hover:bg-muted/50 transition-all cursor-pointer"
                      >
                        <span
                          className="text-2xl transition-transform"
                          style={{
                            transform: `rotate(${rotations.get(i) || 0}deg)`,
                          }}
                        >
                          <RotateCcw className="size-8 text-brand-500" />
                        </span>
                        <span className="text-xs font-medium">Page {i + 1}</span>
                        <span className="text-xs text-muted-foreground">
                          {getRotationLabel(i)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base"
                    onClick={handleRotate}
                    disabled={processing || rotations.size === 0}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="size-5 animate-spin mr-2" />
                        Rotating...
                      </>
                    ) : (
                      <>
                        <RotateCw className="size-5 mr-2" />
                        Rotate PDF
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
              <RotateCw className="size-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">PDF Rotated!</h2>
              <p className="text-muted-foreground mt-1">Pages have been rotated.</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-8 rounded-xl"
                onClick={() => downloadBlob(result, file!.name.replace(/\.pdf$/i, "_rotated.pdf"))}
              >
                <Download className="size-5 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl"
                onClick={() => { setResult(null); setFile(null) }}
              >
                Rotate Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
