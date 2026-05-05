"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { compressPDF, downloadBlob, formatFileSize } from "@/lib/converters/pdf"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shrink, Download, Loader2, FileIcon } from "lucide-react"
import { motion } from "framer-motion"

const tool = tools.find((t) => t.id === "compress-pdf")!

export default function CompressPDFPage() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Uint8Array | null>(null)
  const [originalSize, setOriginalSize] = useState(0)

  const handleFileSelected = useCallback((newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
      setResult(null)
      setOriginalSize(newFiles[0].size)
    }
  }, [])

  const handleCompress = async () => {
    if (!file) return
    setProcessing(true)
    setProgress(20)
    try {
      const compressed = await compressPDF(file)
      setProgress(100)
      setResult(compressed)
    } catch (err) {
      console.error("Compress failed:", err)
    } finally {
      setProcessing(false)
    }
  }

  const compressionRatio = result
    ? Math.round((1 - result.byteLength / originalSize) * 100)
    : 0

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {!result && (
          <>
            <FileUploader
              onFilesSelected={handleFileSelected}
              accept=".pdf"
              label="Drop your PDF file here"
              hint="Reduce PDF file size by optimizing internal structure."
            />

            {file && (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  <FileIcon className="size-5 text-brand-500 shrink-0" />
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                </div>

                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base"
                    onClick={handleCompress}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="size-5 animate-spin mr-2" />
                        Compressing...
                      </>
                    ) : (
                      <>
                        <Shrink className="size-5 mr-2" />
                        Compress PDF
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
              <Shrink className="size-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">PDF Compressed!</h2>
              <p className="text-muted-foreground mt-1">
                Size reduced by {compressionRatio}% ({formatFileSize(originalSize)} →{" "}
                {formatFileSize(result.byteLength)})
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-8 rounded-xl"
                onClick={() =>
                  downloadBlob(result, file!.name.replace(/\.pdf$/i, "_compressed.pdf"))
                }
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
                Compress Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
