"use client"

import { useCallback, useState, useRef } from "react"
import { Upload, X, File } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number
  label?: string
  hint?: string
  className?: string
}

export function FileUploader({
  onFilesSelected,
  accept,
  multiple = false,
  maxSize,
  label = "Drag & drop your files here",
  hint,
  className,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles = Array.from(fileList)
      if (maxSize) {
        const overSize = newFiles.find((f) => f.size > maxSize)
        if (overSize) {
          return
        }
      }
      const updated = multiple ? [...files, ...newFiles] : newFiles
      setFiles(updated)
      onFilesSelected(updated)
    },
    [files, multiple, maxSize, onFilesSelected]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
        e.target.value = ""
      }
    },
    [processFiles]
  )

  const removeFile = useCallback(
    (index: number) => {
      const updated = files.filter((_, i) => i !== index)
      setFiles(updated)
      onFilesSelected(updated)
    },
    [files, onFilesSelected]
  )

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn("w-full", className)}>
      <motion.div
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 sm:p-12 transition-all cursor-pointer",
          isDragging
            ? "border-brand-500 bg-brand-500/5 scale-[1.02]"
            : "border-border/60 hover:border-brand-500/30 hover:bg-muted/30"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        whileHover={{ scale: 1.005 }}
      >
        <motion.div
          className={cn(
            "flex size-16 items-center justify-center rounded-2xl transition-all",
            isDragging
              ? "bg-brand-500 text-white shadow-xl shadow-brand-500/25"
              : "bg-muted text-muted-foreground"
          )}
          animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
        >
          <Upload className={cn("size-7", isDragging && "animate-bounce")} />
        </motion.div>

        <div className="text-center">
          <p className="text-base font-medium text-foreground">{label}</p>
          {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
        </div>

        <p className="text-xs text-muted-foreground">
          or click to browse
        </p>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
        />
      </motion.div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="mt-4 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <File className="size-5 text-brand-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(i)
                  }}
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
