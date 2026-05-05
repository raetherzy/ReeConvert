"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { splitPDF, splitPDFAllPages, downloadBlob } from "@/lib/converters/pdf"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Scissors, Download, Loader2, FileIcon } from "lucide-react"
import { motion } from "framer-motion"
import JSZip from "jszip"

const tool = tools.find((t) => t.id === "split-pdf")!

export default function SplitPDFPage() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Uint8Array[] | null>(null)
  const [splitMode, setSplitMode] = useState<"all" | "range">("all")
  const [rangeText, setRangeText] = useState("")
  const [totalPages, setTotalPages] = useState(0)

  const handleFileSelected = useCallback(async (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
      setResults(null)
      const arrayBuffer = await newFiles[0].arrayBuffer()
      const { PDFDocument } = await import("pdf-lib-with-encrypt")
      const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      setTotalPages(doc.getPageCount())
    }
  }, [])

  const handleSplit = async () => {
    if (!file) return
    setProcessing(true)
    setProgress(20)
    try {
      let splitResults: Uint8Array[]
      if (splitMode === "all") {
        splitResults = await splitPDFAllPages(file)
      } else {
        const ranges = parseRanges(rangeText, totalPages)
        if (ranges.length === 0) {
          splitResults = await splitPDFAllPages(file)
        } else {
          splitResults = await splitPDF(file, ranges)
        }
      }
      setProgress(100)
      setResults(splitResults)
    } catch (err) {
      console.error("Split failed:", err)
    } finally {
      setProcessing(false)
    }
  }

  const parseRanges = (text: string, max: number) => {
    const ranges: { start: number; end: number }[] = []
    const parts = text.split(/[,;\s]+/).filter(Boolean)
    for (const part of parts) {
      const match = part.match(/^(\d+)(?:-(\d+))?$/)
      if (match) {
        const start = parseInt(match[1])
        const end = match[2] ? parseInt(match[2]) : start
        if (start > 0 && end <= max) {
          ranges.push({ start, end })
        }
      }
    }
    return ranges
  }

  const handleDownload = async (data: Uint8Array, index?: number) => {
    const baseName = file!.name.replace(/\.pdf$/i, "")
    const filename = index !== undefined
      ? `${baseName}_page${index + 1}.pdf`
      : `${baseName}_split.pdf`
    downloadBlob(data, filename)
  }

  const handleDownloadAll = async () => {
    if (!results || !file) return
    const zip = new JSZip()
    const baseName = file.name.replace(/\.pdf$/i, "")
    results.forEach((data, i) => {
      zip.file(`${baseName}_page${i + 1}.pdf`, data)
    })
    const content = await zip.generateAsync({ type: "blob" })
    const url = URL.createObjectURL(content)
    const link = document.createElement("a")
    link.href = url
    link.download = `${baseName}_split.zip`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {!results && (
          <>
            <FileUploader
              onFilesSelected={handleFileSelected}
              accept=".pdf"
              label="Drop your PDF file here"
              hint="Upload a PDF to split into individual pages or custom ranges."
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
                  <span className="text-xs text-muted-foreground">{totalPages} pages</span>
                </div>

                <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                  <p className="text-sm font-medium">Split mode</p>
                  <div className="flex gap-2">
                    <Button
                      variant={splitMode === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSplitMode("all")}
                    >
                      Extract all pages
                    </Button>
                    <Button
                      variant={splitMode === "range" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSplitMode("range")}
                    >
                      Custom ranges
                    </Button>
                  </div>
                  {splitMode === "range" && (
                    <div>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm"
                        placeholder={`e.g. 1-3, 5, 7-${totalPages}`}
                        value={rangeText}
                        onChange={(e) => setRangeText(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Use commas to separate ranges. Example: 1-3, 5, 7-10
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base"
                    onClick={handleSplit}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="size-5 animate-spin mr-2" />
                        Splitting...
                      </>
                    ) : (
                      <>
                        <Scissors className="size-5 mr-2" />
                        Split PDF
                      </>
                    )}
                  </Button>
                </div>

                {processing && (
                  <div className="text-center">
                    <Progress value={progress} className="h-2 max-w-md mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Processing...</p>
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
                <Scissors className="size-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold">PDF Split!</h2>
              <p className="text-muted-foreground mt-1">
                {results.length} page{results.length > 1 ? "s" : ""} extracted
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-auto">
              {results.map((data, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileIcon className="size-5 text-brand-500 shrink-0" />
                    <span className="text-sm truncate">
                      {file!.name.replace(/\.pdf$/i, "")}_page{i + 1}.pdf
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(data, i)}
                  >
                    <Download className="size-4" />
                  </Button>
                </div>
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
                Split Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
