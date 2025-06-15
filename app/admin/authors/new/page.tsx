import { AuthorForm } from "@/components/admin/author-form"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function NewAuthorPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/admin/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Author</h1>
        <p className="text-muted-foreground">Create a new author who can contribute to journals and blogs.</p>
      </div>
      <AuthorForm />
    </div>
  )
}
