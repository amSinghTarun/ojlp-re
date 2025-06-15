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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Pencil, Trash, ArrowUp, ArrowDown } from "lucide-react"

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
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { deleteBoardAdvisor, updateBoardAdvisorOrder } from "@/lib/actions/board-advisor-actions"
import { useRouter } from "next/navigation"

export type Advisor = {
  id: string
  name: string
  designation: string
  institution?: string | null
  bio?: string | null
  image?: string | null
  order: number
  socialLinks?: Record<string, string> | null
}

interface BoardAdvisorsTableProps {
  initialAdvisors: Advisor[]
}

export function BoardAdvisorsTable({ initialAdvisors }: BoardAdvisorsTableProps) {
  const router = useRouter()
  const [advisors, setAdvisors] = useState<Advisor[]>(initialAdvisors)
  const [sorting, setSorting] = useState<SortingState>([{ id: "order", desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false)
  const [open, setOpen] = useState(false) // Moved useState to top level

  const columns: ColumnDef<Advisor>[] = [
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
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 overflow-hidden rounded-full">
            <Image
              src={row.original.image || "/placeholder.svg?height=32&width=32&query=person"}
              alt={row.getValue("name")}
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "designation",
      header: "Designation",
      cell: ({ row }) => <div>{row.getValue("designation")}</div>,
    },
    {
      accessorKey: "institution",
      header: "Institution",
      cell: ({ row }) => <div>{row.getValue("institution") || "—"}</div>,
    },
    {
      accessorKey: "order",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Display Order
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-center">{row.getValue("order")}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const advisor = row.original

        const handleDelete = async () => {
          setIsDeleting(true)
          try {
            const result = await deleteBoardAdvisor(advisor.id)
            if (result.success) {
              toast({
                title: "Advisor removed",
                description: `"${advisor.name}" has been removed from the board of advisors.`,
              })
              // Remove from local state
              setAdvisors(advisors.filter((a) => a.id !== advisor.id))
            } else {
              toast({
                title: "Error",
                description: result.error || "Failed to remove advisor",
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

        const handleMoveUp = async () => {
          if (isUpdatingOrder) return

          const currentIndex = advisors.findIndex((a) => a.id === advisor.id)
          if (currentIndex <= 0) return

          const prevAdvisor = advisors[currentIndex - 1]
          const newOrder = prevAdvisor.order

          setIsUpdatingOrder(true)
          try {
            const result = await updateBoardAdvisorOrder(advisor.id, newOrder)
            if (result.success) {
              // Update previous advisor's order
              await updateBoardAdvisorOrder(prevAdvisor.id, advisor.order)

              toast({
                title: "Order updated",
                description: `"${advisor.name}" has been moved up in the display order.`,
              })

              // Update local state
              const updatedAdvisors = [...advisors]
              updatedAdvisors[currentIndex - 1] = { ...prevAdvisor, order: advisor.order }
              updatedAdvisors[currentIndex] = { ...advisor, order: newOrder }
              setAdvisors(updatedAdvisors)
            } else {
              toast({
                title: "Error",
                description: result.error || "Failed to update order",
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
            setIsUpdatingOrder(false)
          }
        }

        const handleMoveDown = async () => {
          if (isUpdatingOrder) return

          const currentIndex = advisors.findIndex((a) => a.id === advisor.id)
          if (currentIndex >= advisors.length - 1) return

          const nextAdvisor = advisors[currentIndex + 1]
          const newOrder = nextAdvisor.order

          setIsUpdatingOrder(true)
          try {
            const result = await updateBoardAdvisorOrder(advisor.id, newOrder)
            if (result.success) {
              // Update next advisor's order
              await updateBoardAdvisorOrder(nextAdvisor.id, advisor.order)

              toast({
                title: "Order updated",
                description: `"${advisor.name}" has been moved down in the display order.`,
              })

              // Update local state
              const updatedAdvisors = [...advisors]
              updatedAdvisors[currentIndex + 1] = { ...nextAdvisor, order: advisor.order }
              updatedAdvisors[currentIndex] = { ...advisor, order: newOrder }
              setAdvisors(updatedAdvisors)
            } else {
              toast({
                title: "Error",
                description: result.error || "Failed to update order",
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
            setIsUpdatingOrder(false)
          }
        }

        return (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMoveUp}
              className="h-8 w-8 p-0 mr-1"
              disabled={isUpdatingOrder}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Move up</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMoveDown}
              className="h-8 w-8 p-0 mr-1"
              disabled={isUpdatingOrder}
            >
              <ArrowDown className="h-4 w-4" />
              <span className="sr-only">Move down</span>
            </Button>
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
                  <Link href={`/admin/board-advisors/${advisor.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setOpen(true)}>
                  <Trash className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: advisors,
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
          placeholder="Filter advisors..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
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
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} advisor(s)
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
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove "
              {advisors.find((a) => a.id === Object.keys(rowSelection)[0])?.name}" from the board of advisors.
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
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
