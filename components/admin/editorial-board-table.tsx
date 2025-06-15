"use client"

import { useState, useEffect } from "react"
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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Pencil, Trash, ArrowUp, ArrowDown, Loader2 } from "lucide-react"

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
import { getEditorialBoard, deleteBoardMember, reorderBoardMembers } from "@/lib/actions/editorial-board-actions"

export type Member = {
  id: string
  name: string
  designation: string
  image?: string
  order: number
  bio?: string
  email: string
}

export function EditorialBoardTable() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: "order", desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    name: true,
    designation: true,
    order: true,
    actions: true,
  })
  const [rowSelection, setRowSelection] = useState({})
  const [open, setOpen] = useState(false) // Moved useState to top level
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null) // Moved useState to top level

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true)
      try {
        const result = await getEditorialBoard()
        if (result.success) {
          setMembers(result.data)
        } else {
          setError(result.error as string)
          toast({
            title: "Error",
            description: result.error as string,
            variant: "destructive",
          })
        }
      } catch (err) {
        console.error("Failed to fetch editorial board members:", err)
        setError("Failed to fetch editorial board members. Please try again.")
        toast({
          title: "Error",
          description: "Failed to fetch editorial board members. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  const handleDeleteMember = async (id: string) => {
    try {
      const result = await deleteBoardMember(id)
      if (result.success) {
        setMembers(members.filter((member) => member.id !== id))
        toast({
          title: "Member removed",
          description: "The member has been removed from the editorial board.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error as string,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed to delete member:", err)
      toast({
        title: "Error",
        description: "Failed to delete member. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMoveUp = async (id: string) => {
    const index = members.findIndex((m) => m.id === id)
    if (index <= 0) return // Already at the top

    const newMembers = [...members]
    const temp = newMembers[index - 1]
    newMembers[index - 1] = newMembers[index]
    newMembers[index] = temp

    // Update the order property
    newMembers.forEach((member, i) => {
      member.order = i + 1
    })

    setMembers(newMembers)

    try {
      const result = await reorderBoardMembers(newMembers.map((m) => m.id))
      if (result.success) {
        toast({
          title: "Order updated",
          description: "The display order has been updated.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error as string,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed to update order:", err)
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMoveDown = async (id: string) => {
    const index = members.findIndex((m) => m.id === id)
    if (index >= members.length - 1) return // Already at the bottom

    const newMembers = [...members]
    const temp = newMembers[index + 1]
    newMembers[index + 1] = newMembers[index]
    newMembers[index] = temp

    // Update the order property
    newMembers.forEach((member, i) => {
      member.order = i + 1
    })

    setMembers(newMembers)

    try {
      const result = await reorderBoardMembers(newMembers.map((m) => m.id))
      if (result.success) {
        toast({
          title: "Order updated",
          description: "The display order has been updated.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error as string,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed to update order:", err)
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<Member>[] = [
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
        const member = row.original

        return (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMoveUp(member.id)}
              className="h-8 w-8 p-0 mr-1"
              disabled={row.index === 0}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Move up</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMoveDown(member.id)}
              className="h-8 w-8 p-0 mr-1"
              disabled={row.index === members.length - 1}
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
                  <Link href={`/admin/editorial-board/${member.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    setSelectedMemberId(member.id)
                    setOpen(true)
                  }}
                >
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
    data: members,
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading editorial board members...</span>
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
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter members..."
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
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} member(s)
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
              {members.find((m) => m.id === selectedMemberId)?.name}" from the editorial board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedMemberId) handleDeleteMember(selectedMemberId)
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
