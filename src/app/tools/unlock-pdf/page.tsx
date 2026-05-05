"use client"

import { useState, useCallback, useRef } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { unlockPDF, downloadBlob } from "@/lib/converters/pdf"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Unlock, Download, Loader2, LockKeyhole, Cpu } from "lucide-react"
import { motion } from "framer-motion"

const tool = tools.find((t) => t.id === "unlock-pdf")!

export default function UnlockPDFPage() {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Uint8Array | null>(null)
  const [error, setError] = useState("")
  const [engine, setEngine] = useState<"lib" | "qpdf">("lib")

  const handleFileSelected = useCallback((newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
      setResult(null)
      setError("")
    }
  }, [])

  const handleUnlock = async () => {
    if (!file) return
    setProcessing(true)
    setProgress(20)
    setError("")

    try {
      if (engine === "qpdf") {
        await handleUnlockQpdf()
      } else {
        await handleUnlockLib()
      }
    } catch (err) {
      if (engine === "qpdf") {
        setError("QPDF engine unavailable. Try 'Library' mode instead.")
      } else {
        setError("Failed to unlock. Check your password or the file may not be encrypted.")
      }
      setProcessing(false)
    }
  }

  const handleUnlockLib = async () => {
    if (!file) return
    try {
      const unlocked = await unlockPDF(file, password)
      setProgress(100)
      setResult(unlocked)
      setError("")
    } finally {
      setProcessing(false)
    }
  }

  const handleUnlockQpdf = async () => {
    if (!file) return
    setProcessing(true)

    try {
      const qpdfModule = await (new Function("return import('/qpdf.js')"))()
      const qpdf = await qpdfModule.default({
        locateFile: () => "/qpdf.wasm",
      })

      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      qpdf.FS.writeFile("/input.pdf", uint8Array)

      const args = password
        ? ["--password=" + password, "/input.pdf", "--decrypt", "/output.pdf"]
        : ["/input.pdf", "--decrypt", "/output.pdf"]

      qpdf.callMain(args)
      const res = qpdf.FS.readFile("/output.pdf")
      qpdf.FS.unlink("/input.pdf")
      qpdf.FS.unlink("/output.pdf")

      setProgress(100)
      setResult(new Uint8Array(res))
      setError("")
    } catch (err) {
      console.error("QPDF failed:", err)
      throw err
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
              label="Drop your password-protected PDF"
              hint="Enter the password to remove protection. Your file is processed entirely in your browser."
            />

            {file && (
              <motion.div
                className="space-y-4 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="size-5 text-brand-500" />
                    <span className="text-sm font-medium">Enter PDF password</span>
                  </div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError("") }}
                    className="rounded-xl"
                  />

                  <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                    <Cpu className="size-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Engine:</span>
                    <button
                      onClick={() => setEngine("lib")}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        engine === "lib"
                          ? "bg-brand-500/10 text-brand-500 font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Library
                    </button>
                    <button
                      onClick={() => setEngine("qpdf")}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        engine === "qpdf"
                          ? "bg-brand-500/10 text-brand-500 font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      QPDF
                    </button>
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base"
                    onClick={handleUnlock}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="size-5 animate-spin mr-2" />
                        Unlocking...
                      </>
                    ) : (
                      <>
                        <Unlock className="size-5 mr-2" />
                        Unlock PDF
                      </>
                    )}
                  </Button>
                </div>

                {processing && (
                  <div className="text-center">
                    <Progress value={progress} className="h-2 max-w-md mx-auto" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {engine === "qpdf" ? "Running QPDF engine..." : "Processing..."}
                    </p>
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
              <Unlock className="size-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">PDF Unlocked!</h2>
              <p className="text-muted-foreground mt-1">
                Password protection has been removed.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-8 rounded-xl"
                onClick={() =>
                  downloadBlob(result, file!.name.replace(/\.pdf$/i, "_unlocked.pdf"))
                }
              >
                <Download className="size-5 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl"
                onClick={() => { setResult(null); setFile(null); setPassword("") }}
              >
                Unlock Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
