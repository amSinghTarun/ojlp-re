import React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { CallForPapersForm } from "@/components/admin/call-for-papers-form"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft, Bell, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Create Call for Papers",
  description: "Create a new call for papers for your journal",
}

// Get current user with permissions
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    // If user already has role and permissions, return as is
    if ('role' in user && user.role && 'permissions' in user.role) {
      return user as UserWithPermissions
    }

    // Otherwise fetch the complete user data with role and permissions
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true
      }
    })

    return fullUser as UserWithPermissions
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

export default async function NewCallForPapersPage() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to create call for papers
    const permissionCheck = checkPermission(currentUser, 'callforpapers.CREATE')
    
    if (!permissionCheck.allowed) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/call-for-papers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Call for Papers
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to create call for papers
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {permissionCheck.reason || "You don't have permission to create call for papers. Contact your administrator for access."}
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border border-dashed p-8 text-center">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold">Permission Required</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                You need the "callforpapers.CREATE" permission to create new calls for papers. Please contact your system administrator to request this permission.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/admin/call-for-papers">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Call for Papers
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/call-for-papers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Call for Papers
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Call for Papers</h1>
            <p className="text-muted-foreground">
              Create a new call for papers for your journal
            </p>
          </div>
        </div>

        {/* Information Alert */}
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Automatic Features:</strong></p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• A high-priority notification will be automatically created and published</li>
                <li>• The notification will be visible on the public notifications page</li>
                <li>• Submission links (if provided) will be included in notifications</li>
                <li>• The notification will automatically expire on the submission deadline</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Schema Information for Development */}
        {process.env.NODE_ENV === 'development' && (
          <Alert variant="outline">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Development Info:</strong></p>
                <div className="text-sm space-y-1">
                  <p>• <strong>Required fields:</strong> title, thematicFocus, description, deadline, volume, issue, year, publisher</p>
                  <p>• <strong>Optional fields:</strong> contentLink, fee, topics (array)</p>
                  <p>• <strong>Auto-generated:</strong> id, createdAt, updatedAt</p>
                  <p>• <strong>Validation:</strong> Deadline must be in the future, unique volume/issue/year combination</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Call for Papers Form */}
        <CallForPapersForm />
      </div>
    )
  } catch (error) {
    console.error("Error loading new call for papers page:", error)
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/call-for-papers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Call for Papers
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Error Loading Page</h1>
            <p className="text-muted-foreground">
              Failed to load the call for papers creation form
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>{error instanceof Error ? error.message : "Failed to load the call for papers creation form"}</p>
              {process.env.NODE_ENV === "development" && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-muted-foreground">Error Details (Development)</summary>
                  <pre className="mt-2 text-xs overflow-x-auto bg-muted p-2 rounded">
                    {error instanceof Error ? error.stack || error.message : String(error)}
                  </pre>
                </details>
              )}
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="rounded-lg border border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold">Unable to Load Form</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              There was a problem loading the call for papers creation form. Please try refreshing the page or contact support if the issue persists.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/call-for-papers">
                  Back to Call for Papers
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}