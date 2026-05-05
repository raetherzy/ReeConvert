"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Upload, Zap, Shield, Clock } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/10 via-transparent to-transparent dark:from-brand-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent-purple-500/10 via-transparent to-transparent dark:from-accent-purple-500/5" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36 relative">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Zap className="size-4" />
            Free & Secure File Converter
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            Convert Your Files
            <br />
            <span className="text-gradient">Like a Pro</span>
          </h1>

          <motion.p
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Your all-in-one online file converter. Merge, split, compress, and convert
            PDFs, images, documents, audio, and video — fast, free, and private.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Link
              href="/tools/merge-pdf"
              className="inline-flex items-center justify-center gap-1.5 h-12 px-8 rounded-xl gradient-brand text-white shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-105 transition-all text-base font-medium"
            >
              Start Converting <ArrowRight className="ml-2 size-4" />
            </Link>
            <Link
              href="#tools"
              className="inline-flex items-center justify-center gap-1.5 h-12 px-8 rounded-xl border border-border bg-background hover:bg-muted text-base font-medium transition-colors"
            >
              <Upload className="mr-2 size-4" />
              Upload a File
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {[
            {
              icon: Shield,
              title: "100% Secure",
              desc: "Files are encrypted and automatically deleted after processing",
            },
            {
              icon: Clock,
              title: "Lightning Fast",
              desc: "Process files instantly with browser-based conversion",
            },
            {
              icon: Zap,
              title: "All-in-One",
              desc: "22+ tools for PDF, images, docs, audio & video",
            },
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              className="flex flex-col items-center text-center p-6 rounded-2xl glass-dark hover:bg-white/5 transition-colors"
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 mb-4">
                <feat.icon className="size-6" />
              </div>
              <h3 className="font-semibold text-foreground">{feat.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
