// components/admin/journal-issues-table.tsx - Updated for actual schema
"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2, Eye, Calendar, BookOpen } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { deleteJournalIssue } from "@/lib/actions/journal-actions"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface JournalIssue {
  id: string
  volume: number
  theme?: string
  issue: number
  year: number
  publishDate?: string
  articleCount: number
  articles: any[]
}

interface JournalIssuesTableProps {
  initialIssues: JournalIssue[]
  canCreate: boolean
}

export function JournalIssuesTable({ initialIssues, canCreate }: JournalIssuesTableProps) {
  const [issues, setIssues] = useState<JournalIssue[]>(initialIssues)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [issueToDelete, setIssueToDelete] = useState<JournalIssue | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (issue: JournalIssue) => {
    setIssueToDelete(issue)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!issueToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteJournalIssue(issueToDelete.id)
      
      if (result.success) {
        setIssues(prev => prev.filter(issue => issue.id !== issueToDelete.id))
        toast({
          title: "Journal Issue Deleted",
          description: `Volume ${issueToDelete.volume}, Issue ${issueToDelete.issue} (${issueToDelete.year}) has been deleted successfully.`,
        })
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Failed to delete journal issue",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete journal issue:", error)
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred while deleting the journal issue",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setIssueToDelete(null)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return "Invalid date"
    }
  }

  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No journal issues found</h3>
          <p className="text-muted-foreground mb-4 text-center">
            {canCreate 
              ? "Get started by creating your first journal issue."
              : "No journal issues have been created yet."
            }
          </p>
          {canCreate && (
            <Button asChild>
              <Link href="/admin/journals/new">
                Create First Issue
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Journal Issues ({issues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue Details</TableHead>
                <TableHead>Theme</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Publish Date</TableHead>
                <TableHead className="text-center">Articles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  {/* Issue Details */}
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        Volume {issue.volume}, Issue {issue.issue}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {issue.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>

                  {/* Theme */}
                  <TableCell>
                    {issue.theme ? (
                      <div className="max-w-[200px]">
                        <p className="text-sm truncate" title={issue.theme}>
                          {issue.theme}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No theme</span>
                    )}
                  </TableCell>

                  {/* Year */}
                  <TableCell>
                    <Badge variant="outline">{issue.year}</Badge>
                  </TableCell>

                  {/* Publish Date */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{formatDate(issue.publishDate)}</span>
                    </div>
                  </TableCell>

                  {/* Articles Count */}
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {issue.articleCount}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/journals/volume-${issue.volume}/issue-${issue.issue}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Issue
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/journals/${issue.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteClick(issue)}
                          disabled={issue.articleCount > 0}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                          {issue.articleCount > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (has articles)
                            </span>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Issue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Volume {issueToDelete?.volume}, Issue {issueToDelete?.issue} ({issueToDelete?.year})?
              {issueToDelete?.theme && (
                <span className="block mt-1">Theme: {issueToDelete.theme}</span>
              )}
              <br />
              This action cannot be undone and will permanently remove this journal issue from the system.
              {issueToDelete && issueToDelete.articleCount > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  This issue contains {issueToDelete.articleCount} article(s). Please reassign or remove them first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting || (issueToDelete && issueToDelete.articleCount > 0)}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Issue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}