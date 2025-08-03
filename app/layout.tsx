import type React from "react"
import type { Metadata } from "next"
import { Spectral, Libre_Baskerville, EB_Garamond } from "next/font/google"
import "./globals.css"
import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"
import { constructMetadata } from "@/lib/metadata"

// Main body font - Spectral is an elegant serif font with excellent readability
const spectral = Spectral({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

// Heading font - Libre Baskerville is a classic serif font with modern proportions
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "700"],
})

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "700"],
})

export const metadata: Metadata = constructMetadata({})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body
        className={`${libreBaskerville.variable} ${ebGaramond.variable} bg-amber-100/10 flex flex-col min-h-screen antialiased`}
      >
        <Navigation />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
