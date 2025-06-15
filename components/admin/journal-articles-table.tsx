"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Pencil, Trash, Eye } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { deleteJournalArticle } from "@/lib/actions/journal-article-actions"
import { useRouter } from "next/navigation"

export type JournalArticleRow = {
  id: string
  title: string
  slug: string
  author: string | { id: string; name: string }
  date: string
  image?: string | null
  volume?: number | null
  issue?: number | null
  doi?: string | null
  categories?: { id: string; name: string }[] | string[]
  status: string
}

interface JournalArticlesTableProps {
  initialArticles: JournalArticleRow[]
}

export function JournalArticlesTable({ initialArticles }: JournalArticlesTableProps) {
  const router = useRouter()
  const [articles, setArticles] = useState<JournalArticleRow[]>(initialArticles)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false) // Moved useState to top level

  const columns: ColumnDef<JournalArticleRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 relative overflow-hidden rounded">
            <Image
              src={row.original.image || "/placeholder.svg?height=40&width=40&query=article"}
              alt={row.getValue("title")}
              fill
              className="object-cover"
            />
          </div>
          <span className="max-w-[400px] truncate font-medium">{row.getValue("title")}</span>
        </div>
      ),
    },
    {
      accessorKey: "author",
      header: "Author",
      cell: ({ row }) => {
        const author = row.original.author
        return <div>{typeof author === "string" ? author : author.name}</div>
      },
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
      cell: ({ row }) => <div>{row.getValue("date")}</div>,
    },
    {
      accessorKey: "volume",
      header: "Volume",
      cell: ({ row }) => {
        const article = row.original
        return <div>{article.volume || "—"}</div>
      },
    },
    {
      accessorKey: "issue",
      header: "Issue",
      cell: ({ row }) => {
        const article = row.original
        return <div>{article.issue || "—"}</div>
      },
    },
    {
      accessorKey: "doi",
      header: "DOI",
      cell: ({ row }) => {
        const article = row.original
        return <div>{article.doi || "—"}</div>
      },
    },
    {
      accessorKey: "categories",
      header: "Categories",
      cell: ({ row }) => {
        const article = row.original
        const categories = article.categories || []
        return (
          <div className="flex flex-wrap gap-1">
            {categories.length > 0 ? (
              categories.map((category) => (
                <Badge
                  key={typeof category === "string" ? category : category.id}
                  variant="outline"
                  className="capitalize"
                >
                  {typeof category === "string" ? category.replace(/-/g, " ") : category.name.replace(/-/g, " ")}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "published" ? "default" : status === "draft" ? "outline" : "secondary"}>
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const article = row.original

        const handleDelete = async () => {
          setIsDeleting(true)
          try {
            const result = await deleteJournalArticle(article.slug)
            if (result.success) {
              toast({
                title: "Journal article deleted",
                description: `"${article.title}" has been deleted.`,
              })
              // Remove from local state
              setArticles(articles.filter((a) => a.slug !== article.slug))
            } else {
              toast({
                title: "Error",
                description: result.error || "Failed to delete journal article",
                variant: "destructive",
              })
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "An unexpected error occurred",
              variant: "destructive",
            })
          } finally {
            setIsDeleting(false)
            setOpen(false)
          }
        }

        return (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/journal-articles/${article.slug}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/journals/${article.slug}`} target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the journal article "{article.title}" and
                  remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  className="bg-destructive text-destructive-foreground"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ]

  const table = useReactTable({
    data: articles,
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
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter articles..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuItem key={column.id} className="capitalize" onSelect={(e) => e.preventDefault()}>
                    <Checkbox
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      className="mr-2"
                    />
                    {column.id}
                  </DropdownMenuItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
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
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
