"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Tool } from "@/lib/tools-data"

interface ToolLayoutProps {
  tool: Tool
  children: React.ReactNode
}

export function ToolLayout({ tool, children }: ToolLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to all tools
          </Link>
        </motion.div>

        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.color} shadow-lg`}
            >
              <tool.icon className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {tool.title}
              </h1>
              <p className="mt-1 text-muted-foreground text-base">
                {tool.description}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
