"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Edit, Trash2, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { getAuthorsList, deleteExistingAuthor } from "@/lib/actions/author-actions"

export type Author = {
  id: string
  name: string
  email: string
  slug: string
  title?: string
  bio?: string
  image?: string
  userId?: string
}

export function AuthorsTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuthors = async () => {
      setLoading(true)
      try {
        const result = await getAuthorsList()
        if (result.success) {
          setAuthors(result.data)
        } else {
          setError(result.error as string)
          toast({
            title: "Error",
            description: result.error as string,
            variant: "destructive",
          })
        }
      } catch (err) {
        console.error("Failed to fetch authors:", err)
        setError("Failed to fetch authors. Please try again.")
        toast({
          title: "Error",
          description: "Failed to fetch authors. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAuthors()
  }, [])

  const handleDeleteAuthor = async (slug: string) => {
    try {
      const result = await deleteExistingAuthor(slug)
      if (result.success) {
        setAuthors(authors.filter((author) => author.slug !== slug))
        toast({
          title: "Author deleted",
          description: "The author has been deleted successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error as string,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed to delete author:", err)
      toast({
        title: "Error",
        description: "Failed to delete author. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredAuthors = authors.filter(
    (author) =>
      author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      author.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (author.title && author.title.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading authors...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search authors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAuthors.length > 0 ? (
              filteredAuthors.map((author) => (
                <TableRow key={author.slug}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden relative">
                        <Image
                          src={author.image || "/placeholder.svg?height=40&width=40"}
                          alt={author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span>{author.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{author.email}</TableCell>
                  <TableCell>{author.title || "-"}</TableCell>
                  <TableCell>{author.userId || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/authors/${author.slug}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the author and may affect any
                              content associated with them.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAuthor(author.slug)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No authors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
