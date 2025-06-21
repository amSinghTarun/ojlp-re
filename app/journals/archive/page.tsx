import Link from "next/link"
import { Suspense } from "react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, BookOpen, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getJournalVolumes } from "@/lib/controllers/journal-issues"

// Loading component for volumes
function VolumesLoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="h-full flex flex-col animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-7 bg-muted rounded" />
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-10 bg-muted rounded w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

// Error component for failed volume loading
function VolumesErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Error loading volumes:</strong> {error}
        </AlertDescription>
      </Alert>
      <Button 
        variant="outline" 
        className="mt-4" 
        onClick={() => window.location.reload()}
      >
        Try Again
      </Button>
    </div>
  )
}

// Empty state component
function EmptyVolumesState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">No Volumes Available</h3>
      <p className="text-muted-foreground max-w-md">
        There are no journal volumes published yet. Check back later for updates.
      </p>
    </div>
  )
}

// Main volumes content component
async function VolumesContent() {
  try {
    const volumes = await getJournalVolumes()
    
    if (!volumes || volumes.length === 0) {
      return <EmptyVolumesState />
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {volumes.map((volume, index) => (
          <ScrollReveal key={volume.id} delay={index * 50}>
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-300 group">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-serif flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Volume {volume.number}
                </CardTitle>
                <Badge variant="secondary" className="w-fit">
                  {volume.year}
                </Badge>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-2">
                  <p className="font-medium line-clamp-2">{volume.title}</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <span className="font-medium">Year:</span> {volume.year}
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="font-medium">Issues:</span> {volume.issueCount}
                    </p>
                    {volume.issues && volume.issues.length > 0 && (
                      <p className="text-xs pt-1">
                        Latest: {volume.issues[volume.issues.length - 1]?.title || 'Untitled'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Link href={`/journals/archive/volume/${volume.number}`}>
                    View Volume
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    )
  } catch (error) {
    console.error("Failed to load journal volumes:", error)
    return <VolumesErrorState error="Failed to load journal volumes. Please try again later." />
  }
}

export default function ArchivePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-8 animate-slide-up">
            <DecorativeHeading level={1}>Journal Archive</DecorativeHeading>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              Browse our complete collection of past journal volumes and issues. 
              Each volume contains peer-reviewed articles from leading researchers and practitioners.
            </p>
          </div>

          <Suspense fallback={<VolumesLoadingState />}>
            <VolumesContent />
          </Suspense>
        </div>
      </main>
    </div>
  )
}