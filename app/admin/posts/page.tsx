import { DashboardHeader } from "@/components/admin/dashboard-header"
import { PostsTable } from "@/components/admin/posts-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

export default function PostsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Posts" text="Create and manage your blog posts." />
        <Button asChild>
          <Link href="/admin/posts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>
      <PostsTable />
    </div>
  )
}
