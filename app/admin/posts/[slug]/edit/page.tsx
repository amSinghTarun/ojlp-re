import { DashboardHeader } from "@/components/admin/dashboard-header"
import { PostForm } from "@/components/admin/post-form"
import { articles } from "@/lib/data"
import { notFound } from "next/navigation"

interface EditPostPageProps {
  params: {
    slug: string
  }
}

export default function EditPostPage({ params }: EditPostPageProps) {
  // In a real application, you would fetch this data from your database
  const post = articles.find((article) => article.slug === params.slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <DashboardHeader heading={`Edit Post: ${post.title}`} text="Edit your blog post content and settings." />
      <PostForm post={post} />
    </div>
  )
}
