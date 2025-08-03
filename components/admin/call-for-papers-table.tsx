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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Pencil, Trash, Eye, User, Calendar, ExternalLink, Clock, FileText, Loader2 } from "lucide-react"

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type CallForPapersRow = {
  id: string
  title: string
  thematicFocus: string
  description: string
  deadline: string
  volume: number
  issue: number
  year: number
  publisher: string
  fee?: string | null
  contentLink?: string | null
  topics: string[]
  createdAt: string
  updatedAt: string
}

interface CallForPapersTableProps {
  initialCalls: CallForPapersRow[]
}

export function CallForPapersTable({ initialCalls }: CallForPapersTableProps) {
  const [calls, setCalls] = useState<CallForPapersRow[]>(initialCalls)
  const [sorting, setSorting] = useState<SortingState>([{ id: "deadline", desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

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
            Title & Details
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="space-y-2 max-w-[350px]">
          <div className="font-medium truncate">{row.getValue("title")}</div>
          <div className="text-sm text-muted-foreground truncate">
            <span className="font-medium">Focus:</span> {row.original.thematicFocus}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {row.original.description}
          </div>
          {row.original.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {row.original.topics.slice(0, 3).map((topic, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
              {row.original.topics.length > 3 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs cursor-help">
                        +{row.original.topics.length - 3} more
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        {row.original.topics.slice(3).map((topic, index) => (
                          <div key={index} className="text-xs">{topic}</div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
            Deadline & Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const deadline = new Date(row.getValue("deadline") as string)
        const now = new Date()
        const isExpired = deadline < now
        const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        return (
          <div className="space-y-1">
            <div className={`flex items-center gap-2 ${isExpired ? 'text-red-600' : daysUntilDeadline <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{deadline.toLocaleDateString()}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {isExpired ? (
                <span className="text-red-600 font-medium">Expired</span>
              ) : daysUntilDeadline <= 7 ? (
                <span className="text-orange-600 font-medium">{daysUntilDeadline} days left</span>
              ) : (
                <span className="text-green-600 font-medium">{daysUntilDeadline} days left</span>
              )}
            </div>
            {row.original.contentLink && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <FileText className="h-3 w-3" />
                <span>Has details link</span>
              </div>
            )}
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
            Issue {row.original.issue}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.year}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "publisher",
      header: "Publisher",
      cell: ({ row }) => (
        <div className="flex items-start gap-2 max-w-[150px]">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-medium text-sm truncate" title={row.getValue("publisher")}>
              {row.getValue("publisher")}
            </div>
            <div className="text-xs text-muted-foreground">Email</div>
            {row.original.fee && (
              <Badge variant="secondary" className="text-xs">
                {row.original.fee}
              </Badge>
            )}
            {!row.original.fee && (
              <Badge variant="outline" className="text-xs text-green-600">
                Free
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const createdAt = new Date(row.getValue("createdAt") as string)
        const updatedAt = new Date(row.original.updatedAt)
        const wasUpdated = updatedAt.getTime() !== createdAt.getTime()
        
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{createdAt.toLocaleDateString()}</span>
            </div>
            {wasUpdated && (
              <div className="text-xs text-muted-foreground">
                Updated: {updatedAt.toLocaleDateString()}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const cfp = row.original
        const [open, setOpen] = useState(false)

        const handleDelete = async () => {
          setIsDeleting(cfp.id)
          try {
            const result = await deleteCallForPapers(cfp.id)
            if (result.success) {
              toast({
                title: "Call for papers deleted",
                description: `"${cfp.title}" has been deleted successfully.`,
              })
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
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => navigator.clipboard.writeText(cfp.id)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/admin/call-for-papers/${cfp.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Call for Papers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/notifications`} target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    View on Public Page
                  </Link>
                </DropdownMenuItem>
                {cfp.contentLink && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={cfp.contentLink} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        View Details Page
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Call for Papers
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <p>This action cannot be undone. This will permanently delete:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>The call for papers: <strong>"{cfp.title}"</strong></li>
                    <li>All associated metadata (topics, deadlines, etc.)</li>
                    <li>Any auto-generated notifications</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    Consider editing instead if you only need to update information.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting === cfp.id}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting === cfp.id}
                >
                  {isDeleting === cfp.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Permanently"
                  )}
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

  // Statistics for the current filtered data
  const stats = {
    total: calls.length,
    active: calls.filter(call => new Date(call.deadline) > new Date()).length,
    expired: calls.filter(call => new Date(call.deadline) <= new Date()).length,
    withDetailsLink: calls.filter(call => call.contentLink).length,
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card text-card-foreground p-4 rounded-lg border">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Calls</div>
        </div>
        <div className="bg-card text-card-foreground p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="bg-card text-card-foreground p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          <div className="text-sm text-muted-foreground">Expired</div>
        </div>
        <div className="bg-card text-card-foreground p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{stats.withDetailsLink}</div>
          <div className="text-sm text-muted-foreground">With Details</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by title, focus, or publisher..."
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
              {isDeleting === "bulk" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete {selectedRows.length} selected
                </>
              )}
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
                    {column.id.replace(/([A-Z])/g, ' $1').trim()}
                  </DropdownMenuItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
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
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No calls for papers found.</p>
                    <p className="text-sm text-muted-foreground">Create your first call for papers to get started.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </p>
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