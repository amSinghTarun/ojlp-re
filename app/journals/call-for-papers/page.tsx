import Link from "next/link"
import Image from "next/image"
import { Scale, Calendar, FileText, DollarSign, BookOpen, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DecorativeHeading } from "@/components/decorative-heading"
import { callsForPapers } from "@/lib/journal-data"
import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"

export default function CallForPapersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-8">
            <DecorativeHeading level={1}>Call For Papers</DecorativeHeading>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              Submit your research for upcoming journal issues
            </p>
          </div>

          {callsForPapers.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {callsForPapers.map((cfp) => (
                <Card key={cfp.id} className="overflow-hidden">
                  <div className="relative h-48 w-full">
                    <Image
                      src={cfp.image || "/placeholder.svg?height=600&width=800&query=legal journal"}
                      alt={cfp.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                      Vol. {cfp.volume}, Issue {cfp.issue} ({cfp.year})
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{cfp.title}</CardTitle>
                    <CardDescription className="font-medium text-primary">{cfp.thematicFocus}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">{cfp.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-foreground">Deadline</p>
                          <p className="text-sm">{cfp.deadline}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href="/submit">
                        Submit Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Current Calls for Papers</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                There are no active calls for papers at the moment. Please check back later or subscribe to our
                notifications to be alerted when new calls are posted.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
