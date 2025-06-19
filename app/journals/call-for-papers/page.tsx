import Link from "next/link"
import Image from "next/image"
import { Calendar, BookOpen, ArrowRight, Clock, Users, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DecorativeHeading } from "@/components/decorative-heading"
import { getActiveCallsForPapers } from "@/lib/actions/call-for-papers-actions"
import { format } from "date-fns"

export const revalidate = 3600 // Revalidate every hour

export default async function CallForPapersPage() {
  // Fetch active calls for papers from database
  const result = await getActiveCallsForPapers()
  
  if (result.error) {
    console.error("Failed to fetch calls for papers:", result.error)
  }

  const callsForPapers = result.calls || []

  // Helper function to get deadline status
  const getDeadlineStatus = (deadline: Date) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDeadline <= 0) {
      return { status: "expired", label: "Expired", variant: "destructive" as const }
    } else if (daysUntilDeadline <= 7) {
      return { status: "urgent", label: `${daysUntilDeadline} days left`, variant: "destructive" as const }
    } else if (daysUntilDeadline <= 30) {
      return { status: "soon", label: `${daysUntilDeadline} days left`, variant: "secondary" as const }
    } else {
      return { status: "open", label: "Open", variant: "default" as const }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container px-4 py-12 md:px-6">
          <div className="mb-8">
            <DecorativeHeading level={1}>Call For Papers</DecorativeHeading>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto">
              Submit your research for upcoming journal issues. Join our community of legal scholars and contribute to the advancement of legal knowledge.
            </p>
          </div>

          {callsForPapers.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {callsForPapers.map((cfp) => {
                const deadlineStatus = getDeadlineStatus(cfp.deadline)
                
                return (
                  <Card key={cfp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48 w-full">
                      <Image
                        src={cfp.image || "/placeholder.svg?height=600&width=800&query=legal journal"}
                        alt={cfp.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <div className="absolute top-4 right-4 space-y-2">
                        <Badge className="bg-primary text-primary-foreground">
                          Vol. {cfp.volume}, Issue {cfp.issue} ({cfp.year})
                        </Badge>
                        <Badge variant={deadlineStatus.variant} className="block">
                          {deadlineStatus.label}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{cfp.title}</CardTitle>
                      <CardDescription className="font-medium text-primary">
                        {cfp.thematicFocus}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {cfp.description}
                      </p>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-foreground">Submission Deadline</p>
                            <p className="text-sm font-semibold">
                              {format(new Date(cfp.deadline), "MMMM d, yyyy")}
                            </p>
                          </div>
                        </div>

                        {cfp.topics && cfp.topics.length > 0 && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-foreground">Topics</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {cfp.topics.slice(0, 3).map((topic, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {topic}
                                  </Badge>
                                ))}
                                {cfp.topics.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{cfp.topics.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {cfp.fee && (
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-foreground">Submission Fee</p>
                              <p className="text-sm">{cfp.fee}</p>
                            </div>
                          </div>
                        )}

                        {cfp.guidelines && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-foreground">Guidelines</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {cfp.guidelines}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {cfp.eligibility && (
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium text-foreground mb-1">Eligibility</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {cfp.eligibility}
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link href="/submit">
                          Submit Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Current Calls for Papers</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                There are no active calls for papers at the moment. Please check back later or subscribe to our
                notifications to be alerted when new calls are posted.
              </p>
              <div className="flex justify-center gap-4">
                <Button asChild variant="outline">
                  <Link href="/notifications">
                    <Clock className="mr-2 h-4 w-4" />
                    Get Notifications
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/journals">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Archives
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}