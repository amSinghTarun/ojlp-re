// app/admin/authors/page.tsx - TABLE/LIST FORMAT
import Link from "next/link"
import { Plus, Users, FileText, Eye, Pencil, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { getAuthorsList } from "@/lib/actions/author-actions"
import { redirect } from "next/navigation"

export default async function AuthorsPage() {
  try {
    // Check authentication and permissions
    const user = await getCurrentUser()
    if (!user) {
      redirect("/admin/login")
    }

    if (!hasPermission(user, PERMISSIONS.MANAGE_AUTHORS)) {
      redirect("/admin")
    }

    // Fetch authors from database
    const result = await getAuthorsList()

    if (result.error) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Authors</h1>
              <p className="text-muted-foreground">Manage authors who contribute to the journal.</p>
            </div>
            <Button asChild>
              <Link href="/admin/authors/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Author
              </Link>
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load authors: {result.error}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    const authors = result.data || []

    // Calculate stats
    const totalAuthors = authors.length
    const authorsWithBio = authors.filter(author => author.bio && author.bio.trim().length > 0).length
    const authorsWithImage = authors.filter(author => author.image && author.image.trim().length > 0).length
    const totalArticles = authors.reduce((sum, author) => 
      sum + (author.authorArticles?.length || 0), 0
    )

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Authors</h1>
            <p className="text-muted-foreground">Manage authors who contribute to the journal.</p>
          </div>
          <Button asChild>
            <Link href="/admin/authors/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Author
            </Link>
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Authors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAuthors}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Biography</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{authorsWithBio}</div>
              <p className="text-xs text-muted-foreground">
                {totalAuthors > 0 ? Math.round((authorsWithBio / totalAuthors) * 100) : 0}% of authors
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Profile Image</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{authorsWithImage}</div>
              <p className="text-xs text-muted-foreground">
                {totalAuthors > 0 ? Math.round((authorsWithImage / totalAuthors) * 100) : 0}% of authors
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalArticles}</div>
              <p className="text-xs text-muted-foreground">
                {totalAuthors > 0 ? Math.round(totalArticles / totalAuthors * 10) / 10 : 0} avg per author
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Authors Table */}
        {authors.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Authors ({totalAuthors})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Photo</TableHead>
                    <TableHead>Name & Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expertise</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authors.map((author) => (
                    <TableRow key={author.id}>
                      {/* Photo */}
                      <TableCell>
                        {author.image ? (
                          <img
                            src={author.image}
                            alt={author.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>

                      {/* Name & Title */}
                      <TableCell>
                        <div>
                          <div className="font-medium">{author.name}</div>
                          {author.title && (
                            <div className="text-sm text-muted-foreground">{author.title}</div>
                          )}
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell>
                        <div className="text-sm">{author.email}</div>
                      </TableCell>

                      {/* Articles */}
                      <TableCell>
                        <Badge variant="secondary">
                          {author.authorArticles?.length || 0}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {author.userId && (
                            <Badge variant="outline" className="text-xs w-fit">
                              Linked User
                            </Badge>
                          )}
                          {author.bio && (
                            <Badge variant="secondary" className="text-xs w-fit">
                              Has Bio
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Expertise */}
                      <TableCell>
                        {author.expertise && author.expertise.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {author.expertise.slice(0, 2).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {author.expertise.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{author.expertise.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/authors/${author.slug}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/authors/${author.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No authors found</h3>
              <p className="text-muted-foreground mb-4 text-center">
                Get started by adding your first author to the system.
              </p>
              <Button asChild>
                <Link href="/admin/authors/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Author
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error loading authors page:", error)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Authors</h1>
            <p className="text-muted-foreground">Manage authors who contribute to the journal.</p>
          </div>
          <Button asChild>
            <Link href="/admin/authors/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Author
            </Link>
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            An unexpected error occurred while loading the authors page. Please try again or contact support if the problem persists.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
}