"use client"

import { useState } from "react"
import { BarChart3, Eye, Download, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Article } from "@/lib/types"

interface JournalMetricsButtonProps {
  article: Article
}

export function JournalMetricsButton({ article }: JournalMetricsButtonProps) {
  const [open, setOpen] = useState(false)

  // In a real application, these would come from your analytics system
  // For now, we'll generate some random but consistent numbers based on the article slug
  const visitCount = (hashStringToNumber(article.slug) % 1000) + 500 // Between 500-1499
  const downloadCount = Math.floor(visitCount * (0.1 + Math.random() * 0.2)) // 10-30% of visits

  // Generate PDF and TXT download counts that add up to the total
  const pdfDownloads = Math.floor(downloadCount * 0.7) // 70% PDF
  const txtDownloads = downloadCount - pdfDownloads // 30% TXT

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden md:inline-block">Metrics</span>
          {open ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px] md:w-[350px]">
        <div className="p-4 space-y-4">
          <div className="text-sm font-medium border-b pb-2 mb-2">Article Metrics</div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm">Total Views</span>
              </div>
              <div className="text-lg font-bold">{visitCount.toLocaleString()}</div>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                <span className="text-sm">Total Downloads</span>
              </div>
              <div className="text-lg font-bold">{downloadCount.toLocaleString()}</div>
            </div>

            <div className="text-xs text-muted-foreground">
              {((downloadCount / visitCount) * 100).toFixed(1)}% of visitors download this article
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm font-medium mb-2">Download Breakdown</div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>PDF Format</span>
                  </div>
                  <div>
                    <span className="font-medium">{pdfDownloads.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({((pdfDownloads / downloadCount) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <span>Text Format</span>
                  </div>
                  <div>
                    <span className="font-medium">{txtDownloads.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({((txtDownloads / downloadCount) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-muted rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(pdfDownloads / downloadCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Helper function to generate a consistent number from a string
function hashStringToNumber(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}
