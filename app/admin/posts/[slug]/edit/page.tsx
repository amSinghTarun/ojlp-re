import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { PostForm } from "@/components/admin/post-form"
import { getPost } from "@/lib/actions/post-actions"
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EditPostPageProps {
  params: {
    slug: string
  }
}

// Loading component for the post data
function PostLoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex justify-center items-center h-64 border rounded-lg">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading post data...</span>
        </div>
      </div>
    </div>
  )
}

// Error component for failed post loading
function PostErrorState({ error }: { error: string }) {
  return (
    <div className="space-y-6">
      <DashboardHeader 
        heading="Error Loading Post" 
        text="There was an issue loading the post data." 
      />
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Error:</strong> {error}
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Main edit post content component
async function EditPostContent({ slug }: { slug: string }) {
  try {
    // Fetch post data from database
    const result = await getPost(slug)
    
    if (!result.success) {
      if (result.error === "Post not found") {
        notFound()
      }
      return <PostErrorState error={result.error} />
    }

    const post = result.data
    
    return (
      <div className="space-y-6">
        <DashboardHeader 
          heading={`Edit Post: ${post.title}`}
          text={`Edit your ${post.type} post content, authors, and settings.`}
        />
        <PostForm slug={slug} type={post.type as "blog" | "journal"} />
      </div>
    )
  } catch (error) {
    console.error("Failed to load post for editing:", error)
    return <PostErrorState error="An unexpected error occurred while loading the post." />
  }
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { slug } = params

  // Validate slug parameter
  if (!slug || typeof slug !== 'string') {
    notFound()
  }

  return (
    <Suspense fallback={<PostLoadingState />}>
      <EditPostContent slug={slug} />
    </Suspense>
  )
}