import { DashboardHeader } from "@/components/admin/dashboard-header"
import { CallForPapersForm } from "@/components/admin/call-for-papers-form"
import { getCallForPapers } from "@/lib/actions/call-for-papers-actions"
import { getCurrentUser } from "@/lib/auth"
import { notFound, redirect } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ExternalLink, Calendar, Bell, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface EditCallForPapersPageProps {
  params: {
    id: string
  }
}

export default async function EditCallForPapersPage({ params }: EditCallForPapersPageProps) {
  // Check authentication and permissions
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  // Fetch call for papers from database
  const result = await getCallForPapers(params.id)
  
  if (result.error) {
    if (result.error.includes("not found")) {
      notFound()
    }
    
    // Show error page for other errors
    return (
      <div className="space-y-6">
        <DashboardHeader 
          heading="Edit Call for Papers" 
          text="Edit call for papers details and submission information." 
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load call for papers: {result.error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const cfp = result.call!

  // Transform the data to match the updated form interface with contentLink
  const formCfp = {
    id: cfp.id,
    title: cfp.title,
    thematicFocus: cfp.thematicFocus,
    description: cfp.description,
    contentLink: cfp.contentLink, // ADDED: Content link field
    deadline: cfp.deadline,
    volume: cfp.volume,
    issue: cfp.issue,
    year: cfp.year,
    guidelines: cfp.guidelines,
    image: cfp.image,
    fee: cfp.fee,
    topics: cfp.topics,
    eligibility: cfp.eligibility,
    contact: cfp.contact,
  }

  // Check if deadline has passed
  const isExpired = new Date(cfp.deadline) < new Date()
  const daysUntilDeadline = Math.ceil((new Date(cfp.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24))

  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading={`Edit Call for Papers: ${cfp.title}`} 
        text="Edit your call for papers details and submission information." 
      />
      
      {/* Call for Papers Info - UPDATED to show content link */}
      <div className="rounded-lg border p-4 bg-muted/50">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{cfp.title}</h3>
              <Badge variant={isExpired ? "destructive" : "default"}>
                {isExpired ? "Expired" : "Active"}
              </Badge>
              {cfp.fee && (
                <Badge variant="outline">Fee: {cfp.fee}</Badge>
              )}
              {cfp.contentLink && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <a 
                    href={cfp.contentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Submission Link
                  </a>
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Deadline: {format(cfp.deadline, "PPP")}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Bell className="h-4 w-4" />
                <span>Vol. {cfp.volume}, Issue {cfp.issue} ({cfp.year})</span>
              </div>
              
              {!isExpired && (
                <div className="flex items-center gap-1">
                  <span className={daysUntilDeadline <= 7 ? "text-destructive font-medium" : ""}>
                    {daysUntilDeadline > 0 ? `${daysUntilDeadline} days remaining` : "Due today"}
                  </span>
                </div>
              )}
            </div>

            {/* Content Link Display - ADDED */}
            {cfp.contentLink && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Submission Link:</p>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={cfp.contentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {cfp.contentLink}
                  </a>
                </div>
              </div>
            )}

            {/* Thematic Focus */}
            <div className="space-y-1">
              <p className="text-sm font-medium">Thematic Focus:</p>
              <p className="text-sm text-muted-foreground">{cfp.thematicFocus}</p>
            </div>

            {/* Topics Display */}
            {cfp.topics && cfp.topics.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Topics ({cfp.topics.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {cfp.topics.map((topic, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-sm font-medium">Last Updated</p>
            <p className="text-sm text-muted-foreground">
              {cfp.updatedAt ? format(new Date(cfp.updatedAt), "PPP") : "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {isExpired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Expired Call for Papers:</strong> This call for papers has passed its deadline. 
            Consider creating a new call or extending the deadline if submissions are still being accepted.
          </AlertDescription>
        </Alert>
      )}

      {!isExpired && daysUntilDeadline <= 7 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Deadline Approaching:</strong> This call for papers expires in {daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''}. 
            Make sure all information is current and the submission link is working.
          </AlertDescription>
        </Alert>
      )}

      {/* Content Link Requirement Alert - ADDED */}
      {!cfp.contentLink && (
        <Alert variant="destructive">
          <ExternalLink className="h-4 w-4" />
          <AlertDescription>
            <strong>Missing Submission Link:</strong> This call for papers requires a link to the submission system or detailed submission instructions. 
            Please add the submission link in the form below.
          </AlertDescription>
        </Alert>
      )}

      {/* Notification Info Alert */}
      {!isExpired && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <strong>Active Notification:</strong> This call for papers has an active notification on the public page. 
            Any changes you make will be reflected in the notification immediately. The notification will automatically expire on the deadline.
          </AlertDescription>
        </Alert>
      )}
      
      <CallForPapersForm cfp={formCfp} />
    </div>
  )
}