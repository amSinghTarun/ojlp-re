import type React from "react"
import type { Metadata } from "next"
import { EB_Garamond } from "next/font/google"
import "./globals.css"
import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"
import { constructMetadata } from "@/lib/metadata"

// Main body font - Spectral is an elegant serif font with excellent readability
const spectral = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

// Heading font - Libre Baskerville is a classic serif font with modern proportions
const libreBaskerville = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "700"],
})

export const metadata: Metadata = constructMetadata({
  title: "Open Journal of Law & Policy",
  description: "Expert analysis and commentary on legal developments, constitutional law, and judicial decisions.",
})

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
        className={`${spectral.variable} ${libreBaskerville.variable} font-serif bg-background flex flex-col min-h-screen antialiased`}
      >
        <Navigation />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
