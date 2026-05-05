"use client"

import { FileUploader } from "@/components/tools/FileUploader"
import { ToolLayout } from "@/components/shared/ToolLayout"
import { tools, type Tool } from "@/lib/tools-data"

export function ToolPageClient({ id, children }: { id: string; children?: React.ReactNode }) {
  const tool = tools.find((t) => t.id === id) as Tool

  if (!tool) return null

  return (
    <ToolLayout tool={tool}>
      {children || (
        <PlaceholderContent tool={tool} />
      )}
    </ToolLayout>
  )
}

function PlaceholderContent({ tool }: { tool: Tool }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
          <tool.icon className="size-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">{tool.title}</h2>
        <p className="mt-2 text-muted-foreground">Coming soon — this tool is under development.</p>
      </div>
    </div>
  )
}
