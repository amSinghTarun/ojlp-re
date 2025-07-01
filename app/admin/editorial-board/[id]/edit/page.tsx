// app/admin/editorial-board/[id]/edit/page.tsx
import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { EditorialBoardForm } from "@/components/admin/editorial-board-form"
import { getEditorialBoardMember } from "@/lib/actions/editorial-board-actions"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

interface EditEditorialBoardMemberPageProps {
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

export async function generateMetadata({ params }: EditEditorialBoardMemberPageProps): Promise<Metadata> {
  try {
    const result = await getEditorialBoardMember(params.id)
    const member = result.success ? result.data : null
    
    return {
      title: member ? `Edit Board Member: ${member.name}` : "Edit Board Member",
      description: member ? `Edit editorial board member profile for ${member.name}` : "Edit editorial board member profile",
    }
  } catch {
    return {
      title: "Edit Board Member",
      description: "Edit editorial board member profile",
    }
  }
}

export default async function EditEditorialBoardMemberPage({ params }: EditEditorialBoardMemberPageProps) {
  try {
    // Validate params
    if (!params.id || typeof params.id !== 'string' || params.id.trim() === '') {
      console.error("Invalid member ID:", params.id)
      notFound()
    }

    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to edit editorial board members
    const permissionCheck = checkPermission(currentUser, 'editorialboard.UPDATE')
    
    if (!permissionCheck.allowed) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/editorial-board">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Editorial Board
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to edit editorial board members
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {permissionCheck.reason || "You don't have permission to edit editorial board members. Contact your administrator for access."}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Get member data
    const result = await getEditorialBoardMember(params.id)

    // Handle errors
    if (!result.success) {
      if (result.error?.includes("not found")) {
        notFound()
      }
      throw new Error(result.error || "Failed to load member")
    }

    const member = result.data!

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/editorial-board">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Editorial Board
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Board Member: {member.name}</h1>
            <p className="text-muted-foreground">
              Edit member information and profile details
            </p>
          </div>
        </div>

        <EditorialBoardForm member={member} />
      </div>
    )
  } catch (error) {
    console.error("Error loading edit editorial board member page:", error)
    
    // Check if it's a not found error
    if (error instanceof Error && error.message.includes("not found")) {
      notFound()
    }
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/editorial-board">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Editorial Board
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Error Loading Member</h1>
            <p className="text-muted-foreground">
              There was a problem loading the member data
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load the editorial board member edit form"}
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
            <Link href="/admin/editorial-board">
              Back to Editorial Board
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}