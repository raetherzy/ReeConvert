"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full">
        <Sun className="size-5" />
      </span>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full hover:bg-accent/10"
      suppressHydrationWarning
    >
      {theme === "dark" ? (
        <Sun className="size-5 text-yellow-400" />
      ) : (
        <Moon className="size-5 text-brand-600" />
      )}
    </Button>
  )
}
