import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DecorativeHeading } from "@/components/decorative-heading"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getJournalVolumes } from "@/lib/journal-data"

export default function ArchivePage() {
  const volumes = getJournalVolumes()

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-8 animate-slide-up">
            <DecorativeHeading level={1}>Journal Archive</DecorativeHeading>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              Browse our complete collection of past journal volumes and issues.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {volumes.map((volume, index) => (
              <ScrollReveal key={volume.id} delay={index * 50}>
                <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-serif">Volume {volume.number}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-2">
                      <p className="font-medium">{volume.title}</p>
                      <p className="text-sm text-muted-foreground">Year: {volume.year}</p>
                      <p className="text-sm text-muted-foreground">Issues: {volume.issueCount}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/journals/archive/volume/${volume.number}`}>View Volume</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
