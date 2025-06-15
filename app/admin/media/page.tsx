import { DashboardHeader } from "@/components/admin/dashboard-header"
import { MediaLibrary } from "@/components/admin/media-library"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <DashboardHeader heading="Media Library" text="Upload and manage images for your blog." />
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload New
        </Button>
      </div>
      <MediaLibrary />
    </div>
  )
}
