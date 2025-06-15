import { DashboardHeader } from "@/components/admin/dashboard-header"
import { PostForm } from "@/components/admin/post-form"

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader heading="Create New Post" text="Create a new blog post with rich content and images." />
      <PostForm />
    </div>
  )
}
