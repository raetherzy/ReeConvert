"use client"

import dynamic from "next/dynamic"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools } from "@/lib/tools-data"
import { VideoIcon } from "lucide-react"

const tool = tools.find((t) => t.id === "video-converter")!

const Content = dynamic(() => import("./content"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-muted mx-auto mb-4 animate-pulse">
        <VideoIcon className="size-10 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">Loading converter...</p>
    </div>
  ),
})

export default function Page() {
  return <ToolLayout tool={tool}><Content /></ToolLayout>
}
