// app/admin/editorial-board/new/page.tsx
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { EditorialBoardForm } from "@/components/admin/editorial-board-form"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Add Editorial Board Member",
  description: "Add a new member to the editorial board",
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

export default async function NewEditorialBoardMemberPage() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to create editorial board members
    const permissionCheck = checkPermission(currentUser, 'editorialboard.CREATE')
    
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
                You don't have permission to add editorial board members
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {permissionCheck.reason || "You don't have permission to add editorial board members. Contact your administrator for access."}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

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
            <h1 className="text-2xl font-bold">Add Editorial Board Member</h1>
            <p className="text-muted-foreground">
              Add a new member to the editorial board
            </p>
          </div>
        </div>

        <EditorialBoardForm />
      </div>
    )
  } catch (error) {
    console.error("Error loading new editorial board member page:", error)
    
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
            <h1 className="text-2xl font-bold">Error Loading Page</h1>
            <p className="text-muted-foreground">
              Failed to load the editorial board member creation form
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load the editorial board member creation form"}
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