import Link from "next/link"
import { BookOpen, Clock, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { getActiveCallsForPapers } from "@/lib/actions/call-for-papers-actions"
import { format } from "date-fns"
import { DownloadButton } from "@/components/download-button"

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
      <main className="flex-1 px-2">
        <div className="max-w-5xl mx-auto text-center mt-4">
          {/* Header */}
          <div className="mb-8 space-y-3 pt-10 relative">
            <h1 className="text-4xl md:text-5xl text-center text-stone-800">Call For Papers</h1>
            <p className="text-stone-600 text-xs md:text-sm font-normal justify-center align-middle content-center text-center max-w-4xl mx-auto">
              Submit your research for upcoming journal issues. Join our community of legal scholars and contribute to the advancement of legal knowledge.
            </p>
          </div>

          {callsForPapers.length > 0 ? (
            <div className="grid gap-8 grid-cols-1">
              {callsForPapers.map((cfp) => {
                const deadlineStatus = getDeadlineStatus(cfp.deadline)
                
                return (
                  <Card key={cfp.id} className="overflow-hidden relative border border-stone-200/60 m-0 p-0">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h1 className="line-clamp-2 text-stone-800 text-2xl sm:text-3xl">{cfp.title}</h1>
                          {cfp.thematicFocus && (
                            <CardDescription className="font-medium text-xs sm:text-sm text-red-800">
                              {cfp.thematicFocus}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 px-4">
                      <div className="text-sm text-stone-800">
                        {cfp.description}
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {/* Submission Deadline */}
                        <div className="flex items-start flex-col text-xs sm:text-sm">
                          <span className="text-stone-500">Submission Deadline</span>
                          <span className="font-semibold">
                            {format(new Date(cfp.deadline), "MMMM d, yyyy")}
                          </span>
                        </div>

                        {/* Volume, Issue, Year */}
                        <div className="flex items-start flex-col text-xs sm:text-sm">
                          <span className="text-stone-500">Journal Issue</span>
                          <span className="font-semibold">
                            Volume {cfp.volume}, Issue {cfp.issue} ({cfp.year})
                          </span>
                        </div>

                        {/* Topics */}
                        {cfp.topics && cfp.topics.length > 0 && (
                          <div className="flex items-start flex-col text-xs sm:text-sm">
                            <span className="text-stone-500">Topics</span>
                            <span className="font-semibold">
                              {cfp.topics.slice(0, 3).map((topic, index) => (
                                <span key={index}>
                                  {topic}
                                  {index < Math.min(3, cfp.topics.length) - 1 && (
                                    <span className="mx-1 text-stone-500">•</span>
                                  )}
                                </span>
                              ))}
                              {cfp.topics.length > 3 && (
                                <span>
                                  <span className="mx-1 text-stone-400">•</span>
                                  +{cfp.topics.length - 3} more
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Submission Fee */}
                        {cfp.fee && (
                          <div className="flex items-start flex-col text-xs sm:text-sm">
                            <span className="text-stone-500">Submission Fee</span>
                            <span className="font-semibold">{cfp.fee}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex gap-3 p-4 items-stretch">
                      {/* Submit Now Button */}
                      <Button asChild size="lg" className="flex-1 rounded-sm h-auto p-2 ">
                        <Link href="/submit" className="text-stone-100 font-semibold flex items-center justify-center">
                          <span className="hidden sm:inline text-base">Submit Now</span>
                          <span className="sm:hidden text-base">Submit</span>
                        </Link>
                      </Button>
                      
                      {/* Download Button - only show if contentLink exists */}
                      {cfp.contentLink && (
                        <DownloadButton
                          contentLink={cfp.contentLink}
                          filename={`${cfp.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`}
                          title={cfp.title}
                          className="shrink-0"
                        />
                      )}
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