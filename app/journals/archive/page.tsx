import React from "react"
import Link from "next/link"
import { Suspense } from "react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getJournalVolumes } from "@/lib/controllers/journal-issues"

// Loading component for volumes
function VolumesLoadingState() {
  return (
    <div className="space-y-12">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="mb-6">
            <div className="h-7 bg-muted/60 rounded w-40 mb-2" />
            <div className="h-4 bg-muted/40 rounded w-64" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(10)].map((_, j) => (
              <div key={j} className="h-24 bg-muted/60 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Error component for failed volume loading
function VolumesErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Alert variant="destructive" className="max-w-md border border-red-200 bg-red-50/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Error loading archive:</strong> {error}
        </AlertDescription>
      </Alert>
      <Button 
        variant="outline" 
        size="sm"
        className="mt-4" 
        onClick={() => window.location.reload()}
      >
        Reload Archive
      </Button>
    </div>
  )
}

// Empty state component
function EmptyArchiveState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-muted/30 rounded-lg p-8 border border-border/40">
        <BookOpen className="h-12 w-12 text-muted-foreground/60 mb-4 mx-auto" />
        <h3 className="text-lg font-medium mb-2 text-foreground">Archive Currently Empty</h3>
        <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
          No journal volumes have been published yet. Please check back for future publications.
        </p>
      </div>
    </div>
  )
}

// Minimal issue tile component
function IssueTile({ issue, volumeNumber }: { issue: any, volumeNumber: number }) {
  return (
    <Card className="border-b border-stone-300 cursor-pointer">
      <Link href={`/journals/archive/volume/${volumeNumber}/issue/${issue.issue}`}>
        <CardContent className="p-4">
          {/* Issue Header */}
          <div className="flex flex-col justify-center mb-1">
            <h4 className="font-semibold text-base text-center text-stone-700">
              ISSUE {issue.issue}
            </h4>
            {issue.theme && (
              <p className="text-xs text-stone-600 mb-1 line-clamp-2">
                {issue.theme}
              </p>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex flex-col items-center justify-between text-xs text-stone-700">
            {issue.publishDate && (
              <div className="flex items-center gap-1">
                <span>{new Date(issue.publishDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long"
                      })}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

// Clean volume section component
function VolumeSection({ volume, index }: { volume: any, index: number }) {
  return (
    <ScrollReveal delay={index * 50}>
      <section className="mb-10">
        {/* Volume Header */}
        <div className="mb-4 w-full">
          <h2 className="text-2xl font-semibold text-foreground">
            VOLUME {volume.number}
          </h2>
          <div className="items-center justify-center flex flex-row gap-2 text-stone-600 text-sm">
            <span>{volume.year}</span>
            {volume.description && (
              <div className="text-stone-600 text-sm gap-3 flex flex-row">
                <span>•</span>
                <span>{volume.description}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Issues Grid */}
        {volume.issues && volume.issues.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {volume.issues.map((issue: any) => (
              <IssueTile 
                key={issue.id} 
                issue={issue} 
                volumeNumber={volume.number}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-border/50 rounded-lg bg-muted/20">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No issues published yet</p>
          </div>
        )}
      </section>
    </ScrollReveal>
  )
}

// Main archive content component
async function ArchiveContent() {
  try {
    const volumes = await getJournalVolumes()
    
    if (!volumes || volumes.length === 0) {
      return <EmptyArchiveState />
    }

    return (
      <div className="space-y-1 ">
        {volumes.map((volume, index) => (
          <VolumeSection key={volume.id} volume={volume} index={index} />
        ))}
      </div>
    )
  } catch (error) {
    console.error("Failed to load journal archive:", error)
    return <VolumesErrorState error="Unable to load the journal archive at this time." />
  }
}

export default function ArchivePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 px-2">
        <div className="max-w-5xl mx-auto text-center mt-4">
        {/* Clean Page Header */}
          <div className="mb-8 animate-slide-up justify-center pt-10 space-y-3">
            <h1 className="text-4xl sm:text-5xl text-center"> Journal Archive</h1>
            <p className="text-stone-600 text-sm font-normal justify-center align-middle content-center text-center max-w-4xl mx-auto">
            Complete collection of published journal volumes containing peer-reviewed articles and scholarly research in law and policy studies.
            </p>
          </div>
          {/* Archive Content */}
          <Suspense fallback={<VolumesLoadingState />}>
            <ArchiveContent />
          </Suspense>
        </div>
      </main>
    </div>
  )
}