"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { tools, toolCategories } from "@/lib/tools-data"
import { cn } from "@/lib/utils"

export function ToolsGrid() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const filteredTools = tools.filter((tool) => {
    const matchesCategory = !activeCategory || tool.category === activeCategory
    const matchesSearch =
      !search ||
      tool.title.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <section id="tools" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            All <span className="text-gradient">Conversion Tools</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            22+ powerful tools to convert any file format
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={!activeCategory ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg"
              onClick={() => setActiveCategory(null)}
            >
              All Tools
            </Badge>
            {toolCategories.map((cat) => (
              <Badge
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                className="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg"
                onClick={() =>
                  setActiveCategory(activeCategory === cat.id ? null : cat.id)
                }
              >
                {cat.label}
              </Badge>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              className="pl-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link href={tool.href}>
                <Card
                  className={cn(
                    "group h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-1 border-border/50 hover:border-brand-500/20",
                    "dark:hover:bg-white/[0.04]"
                  )}
                >
                  <CardHeader>
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl bg-gradient-to-br mb-2",
                        tool.color
                      )}
                    >
                      <tool.icon className="size-5 text-white" />
                    </div>
                    <CardTitle className="text-base group-hover:text-brand-500 transition-colors">
                      {tool.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No tools found. Try a different search term.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
