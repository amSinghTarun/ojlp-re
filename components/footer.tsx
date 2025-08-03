"use client"

import Link from "next/link"
import Image from "next/image"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-12 bg-red-900 text-stone-100">
      <div className="container space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 relative">
                <Image
                  src="/logo.png"
                  alt="Open Journal of Law & Policy Logo"
                  fill
                  className="object-contain transition-transform duration-200 group-hover:scale-110"
                />
              </div>
              <span className="font-heading font-semibold">Open Journal of Law & Policy</span>
            </Link>
            <p className="text-sm text-stone-300 max-w-md text-center md:text-left font-serif">
              Advancing legal discourse through scholarly research, critical analysis, and thoughtful jurisprudence.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
            <div className="space-y-3">
              <h3 className="font-heading font-semibold">About</h3>
              <ul className="space-y-2 font-serif">
                <li>
                  <Link href="/about" className="text-stone-300 hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/editorial-board" className="text-stone-300 hover:text-primary transition-colors">
                    Editorial Board
                  </Link>
                </li>
                <li>
                  <Link
                    href="/board-of-advisors"
                    className="text-stone-300 hover:text-primary transition-colors"
                  >
                    Board of Advisors
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-heading font-semibold">Journal</h3>
              <ul className="space-y-2 font-serif">
                <li>
                  <Link href="/journals" className="text-stone-300 hover:text-primary transition-colors">
                    Current Issue
                  </Link>
                </li>
                <li>
                  <Link href="/journals/archive" className="text-stone-300 hover:text-primary transition-colors">
                    Archive
                  </Link>
                </li>
                <li>
                  <Link
                    href="/journals/call-for-papers"
                    className="text-stone-300 hover:text-primary transition-colors"
                  >
                    Call for Papers
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3 col-span-2 md:col-span-1">
              <h3 className="font-heading font-semibold">Connect</h3>
              <ul className="space-y-2 font-serif">
                <li>
                  <Link href="/contact" className="text-stone-300 hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/submit" className="text-stone-300 hover:text-primary transition-colors">
                    Submit Paper
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-stone-300 font-serif">
          <p>© {currentYear} Open Journal of Law & Policy. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms-of-service" className="hover:text-primary transition-colors duration-200">
              Terms
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Link href="/privacy-policy" className="hover:text-primary transition-colors duration-200">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
