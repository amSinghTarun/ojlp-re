import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthorsTable } from "@/components/admin/authors-table"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AuthorsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/admin/login")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Authors</h1>
          <p className="text-muted-foreground">Manage authors who contribute to journals and blogs.</p>
        </div>
        <Button asChild>
          <Link href="/admin/authors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Author
          </Link>
        </Button>
      </div>
      <AuthorsTable />
    </div>
  )
}
