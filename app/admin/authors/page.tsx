// app/admin/authors/page.tsx - Updated for actual schema
import Link from "next/link"
import { Plus, Users, FileText, Eye, Pencil, ExternalLink, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCurrentUser } from "@/lib/auth"
import { getAuthorsList } from "@/lib/actions/author-actions"
import { checkPermission } from "@/lib/permissions/checker"
import { UserWithPermissions } from "@/lib/permissions/types"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

// Get current user with permissions helper
async function getCurrentUserWithPermissions(): Promise<UserWithPermissions | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    if ('role' in user && user.role) {
      return user as UserWithPermissions
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { role: true }
    })

    return fullUser as UserWithPermissions
  } catch (error) {
    console.error('Error getting user with permissions:', error)
    return null
  }
}

export default async function AuthorsPage() {
  try {
    // Check authentication and permissions
    const currentUser = await getCurrentUserWithPermissions()
    
    if (!currentUser) {
      redirect("/admin/login")
    }

    // Check if user has permission to view authors
    const permissionCheck = checkPermission(currentUser, 'author.READ')
    
    if (!permissionCheck.allowed) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to view authors
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {permissionCheck.reason || "You don't have permission to view authors. Contact your administrator for access."}
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    // Check additional permissions for different actions
    const canCreateAuthors = checkPermission(currentUser, 'author.CREATE').allowed
    const canEditAuthors = checkPermission(currentUser, 'author.UPDATE').allowed

    // Fetch authors from database
    const result = await getAuthorsList()

    if (result.error) {
      throw new Error(result.error)
    }

    const authors = result.data || []

    // Calculate stats
    const totalAuthors = authors.length
    const authorsWithTitle = authors.filter(author => author.title && author.title.trim().length > 0).length
    const authorsWithBio = authors.filter(author => author.bio && author.bio.trim().length > 0).length
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
          {canCreateAuthors && (
            <Button asChild>
              <Link href="/admin/authors/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Author
              </Link>
            </Button>
          )}
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
              <CardTitle className="text-sm font-medium">With Title</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{authorsWithTitle}</div>
              <p className="text-xs text-muted-foreground">
                {totalAuthors > 0 ? Math.round((authorsWithTitle / totalAuthors) * 100) : 0}% of authors
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Biography</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
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
                    <TableHead>Name & Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Status</TableHead>
                    {(canEditAuthors || canCreateAuthors) && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authors.map((author) => (
                    <TableRow key={author.id}>
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
                          {author.title && (
                            <Badge variant="outline" className="text-xs w-fit">
                              Has Title
                            </Badge>
                          )}
                          {author.bio && (
                            <Badge variant="secondary" className="text-xs w-fit">
                              Has Bio
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions - Only show if user has edit permissions */}
                      {(canEditAuthors || canCreateAuthors) && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEditAuthors && (
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/admin/authors/${author.slug}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/authors/${author.slug}`} target="_blank">
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      )}
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
                {canCreateAuthors 
                  ? "Get started by adding your first author to the system."
                  : "No authors have been added to the system yet."
                }
              </p>
              {canCreateAuthors && (
                <Button asChild>
                  <Link href="/admin/authors/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Author
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Permission Notice for Read-Only Users */}
        {!canEditAuthors && !canCreateAuthors && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  You have read-only access to authors. Contact an administrator for edit permissions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  } catch (error) {
    console.error("Error loading authors page:", error)
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Error Loading Page</h1>
            <p className="text-muted-foreground">
              Failed to load the authors page
            </p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load the authors page"}
            {process.env.NODE_ENV === "development" && (
              <details className="mt-2">
                <summary className="cursor-pointer">Error Details (Development)</summary>
                <pre className="mt-2 text-xs overflow-x-auto bg-muted p-2 rounded">
                  {error instanceof Error ? error.stack || error.message : String(error)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/admin">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}