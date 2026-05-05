"use client"

import { useState, useCallback } from "react"
import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { lockPDF, downloadBlob } from "@/lib/converters/pdf"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Lock, Download, Loader2, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"

const tool = tools.find((t) => t.id === "lock-pdf")!

export default function LockPDFPage() {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Uint8Array | null>(null)
  const [error, setError] = useState("")

  const handleFileSelected = useCallback((newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFile(newFiles[0])
      setResult(null)
      setError("")
    }
  }, [])

  const handleLock = async () => {
    if (!file || !password) return
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters")
      return
    }
    setProcessing(true)
    setProgress(20)
    setError("")
    try {
      const locked = await lockPDF(file, password)
      setProgress(100)
      setResult(locked)
    } catch (err) {
      console.error("Lock failed:", err)
      setError("Failed to lock PDF. Please try again.")
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
              hint="Add a password to protect your PDF from unauthorized access."
            />

            {file && (
              <motion.div
                className="space-y-4 max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-brand-500" />
                    <span className="text-sm font-medium">Set a password</span>
                  </div>
                  <div className="space-y-3">
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError("") }}
                      className="rounded-xl"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError("") }}
                      className="rounded-xl"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>

                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-10 rounded-xl text-base"
                    onClick={handleLock}
                    disabled={processing || !password || !confirmPassword}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="size-5 animate-spin mr-2" />
                        Locking...
                      </>
                    ) : (
                      <>
                        <Lock className="size-5 mr-2" />
                        Lock PDF
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
              <ShieldCheck className="size-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">PDF Locked!</h2>
              <p className="text-muted-foreground mt-1">
                Your PDF is now password-protected. Keep your password safe.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="gradient-brand text-white shadow-xl shadow-brand-500/25 h-12 px-8 rounded-xl"
                onClick={() =>
                  downloadBlob(result, file!.name.replace(/\.pdf$/i, "_locked.pdf"))
                }
              >
                <Download className="size-5 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl"
                onClick={() => { setResult(null); setFile(null); setPassword(""); setConfirmPassword("") }}
              >
                Lock Another
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </ToolLayout>
  )
}
