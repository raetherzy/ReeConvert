"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { docxToText, downloadText } from "@/lib/converters/document"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileType, Download, Loader2, CopyCheck } from "lucide-react"
import { motion } from "framer-motion"

const tool = tools.find((t) => t.id === "document-converter")!

export default function DocumentConverterPage() {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ text: string; name: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleFileSelected = useCallback((newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
      setResult(null)
    }
  }, [])

  const handleConvert = async () => {
    if (!file) return
    setProcessing(true)
    try {
      const text = await docxToText(file)
      const baseName = file.name.replace(/\.[^.]+$/, "")
      setResult({ text, name: `${baseName}.txt` })
    } catch (err) {
      console.error("Conversion failed:", err)
    } finally {
      setProcessing(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ToolLayout tool={tool}>
      <div className="space-y-6">
        {!result && (
          <>
            <FileUploader
              onFilesSelected={handleFileSelected}
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              label="Drop your DOCX file here"
              hint="Convert DOCX to plain text. Works entirely in your browser."
            />

            {file && (
              <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-center">
                  <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base" onClick={handleConvert} disabled={processing}>
                    {processing ? <><Loader2 className="size-5 animate-spin mr-2" />Converting...</> : <><FileType className="size-5 mr-2" />Convert to TXT</>}
                  </Button>
                </div>
                {processing && <div className="text-center"><Progress value={50} className="h-2 max-w-md mx-auto" /></div>}
              </motion.div>
            )}
          </>
        )}

        {result && (
          <motion.div className="space-y-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }}>
            <div className="text-center py-4">
              <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto mb-4">
                <FileType className="size-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold">Converted!</h2>
            </div>

            <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 max-h-96 overflow-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans">{result.text.slice(0, 5000)}{result.text.length > 5000 && "\n\n..."}</pre>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button className="gradient-brand text-white h-11 px-6 rounded-xl" onClick={() => downloadText(result.text, result.name)}>
                <Download className="size-4 mr-2" />Download TXT
              </Button>
              <Button variant="outline" className="h-11 px-6 rounded-xl" onClick={handleCopy}>
                {copied ? <><CopyCheck className="size-4 mr-2" />Copied!</> : "Copy Text"}
              </Button>
              <Button variant="outline" className="h-11 px-6 rounded-xl" onClick={() => { setResult(null); setFile(null) }}>
                Convert Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
