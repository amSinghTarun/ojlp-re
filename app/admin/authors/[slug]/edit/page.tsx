import { notFound, redirect } from "next/navigation"
import { AuthorForm } from "@/components/admin/author-form"
import { getCurrentUser } from "@/lib/auth"
import { authors } from "@/lib/authors"

interface EditAuthorPageProps {
  params: {
    slug: string
  }
}

export default async function EditAuthorPage({ params }: EditAuthorPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/admin/login")
  }

  const author = authors.find((author) => author.slug === params.slug)

  if (!author) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Author</h1>
        <p className="text-muted-foreground">Update author information and profile details.</p>
      </div>
      <AuthorForm author={author} />
    </div>
  )
}
