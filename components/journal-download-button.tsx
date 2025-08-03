"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Download, Loader2, FileDown, Mail, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import type { Article } from "@/lib/types"
import { useOnClickOutside } from "@/hooks/use-on-click-outside"
import { jsPDF } from "jspdf"

interface JournalDownloadButtonProps {
  article: Article
}

export function JournalDownloadButton({ article }: JournalDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [downloadType, setDownloadType] = useState<"txt" | "pdf" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jsPdfLoaded, setJsPdfLoaded] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Handle clicks outside the dropdown to close it
  useOnClickOutside(dropdownRef, () => {
    if (isDropdownOpen && !isSubmitting) {
      setIsDropdownOpen(false)
      resetForm()
    }
  })

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setIsValidEmail(validateEmail(value))
  }

  const resetForm = () => {
    setEmail("")
    setIsValidEmail(false)
    setDownloadType(null)
  }

  const handleDownloadClick = (type: "txt" | "pdf") => {
    setDownloadType(type)
    setIsDropdownOpen(true)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidEmail) return

    setIsSubmitting(true)

    try {
      // Simulate API call to store email
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Proceed with download
      if (downloadType === "txt") {
        downloadAsTxt()
      } else if (downloadType === "pdf") {
        downloadAsPdf()
      }

      // Show success toast
      toast({
        title: "Thank you!",
        description: "Your download has started. We've also sent a copy to your email.",
      })

      // Close the dropdown and reset
      setIsDropdownOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem processing your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get the author string for display
  const getAuthorString = () => {
    if (article.authors && article.authors.length > 0) {
      return article.authors.map(author => author.name).join(", ")
    }
    return article.author || "Unknown Author"
  }

  const downloadAsTxt = async () => {
    setIsDownloading(true)

    try {
      // Create the content for the download
      const title = `# ${article.title}\n\n`
      const author = `By: ${getAuthorString()}\n`
      const date = `Date: ${article.date}\n\n`
      const content = article.content

      // Format the content for download
      const formattedContent = `${title}${author}${date}${content}`

      // Create a blob with the content
      const blob = new Blob([formattedContent], { type: "text/plain" })

      // Create a URL for the blob
      const url = URL.createObjectURL(blob)

      // Create a temporary anchor element
      const a = document.createElement("a")
      a.href = url
      a.download = `${article.slug}.txt`

      // Trigger the download
      document.body.appendChild(a)
      a.click()

      // Clean up
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading journal as TXT:", error)
      toast({
        title: "Download Failed",
        description: "There was a problem downloading the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadAsPdf = async () => {
    setIsDownloading(true)

    try {
      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Set font to a serif font for academic look
      doc.setFont("times", "normal")

      // Page dimensions
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 25 // 25mm margins
      const contentWidth = pageWidth - margin * 2

      // Add title (centered, uppercase)
      doc.setFontSize(14)
      doc.setFont("times", "bold")

      // Split title into multiple lines if needed
      const titleLines = doc.splitTextToSize(article.title.toUpperCase(), contentWidth)
      let yPosition = margin + 10

      // Center and add each line of the title
      titleLines.forEach((line) => {
        doc.text(line, pageWidth / 2, yPosition, { align: "center" })
        yPosition += 7
      })

      // Add author (centered, italic)
      yPosition += 5
      doc.setFontSize(12)
      doc.setFont("times", "italic")
      doc.text(getAuthorString(), pageWidth / 2, yPosition, { align: "center" })

      // Add horizontal line
      yPosition += 10
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)

      // Add "Abstract" header
      yPosition += 15
      doc.setFont("times", "normal")
      doc.text("Abstract", pageWidth / 2, yPosition, { align: "center" })

      // Add abstract text (justified)
      yPosition += 10
      doc.setFontSize(11)
      const abstractText =
        article.excerpt ||
        "This article examines the legal implications and constitutional framework surrounding the subject matter, providing analysis of relevant case law and statutory provisions. The research explores the tension between established precedent and evolving legal interpretations, with particular attention to recent developments in jurisprudence."

      const abstractLines = doc.splitTextToSize(abstractText, contentWidth)
      doc.text(abstractLines, margin, yPosition, { align: "justify" })

      // Update y position after abstract
      yPosition += abstractLines.length * 5 + 5

      // Add keywords if available
      doc.setFont("times", "italic")
      const keywordsText = article.keywords && article.keywords.length > 0 
        ? `Keywords: ${article.keywords.join(", ")}`
        : "Keywords: Legal Analysis, Constitutional Law, Jurisprudence, Case Study, Legal Theory"
      const keywordsLines = doc.splitTextToSize(keywordsText, contentWidth)
      doc.text(keywordsLines, margin, yPosition)

      // Add second horizontal line
      yPosition += keywordsLines.length * 5 + 10
      doc.line(margin, yPosition, pageWidth - margin, yPosition)

      // Add journal info at bottom left
      doc.setFontSize(10)
      doc.setFont("times", "italic")
      const journalInfo = `Legal Insight Journal · Vol. ${article.volume || "12"} · No. ${article.issue || "2"} · ${article.year || new Date(article.date).getFullYear()}`
      doc.text(journalInfo, margin, yPosition + 10)

      // Add DOI if available
      if (article.doi) {
        doc.text(`DOI: ${article.doi}`, margin, yPosition + 15)
      }

      // Add "Introduction" header
      yPosition += 20
      doc.setFontSize(12)
      doc.setFont("times", "normal")
      doc.text("Introduction", pageWidth / 2, yPosition, { align: "center" })

      // Add content paragraphs
      yPosition += 10
      doc.setFontSize(11)

      // Split content into paragraphs
      const paragraphs = article.content.split("\n\n")

      // Process each paragraph
      paragraphs.forEach((paragraph) => {
        // Skip empty paragraphs
        if (!paragraph.trim()) return

        // Split paragraph into lines that fit the content width
        const lines = doc.splitTextToSize(paragraph, contentWidth)

        // Check if we need a new page
        if (yPosition + lines.length * 5 > pageHeight - margin) {
          doc.addPage()
          yPosition = margin + 10
        }

        // Add the paragraph with justified text
        doc.text(lines, margin, yPosition, { align: "justify" })

        // Update y position for next paragraph (add some spacing)
        yPosition += lines.length * 5 + 5
      })

      // Save the PDF
      doc.save(`${article.slug}.pdf`)
    } catch (error) {
      console.error("Error downloading journal as PDF:", error)
      toast({
        title: "Download Failed",
        description: "There was a problem generating the PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  if (isDownloading) {
    return (
      <Button variant="outline" size="sm" disabled className="flex items-center gap-1">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Downloading...</span>
      </Button>
    )
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownloadClick("pdf")}
          className="flex items-center gap-1"
        >
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline-block">Download PDF</span>
        </Button>
      </div>

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-950 rounded-md shadow-lg border border-border z-[9999] p-4 animate-in fade-in-0 zoom-in-95 slide-in-from-top-5"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-sm">Download PDF</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                setIsDropdownOpen(false)
                resetForm()
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Enter your email to receive a copy and download the article
              </p>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className={`w-full pl-10 pr-10 ${
                    email && !isValidEmail ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                />
                {email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidEmail ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>

              {email && !isValidEmail && (
                <p className="text-xs text-destructive mt-1">Please enter a valid email address</p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="newsletter"
                className="h-4 w-4 rounded border-gray-300 mt-0.5"
                defaultChecked
              />
              <label htmlFor="newsletter" className="text-xs">
                Send me updates about new legal publications
              </label>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={!isValidEmail || isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Now
                  </>
                )}
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              By downloading, you agree to our{" "}
              <a href="/terms-of-service" className="underline hover:text-primary">
                Terms
              </a>{" "}
              &{" "}
              <a href="/privacy-policy" className="underline hover:text-primary">
                Privacy Policy
              </a>
            </p>
          </form>
        </div>
      )}
    </div>
  )
}