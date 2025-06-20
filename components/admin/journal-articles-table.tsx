// components/admin/journal-articles-table.tsx - UPDATED for multiple authors
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  Calendar,
  Clock,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  Users,
  BookOpen,
} from "lucide-react"
import { deleteJournalArticle } from "@/lib/actions/journal-article-actions"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Updated interface to support multiple authors
interface JournalArticle {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  date: string
  readTime: number
  image: string
  draft: boolean
  views: number
  doi?: string
  keywords: string[]
  // UPDATED: Support both old and new author structures for backward compatibility
  Author?: {
    id: string
    name: string
    email: string
  } | null
  Authors?: Array<{
    id: string
    name: string
    email: string
  }> | null
  journalIssue?: {
    id: string
    title: string
    volume: number
    issue: number
    year: number
  } | null
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
}

interface JournalArticlesTableProps {
  articles: JournalArticle[]
}

export function JournalArticlesTable({ articles }: JournalArticlesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<JournalArticle[]>(articles)

  const handleDelete = async (slug: string) => {
    const result = await deleteJournalArticle(slug)

    if (result.success) {
      // Remove the deleted article from the table
      setData(currentData => currentData.filter(article => article.slug !== slug))
      
      toast({
        title: "✅ Article Deleted",
        description: "The journal article has been deleted successfully.",
      })
    } else {
      toast({
        title: "❌ Error",
        description: result.error || "Failed to delete article",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<JournalArticle>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => (
        <div className="h-12 w-16 relative overflow-hidden rounded">
          <Image
            src={row.getValue("image") || "/placeholder.svg"}
            alt={row.getValue("title")}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium truncate">{row.getValue("title")}</div>
          <div className="text-sm text-muted-foreground truncate">
            {row.original.excerpt}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={row.original.draft ? "secondary" : "default"} className="text-xs">
              {row.original.draft ? "Draft" : "Published"}
            </Badge>
            {row.original.doi && (
              <Badge variant="outline" className="text-xs">
                DOI
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      // UPDATED: Authors column to handle multiple authors
      id: "authors",
      header: "Authors",
      cell: ({ row }) => {
        // Get authors from either the new Authors array or legacy Author field
        const authors = row.original.Authors || (row.original.Author ? [row.original.Author] : [])
        const authorCount = authors.length
        
        if (authorCount === 0) {
          return (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">No Author</div>
            </div>
          )
        }
        
        return (
          <div className="flex items-center gap-2">
            {authorCount === 1 ? (
              <User className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Users className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <div className="font-medium">
                {authorCount === 1 ? (
                  authors[0].name
                ) : (
                  `${authors[0].name} +${authorCount - 1} more`
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {authors[0].email}
              </div>
              {authorCount > 1 && (
                <div className="text-xs text-muted-foreground mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {authorCount} authors
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "journalIssue",
      header: "Issue",
      cell: ({ row }) => (
        <div>
          {row.original.journalIssue ? (
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <Badge variant="outline" className="text-xs">
                  Vol. {row.original.journalIssue.volume}, No. {row.original.journalIssue.issue}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {row.original.journalIssue.year}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Not assigned</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">
              {new Date(row.getValue("date")).toLocaleDateString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(row.getValue("date")).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "readTime",
      header: "Read Time",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.getValue("readTime")} min</span>
        </div>
      ),
    },
    {
      accessorKey: "views",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Views
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue("views") || 0}</span>
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const article = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/journal-articles/${article.slug}/edit`} className="flex items-center">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Article
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/journals/${article.slug}`} className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  View Article
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Article
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the article
                      &quot;{article.title}&quot; and remove all its data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(article.slug)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Article
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No articles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}