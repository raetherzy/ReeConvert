"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { extractTextFromImage } from "@/lib/converters/ocr"
import { downloadText } from "@/lib/converters/document"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScanText, Download, Loader2, CopyCheck } from "lucide-react"
import { motion } from "framer-motion"

const languages = [
  { value: "eng", label: "English" },
  { value: "ind", label: "Indonesian" },
  { value: "msa", label: "Malay" },
  { value: "spa", label: "Spanish" },
  { value: "fra", label: "French" },
  { value: "deu", label: "German" },
  { value: "jpn", label: "Japanese" },
  { value: "chi_sim", label: "Chinese (Simplified)" },
]

export default function Content() {
  const [file, setFile] = useState<File | null>(null)
  const [lang, setLang] = useState("eng")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState("")

  const handleFile = useCallback((f: File[]) => {
    if (f.length) { setFile(f[0]); setResult(null) }
  }, [])

  const extract = async () => {
    if (!file) return
    setProcessing(true)
    setProgress(10)
    setStatus("Loading OCR engine...")
    try {
      const text = await extractTextFromImage(file, lang)
      setProgress(100)
      setResult(text)
      setStatus("")
    } catch (err) {
      console.error(err)
      setStatus("OCR failed")
    } finally {
      setProcessing(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {!result && (
        <>
          <FileUploader onFilesSelected={handleFile} accept="image/*" label="Drop your image or screenshot" hint="Extract text from images using Tesseract OCR. Works offline after engine loads (~10 MB)." />
          {file && (
            <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
                <p className="text-sm font-medium">Language</p>
                <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm">
                  {languages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div className="flex justify-center">
                <Button size="lg" className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base" onClick={extract} disabled={processing}>
                  {processing ? <><Loader2 className="size-5 animate-spin mr-2" />{status}</> : <><ScanText className="size-5 mr-2" />Extract Text</>}
                </Button>
              </div>
              {processing && <div className="text-center"><Progress value={progress} className="h-2 max-w-md mx-auto" /></div>}
            </motion.div>
          )}
        </>
      )}
      {result && (
        <motion.div className="space-y-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1 }}>
          <div className="text-center py-4">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/10 mx-auto mb-4"><ScanText className="size-10 text-emerald-500" /></div>
            <h2 className="text-xl font-semibold">Text Extracted!</h2>
          </div>
          <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 max-h-96 overflow-auto">
            <pre className="text-sm whitespace-pre-wrap font-sans">{result.slice(0, 10000)}{result.length > 10000 && "\n\n..."}</pre>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button className="gradient-brand text-white h-11 px-6 rounded-xl" onClick={() => downloadText(result, "ocr_result.txt")}><Download className="size-4 mr-2" />Download TXT</Button>
            <Button variant="outline" className="h-11 px-6 rounded-xl" onClick={handleCopy}>{copied ? <><CopyCheck className="size-4 mr-2" />Copied!</> : "Copy Text"}</Button>
            <Button variant="outline" className="h-11 px-6 rounded-xl" onClick={() => { setResult(null); setFile(null) }}>Scan Another</Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
