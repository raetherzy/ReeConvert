import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "ReeConvert - Free Online File Converter",
    template: "%s | ReeConvert",
  },
  description:
    "Convert PDFs, images, documents, audio, and video online for free. Like iLovePDF & SmallPDF - merge, split, compress, and convert files instantly.",
  keywords: [
    "pdf converter",
    "image converter",
    "audio converter",
    "video converter",
    "free online converter",
    "pdf merge",
    "pdf split",
    "file converter",
    "reeconvert",
  ],
  authors: [{ name: "ReeConvert" }],
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    title: "ReeConvert - Free Online File Converter",
    description: "Convert PDFs, images, documents, audio, and video online for free.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReeConvert - Free Online File Converter",
    description: "Convert PDFs, images, documents, audio, and video online for free.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delay={300}>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
