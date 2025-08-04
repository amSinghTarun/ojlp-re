import React from "react"
import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { CallForPapersForm } from "@/components/admin/call-for-papers-form"
import { getCallForPapers } from "@/lib/actions/call-for-papers-actions"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'


interface EditCallForPapersPageProps {
  params: {
    id: string
  }
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

export async function generateMetadata({ params }: EditCallForPapersPageProps): Promise<Metadata> {
  try {
    const result = await getCallForPapers(params.id)
    const cfp = result.call
    
    return {
      title: cfp ? `Edit Call for Papers: ${cfp.title}` : "Edit Call for Papers",
      description: cfp ? `Edit call for papers for ${cfp.title}` : "Edit call for papers details",
    }
  } catch {
    return {
      title: "Edit Call for Papers",
      description: "Edit call for papers details",
    }
  }
}

export default async function EditCallForPapersPage({ params }: EditCallForPapersPageProps) {
  try {
    // Validate params
    if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
      console.error("Invalid call for papers ID:", params.id)
      notFound()
    }

    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to edit call for papers
    const permissionCheck = checkPermission(currentUser, 'callforpapers.UPDATE')
    
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
                You don't have permission to edit call for papers
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {permissionCheck.reason || "You don't have permission to edit call for papers. Contact your administrator for access."}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Get call for papers data
    const result = await getCallForPapers(params.id)

    // Handle errors
    if (result.error) {
      if (result.error.includes("not found")) {
        notFound()
      }
      throw new Error(result.error)
    }

    const cfp = result.call!

    // Transform the data to match the form interface (aligned with actual schema)
    const formCfp = {
      id: cfp.id,
      title: cfp.title,
      thematicFocus: cfp.thematicFocus,
      description: cfp.description,
      contentLink: cfp.contentLink,
      deadline: cfp.deadline,
      volume: cfp.volume,
      issue: cfp.issue,
      year: cfp.year,
      fee: cfp.fee,
      topics: cfp.topics,
      publisher: cfp.publisher,
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/call-for-papers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Call for Papers
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Call for Papers: {cfp.title}</h1>
            <p className="text-muted-foreground">
              Edit call for papers details and submission information
            </p>
          </div>
        </div>

        <CallForPapersForm cfp={formCfp} />
      </div>
    )
  } catch (error) {
    console.error("Error loading edit call for papers page:", error)
    
    // Check if it's a not found error
    if (error instanceof Error && error.message.includes("not found")) {
      notFound()
    }
    
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
            <h1 className="text-2xl font-bold">Error Loading Call for Papers</h1>
            <p className="text-muted-foreground">
              There was a problem loading the call for papers data
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load the call for papers edit form"}
            {process.env.NODE_ENV === "development" && (
              <details className="mt-2">
                <summary className="cursor-pointer">Error Details (Development)</summary>
                <pre className="mt-2 text-xs overflow-x-auto bg-muted p-2 rounded">
                  {error instanceof Error ? error.stack || error.message : String(error)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/admin/call-for-papers">
              Back to Call for Papers
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}