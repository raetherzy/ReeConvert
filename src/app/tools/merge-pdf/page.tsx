"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { mergePDFs, downloadBlob } from "@/lib/converters/pdf"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Merge, Download, GripVertical, X, Loader2 } from "lucide-react"
import { motion, AnimatePresence, Reorder } from "framer-motion"

const tool = tools.find((t) => t.id === "merge-pdf")!

export default function MergePDFPage() {
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Uint8Array | null>(null)
  const [resultName, setResultName] = useState("")

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles)
    setResult(null)
  }, [])

  const handleMerge = async () => {
    if (files.length < 2) return
    setProcessing(true)
    setProgress(20)
    try {
      const merged = await mergePDFs(files)
      setProgress(100)
      setResult(merged)
      const baseName = files[0].name.replace(/\.pdf$/i, "")
      setResultName(`${baseName}_merged.pdf`)
    } catch (err) {
      console.error("Merge failed:", err)
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (result) downloadBlob(result, resultName)
  }

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {!result && (
          <>
            <FileUploader
              onFilesSelected={handleFilesSelected}
              accept=".pdf"
              multiple
              label="Drop your PDF files here"
              hint="Select 2 or more PDF files to merge. You can reorder them below."
            />

            <AnimatePresence>
              {files.length > 1 && (
                <motion.div
                  className="rounded-2xl border border-border/50 bg-card p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium">{files.length} files selected</p>
                  </div>
                  <div className="space-y-2">
                    {files.map((file, i) => (
                      <div
                        key={`${file.name}-${i}`}
                        className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3"
                      >
                        <GripVertical className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-muted-foreground shrink-0 w-6">
                          {i + 1}
                        </span>
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <button
                          onClick={() => setFiles(files.filter((_, j) => j !== i))}
                          className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {files.length > 1 && (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base"
                  onClick={handleMerge}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="size-5 animate-spin mr-2" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Merge className="size-5 mr-2" />
                      Merge PDFs
                    </>
                  )}
                </Button>
              </div>
            )}

            {processing && (
              <div className="text-center">
                <Progress value={progress} className="h-2 max-w-md mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Processing your files...</p>
              </div>
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
              <Merge className="size-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">PDFs Merged!</h2>
              <p className="text-muted-foreground mt-1">
                Your files have been combined into one PDF.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-8 rounded-xl"
                onClick={handleDownload}
              >
                <Download className="size-5 mr-2" />
                Download {resultName}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl"
                onClick={() => {
                  setResult(null)
                  setFiles([])
                }}
              >
                Merge More
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
