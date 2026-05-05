import { existsSync, mkdirSync, copyFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const publicDir = join(root, "public", "ffmpeg")

const cores = [
  { pkg: "@ffmpeg/core", sub: "umd", suffix: "" },
  { pkg: "@ffmpeg/core-mt", sub: "umd", suffix: "-mt" },
]

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true })
}

for (const { pkg, sub, suffix } of cores) {
  const basePath = join(root, "node_modules", pkg, "dist", sub)
  const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"]

  for (const file of files) {
    const src = join(basePath, file)
    const destName = file.replace("ffmpeg-core", `ffmpeg-core${suffix}`)
    const dest = join(publicDir, destName)

    if (existsSync(src)) {
      copyFileSync(src, dest)
      console.log(`  Copied ${pkg}/${file} -> public/ffmpeg/${destName}`)
    } else {
      console.warn(`  Warning: ${src} not found`)
    }
  }
}

console.log("FFmpeg WASM files ready.")
