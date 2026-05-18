import Link from "next/link"
import { Zap, Heart } from "lucide-react"

const footerLinks = {
  tools: {
    title: "Tools",
    links: [
      { href: "/tools/merge-pdf", label: "Merge PDF" },
      { href: "/tools/split-pdf", label: "Split PDF" },
      { href: "/tools/compress-pdf", label: "Compress PDF" },
      { href: "/tools/image-converter", label: "Image Converter" },
      { href: "/tools/heic-converter", label: "HEIC Converter" },
    ],
  },
  categories: {
    title: "Categories",
    links: [
      { href: "/tools/merge-pdf", label: "PDF Tools" },
      { href: "/tools/image-converter", label: "Image Tools" },
      { href: "/tools/video-converter", label: "Video Tools" },
      { href: "/tools/audio-converter", label: "Audio Tools" },
      { href: "/tools/ocr", label: "OCR" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { href: "/", label: "About" },
      { href: "/", label: "Privacy" },
      { href: "/", label: "Terms" },
      { href: "/", label: "Contact" },
    ],
  },
}

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/25">
                <Zap className="size-5 text-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-gradient">Ree</span>
                <span className="text-foreground">Convert</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your all-in-one online file converter. Fast, secure, and free.
              Convert PDFs, images, documents, audio, and video effortlessly.
            </p>
          </div>
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold mb-3">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ReeConvert. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="size-3.5 text-red-500 fill-red-500" /> by ReeConvert Team
          </p>
        </div>
      </div>
    </footer>
  )
}
