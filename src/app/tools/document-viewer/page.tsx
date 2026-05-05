"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { docxToHtml } from "@/lib/converters/document"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

const tool = tools.find((t) => t.id === "document-viewer")!

export default function DocumentViewerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [html, setHtml] = useState<string | null>(null)

  const handleFileSelected = useCallback((newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
      setHtml(null)
    }
  }, [])

  const handleView = async () => {
    if (!file) return
    setProcessing(true)
    try {
      const result = await docxToHtml(file)
      setHtml(result)
    } catch (err) {
      console.error("View failed:", err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {!html && (
          <>
            <FileUploader
              onFilesSelected={handleFileSelected}
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              label="Drop your DOCX file here"
              hint="View DOCX content directly in your browser. No upload, private."
            />

            {file && (
              <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-center">
                  <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base" onClick={handleView} disabled={processing}>
                    {processing ? <><Loader2 className="size-5 animate-spin mr-2" />Loading...</> : <><Eye className="size-5 mr-2" />View Document</>}
                  </Button>
                </div>
                {processing && <div className="text-center"><Progress value={50} className="h-2 max-w-md mx-auto" /></div>}
              </motion.div>
            )}
          </>
        )}

        {html && (
          <motion.div className="space-y-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }}>
            <div className="rounded-2xl border border-border/50 bg-card p-6 max-h-[600px] overflow-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
            <div className="flex justify-center">
              <Button variant="outline" className="h-11 px-6 rounded-xl" onClick={() => { setHtml(null); setFile(null) }}>
                View Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
