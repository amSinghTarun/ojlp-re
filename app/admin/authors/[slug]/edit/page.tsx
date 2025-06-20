// app/admin/authors/[slug]/edit/page.tsx - FIXED to use database
import { notFound, redirect } from "next/navigation"
import { AuthorForm } from "@/components/admin/author-form"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { getAuthorDetail } from "@/lib/actions/author-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface EditAuthorPageProps {
  params: {
    slug: string
  }
}

export default async function EditAuthorPage({ params }: EditAuthorPageProps) {
  // Check authentication and permissions
  const user = await getCurrentUser()

  if (!user) {
    redirect("/admin/login")
  }

  // Check if user has permission to manage authors
  if (!hasPermission(user, PERMISSIONS.MANAGE_AUTHORS)) {
    redirect("/admin")
  }

  // Fetch author from database
  const result = await getAuthorDetail(params.slug)

  if (result.error) {
    if (result.error.includes("not found") || result.error.includes("Author not found")) {
      notFound()
    }
    
    // Show error page for other errors
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Author</h1>
          <p className="text-muted-foreground">Update author information and profile details.</p>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load author: {result.error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const author = result.data!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Author: {author.name}</h1>
        <p className="text-muted-foreground">Update author information and profile details.</p>
      </div>
      
      {/* Author Info Summary */}
      <div className="rounded-lg border p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{author.name}</h3>
            <p className="text-sm text-muted-foreground">{author.email}</p>
            {author.title && (
              <p className="text-sm text-muted-foreground">{author.title}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Author ID</p>
            <p className="text-sm text-muted-foreground">{author.id}</p>
          </div>
        </div>
      </div>
      
      <AuthorForm slug={params.slug} />
    </div>
  )
}