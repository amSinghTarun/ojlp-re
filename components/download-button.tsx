"use client"

import { useState } from "react"
import { Download, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getGoogleDocInfo } from "@/lib/controllers/articles"

interface DownloadButtonProps {
  contentLink: string
  filename: string
  title: string
  className?: string
}

export function DownloadButton({ 
  contentLink, 
  filename, 
  title, 
  className = "" 
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  const handleDownload = async () => {
    setIsDownloading(true)
    
    try {
      // First validate if it's a Google Doc
      const docInfo = getGoogleDocInfo(contentLink)
      
      if (!docInfo.isValid) {
        // If not a Google Doc, open the link directly
        toast({
          title: "Contact the team",
        })
        return
      }

      console.log(`🔄 Starting download for: ${title}`)
      
      // Call our API route to download the Google Doc as PDF
      const response = await fetch('/api/download-google-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentLink,
          filename,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Get the PDF blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      window.URL.revokeObjectURL(url)
      
      console.log(`✅ Download completed: ${filename}`)
      
      toast({
        title: "Download Complete",
        description: `${title} has been downloaded successfully.`,
        action: (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ),
      })

    } catch (error) {
      console.error('❌ Download failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
        action: (
          <AlertCircle className="h-4 w-4" />
        ),
      })
      
      // Fallback: open the original link
      if (contentLink) {
        toast({
          title: "Opening Original Link",
          description: "Opening the document in a new tab as fallback.",
        })
        window.open(contentLink, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button 
      size="lg" 
      className={`bg-red-800 rounded-sm flex items-center hover:bg-red-900 transition-colors ${className}`}
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
        </>
      ) : (
        <>
          <Download size="sm" />
          {/* Show text on larger screens, hide on mobile */}
          <span className="hidden sm:inline ml-2 font-semibold text-base text-stone-100">Download</span>
        </>
      )}
    </Button>
  )
}

// Example usage component showing how to place buttons side by side
export function ButtonGroup({ 
  contentLink, 
  filename, 
  title,
  onSubmit 
}: {
  contentLink: string
  filename: string
  title: string
  onSubmit?: () => void
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Submit Button */}
      <Button 
        size="sm"
        className="bg-blue-800 rounded-sm hover:bg-blue-900 transition-colors"
        onClick={onSubmit}
      >
        <div className="flex items-center font-semibold text-base text-stone-100 gap-2">
          <span className="hidden sm:inline">Submit Now</span>
          <span className="sm:hidden">Submit</span>
        </div>
      </Button>
      
      {/* Download Button */}
      <DownloadButton 
        contentLink={contentLink}
        filename={filename}
        title={title}
      />
    </div>
  )
}