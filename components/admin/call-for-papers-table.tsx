"use client"

import { useState } from "react"
import Link from "next/link"
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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Pencil, Trash, Eye, Building, Calendar, ExternalLink } from "lucide-react"

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
import { deleteCallForPapers } from "@/lib/actions/call-for-papers-actions"
import { Badge } from "@/components/ui/badge"

export type CallForPapersRow = {
  id: string
  title: string
  thematicFocus: string
  deadline: string
  volume: number
  issue: number
  year: number
  publisher: string
  fee?: string | null
  contentLink?: string | null
  topics: string[]
}

interface CallForPapersTableProps {
  initialCalls: CallForPapersRow[]
}

export function CallForPapersTable({ initialCalls }: CallForPapersTableProps) {
  const [calls, setCalls] = useState<CallForPapersRow[]>(initialCalls)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isDeleting, setIsDeleting] = useState<string | null>(null) // Track which item is being deleted

  const columns: ColumnDef<CallForPapersRow>[] = [
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
        <div className="space-y-1">
          <div className="font-medium max-w-[300px] truncate">{row.getValue("title")}</div>
          <div className="text-sm text-muted-foreground max-w-[300px] truncate">
            {row.original.thematicFocus}
          </div>
          {row.original.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {row.original.topics.slice(0, 2).map((topic, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {row.original.topics.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{row.original.topics.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "deadline",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Deadline
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const deadline = new Date(row.getValue("deadline") as string)
        const isExpired = deadline < new Date()
        return (
          <div className="space-y-1">
            <div className={`flex items-center gap-2 ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{deadline.toLocaleDateString()}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {isExpired ? 'Expired' : 'Active'}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "volume",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Volume/Issue
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">Vol. {row.getValue("volume")}</div>
          <div className="text-sm text-muted-foreground">
            Issue {row.original.issue} ({row.original.year})
          </div>
        </div>
      ),
    },
    {
      accessorKey: "publisher",
      header: "Publisher",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 max-w-[150px]">
          <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate">{row.getValue("publisher")}</span>
        </div>
      ),
    },
    {
      accessorKey: "fee",
      header: "Fee",
      cell: ({ row }) => {
        const fee = row.getValue("fee") as string | null
        return (
          <div className="text-sm">
            {fee ? (
              <Badge variant="secondary">{fee}</Badge>
            ) : (
              <Badge variant="outline" className="text-green-600">Free</Badge>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const cfp = row.original
        const [open, setOpen] = useState(false) // Move useState inside the cell component

        const handleDelete = async () => {
          setIsDeleting(cfp.id)
          try {
            const result = await deleteCallForPapers(cfp.id)
            if (result.success) {
              toast({
                title: "Call for papers deleted",
                description: `"${cfp.title}" has been deleted.`,
              })
              // Remove from local state
              setCalls(calls.filter((c) => c.id !== cfp.id))
            } else {
              toast({
                title: "Error",
                description: result.error || "Failed to delete call for papers",
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
            setIsDeleting(null)
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
                <DropdownMenuItem 
                  onClick={() => navigator.clipboard.writeText(cfp.id)}
                >
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/admin/call-for-papers/${cfp.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/notifications`} target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    View Public
                  </Link>
                </DropdownMenuItem>
                {cfp.contentLink && (
                  <DropdownMenuItem asChild>
                    <Link href={cfp.contentLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Submission Link
                    </Link>
                  </DropdownMenuItem>
                )}
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
                  This action cannot be undone. This will permanently delete the call for papers "{cfp.title}" and
                  remove it from our servers. Any associated notifications will also be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting === cfp.id}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  className="bg-destructive text-destructive-foreground"
                  disabled={isDeleting === cfp.id}
                >
                  {isDeleting === cfp.id ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      },
    },
  ]

  const table = useReactTable({
    data: calls,
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

  const selectedRows = table.getFilteredSelectedRowModel().rows
  
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return
    
    const ids = selectedRows.map(row => row.original.id)
    setIsDeleting("bulk")
    
    try {
      const results = await Promise.allSettled(
        ids.map(id => deleteCallForPapers(id))
      )
      
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length
      
      if (successful > 0) {
        toast({
          title: "Bulk delete completed",
          description: `${successful} call(s) for papers deleted successfully.`,
        })
        
        // Remove successful deletions from local state
        setCalls(calls.filter(call => !ids.includes(call.id)))
        setRowSelection({})
      }
      
      const failed = results.length - successful
      if (failed > 0) {
        toast({
          title: "Some deletions failed",
          description: `${failed} call(s) for papers could not be deleted.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during bulk delete",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filter calls for papers..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
          {selectedRows.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleBulkDelete}
              disabled={isDeleting === "bulk"}
            >
              {isDeleting === "bulk" ? "Deleting..." : `Delete ${selectedRows.length} selected`}
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
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
      <div className="flex items-center justify-between space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </p>
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