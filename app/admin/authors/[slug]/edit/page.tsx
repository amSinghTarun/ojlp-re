// app/admin/authors/[slug]/edit/page.tsx - Updated for actual schema
import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AuthorForm } from "@/components/admin/author-form"
import { getAuthorDetail } from "@/lib/actions/author-actions"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

interface EditAuthorPageProps {
  params: {
    slug: string
  }
}

// Get current user with permissions
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    // If user already has role and permissions, return as is
    if ('role' in user && user.role) {
      return user as UserWithPermissions
    }

    // Otherwise fetch the complete user data with role
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

export async function generateMetadata({ params }: EditAuthorPageProps): Promise<Metadata> {
  try {
    const result = await getAuthorDetail(decodeURIComponent(params.slug))
    const author = result.data
    
    return {
      title: author ? `Edit Author: ${author.name}` : "Edit Author",
      description: author ? `Edit author profile for ${author.name}` : "Edit author profile and information",
    }
  } catch {
    return {
      title: "Edit Author",
      description: "Edit author profile and information",
    }
  }
}

export default async function EditAuthorPage({ params }: EditAuthorPageProps) {
  try {
    // Validate params
    if (!params.slug || typeof params.slug !== 'string' || params.slug.trim() === '') {
      console.error("Invalid author slug:", params.slug)
      notFound()
    }

    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to edit authors
    const permissionCheck = checkPermission(currentUser, 'author.UPDATE')
    
    if (!permissionCheck.allowed) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/authors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Authors
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to edit authors
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {permissionCheck.reason || "You don't have permission to edit authors. Contact your administrator for access."}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Get author data
    const result = await getAuthorDetail(decodeURIComponent(params.slug))

    // Handle errors
    if (result.error) {
      if (result.error.includes("not found") || result.error.includes("Author not found")) {
        notFound()
      }
      throw new Error(result.error)
    }

    const author = result.data!

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/authors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Authors
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Author: {author.name}</h1>
            <p className="text-muted-foreground">
              Update author information and profile details
            </p>
          </div>
        </div>

        <AuthorForm slug={params.slug} />
      </div>
    )
  } catch (error) {
    console.error("Error loading edit author page:", error)
    
    // Check if it's a not found error
    if (error instanceof Error && error.message.includes("not found")) {
      notFound()
    }
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/authors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Authors
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Error Loading Author</h1>
            <p className="text-muted-foreground">
              There was a problem loading the author data
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load the author edit form"}
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
            <Link href="/admin/authors">
              Back to Authors
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}