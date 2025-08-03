 "use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Pencil, Trash, ArrowUp, ArrowDown, Loader2, Users, UserCheck, ExternalLink } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { getEditorialBoard, deleteBoardMember, reorderBoardMembers } from "@/lib/actions/editorial-board-actions"
import { BoardMemberType } from "@prisma/client"

export type Member = {
  id: string
  name: string
  designation: string
  memberType: BoardMemberType
  image: string
  order: number
  bio: string
  email?: string | null
  expertise: string[]
  linkedin?: string | null
  orcid?: string | null
  archived: boolean
  createdAt: Date
  updatedAt: Date
}

interface MemberTableProps {
  members: Member[]
  memberType: BoardMemberType
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  actionLoading?: string | null
}

function MemberTable({ members, memberType, onDelete, onMoveUp, onMoveDown, actionLoading }: MemberTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "order", desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // Memoize filtered members to prevent recalculation
  const filteredMembers = useMemo(() => 
    members.filter(member => member.memberType === memberType && !member.archived), 
    [members, memberType]
  )

  // Memoize columns to prevent recreation
  const columns: ColumnDef<Member>[] = useMemo(() => [
    {
      accessorKey: "order",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Order
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("order")}</div>,
    },
    {
      accessorKey: "image",
      header: "Photo",
      cell: ({ row }) => {
        const imageUrl = row.getValue("image") as string
        return (
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            {imageUrl ? (
              <Image src={imageUrl} alt={row.getValue("name")} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        )
      },
      enableSorting: false,
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
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "designation",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Designation
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("designation")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string | null
        return email ? (
          <div className="text-sm text-muted-foreground">{email}</div>
        ) : (
          <div className="text-sm text-muted-foreground">No email</div>
        )
      },
    },
    {
      accessorKey: "expertise",
      header: "Expertise",
      cell: ({ row }) => {
        const expertise = row.getValue("expertise") as string[]
        return expertise && expertise.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {expertise.slice(0, 2).map((area, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {area}
              </Badge>
            ))}
            {expertise.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{expertise.length - 2} more
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">None specified</span>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "linkedin",
      header: "Links",
      cell: ({ row }) => {
        const linkedin = row.getValue("linkedin") as string | null
        const orcid = row.original.orcid
        
        return (
          <div className="flex gap-1">
            {linkedin && (
              <Button variant="ghost" size="sm" asChild>
                <a href={linkedin} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
            {orcid && (
              <Button variant="ghost" size="sm" asChild>
                <a href={`https://orcid.org/${orcid}`} target="_blank" rel="noopener noreferrer">
                  ORCID
                </a>
              </Button>
            )}
            {!linkedin && !orcid && (
              <span className="text-sm text-muted-foreground">None</span>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const member = row.original
        const currentIndex = filteredMembers.findIndex(m => m.id === member.id)
        const isFirst = currentIndex === 0
        const isLast = currentIndex === filteredMembers.length - 1
        const isActionLoading = actionLoading === member.id

        return <ActionButtons 
          member={member}
          isFirst={isFirst}
          isLast={isLast}
          isActionLoading={isActionLoading}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDelete={onDelete}
        />
      },
    },
  ], [filteredMembers, actionLoading, onMoveUp, onMoveDown, onDelete])

  const table = useReactTable({
    data: filteredMembers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder={`Filter ${memberType.toLowerCase()}s...`}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary">
            {filteredMembers.length} {memberType.toLowerCase()}(s)
          </Badge>
          <ColumnVisibilityDropdown table={table} />
        </div>
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No {memberType.toLowerCase()}s found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredMembers.length > 0 && (
        <div className="flex items-center justify-end space-x-2">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing {table.getFilteredRowModel().rows.length} {memberType.toLowerCase()}(s)
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
      )}
    </div>
  )
}

// Separate component for action buttons to prevent re-renders
interface ActionButtonsProps {
  member: Member
  isFirst: boolean
  isLast: boolean
  isActionLoading: boolean
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onDelete: (id: string) => void
}

function ActionButtons({ member, isFirst, isLast, isActionLoading, onMoveUp, onMoveDown, onDelete }: ActionButtonsProps) {
  const handleMoveUp = useCallback(() => onMoveUp(member.id), [onMoveUp, member.id])
  const handleMoveDown = useCallback(() => onMoveDown(member.id), [onMoveDown, member.id])
  const handleDelete = useCallback(() => onDelete(member.id), [onDelete, member.id])

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleMoveUp}
        disabled={isFirst || isActionLoading}
        title="Move up"
      >
        {isActionLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ArrowUp className="h-3 w-3" />
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleMoveDown}
        disabled={isLast || isActionLoading}
        title="Move down"
      >
        {isActionLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionLoading}>
            <span className="sr-only">Open menu</span>
            {isActionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
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
            className="text-destructive focus:text-destructive"
            onClick={handleDelete}
            disabled={isActionLoading}
          >
            <Trash className="mr-2 h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Separate component for column visibility dropdown
function ColumnVisibilityDropdown({ table }: { table: any }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Columns <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter((column: any) => column.getCanHide())
          .map((column: any) => {
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
  )
}

export function EditorialBoardTable() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Load members
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

  const handleDeleteMember = useCallback(async (id: string) => {
    if (actionLoading) return
    
    setActionLoading(id)
    
    try {
      const result = await deleteBoardMember(id)
      if (result.success) {
        setMembers(prevMembers => prevMembers.filter((member) => member.id !== id))
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
    } finally {
      setActionLoading(null)
    }
  }, [actionLoading])

  const handleMoveUp = useCallback(async (id: string, memberType: BoardMemberType) => {
    if (actionLoading) return
    
    const typeMembers = members.filter(m => m.memberType === memberType && !m.archived).sort((a, b) => a.order - b.order)
    const index = typeMembers.findIndex((m) => m.id === id)
    if (index <= 0) return

    setActionLoading(id)
    const originalMembers = [...members]
    
    try {
      const newMembers = [...members]
      const memberIndex = newMembers.findIndex(m => m.id === id)
      const previousMemberIndex = newMembers.findIndex(m => m.id === typeMembers[index - 1].id)
      
      const tempOrder = newMembers[memberIndex].order
      newMembers[memberIndex].order = newMembers[previousMemberIndex].order
      newMembers[previousMemberIndex].order = tempOrder

      setMembers(newMembers)

      const result = await reorderBoardMembers(newMembers.map((m) => m.id))
      
      if (result.success) {
        toast({
          title: "Order updated",
          description: "The display order has been updated.",
        })
      } else {
        setMembers(originalMembers)
        toast({
          title: "Error",
          description: result.error as string,
          variant: "destructive",
        })
      }
    } catch (err) {
      setMembers(originalMembers)
      console.error("Failed to update order:", err)
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }, [members, actionLoading])

  const handleMoveDown = useCallback(async (id: string, memberType: BoardMemberType) => {
    if (actionLoading) return
    
    const typeMembers = members.filter(m => m.memberType === memberType && !m.archived).sort((a, b) => a.order - b.order)
    const index = typeMembers.findIndex((m) => m.id === id)
    if (index >= typeMembers.length - 1) return

    setActionLoading(id)
    const originalMembers = [...members]
    
    try {
      const newMembers = [...members]
      const memberIndex = newMembers.findIndex(m => m.id === id)
      const nextMemberIndex = newMembers.findIndex(m => m.id === typeMembers[index + 1].id)
      
      const tempOrder = newMembers[memberIndex].order
      newMembers[memberIndex].order = newMembers[nextMemberIndex].order
      newMembers[nextMemberIndex].order = tempOrder

      setMembers(newMembers)

      const result = await reorderBoardMembers(newMembers.map((m) => m.id))
      
      if (result.success) {
        toast({
          title: "Order updated",
          description: "The display order has been updated.",
        })
      } else {
        setMembers(originalMembers)
        toast({
          title: "Error",
          description: result.error as string,
          variant: "destructive",
        })
      }
    } catch (err) {
      setMembers(originalMembers)
      console.error("Failed to update order:", err)
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }, [members, actionLoading])

  const confirmDelete = useCallback((id: string) => {
    setSelectedMemberId(id)
    setOpen(true)
  }, [])

  const executeDelete = useCallback(async () => {
    if (selectedMemberId) {
      await handleDeleteMember(selectedMemberId)
      setOpen(false)
      setSelectedMemberId(null)
    }
  }, [selectedMemberId, handleDeleteMember])

  // Memoize move handlers with member type
  const handleEditorMoveUp = useCallback((id: string) => handleMoveUp(id, BoardMemberType.Editor), [handleMoveUp])
  const handleEditorMoveDown = useCallback((id: string) => handleMoveDown(id, BoardMemberType.Editor), [handleMoveDown])
  const handleAdvisorMoveUp = useCallback((id: string) => handleMoveUp(id, BoardMemberType.Advisor), [handleMoveUp])
  const handleAdvisorMoveDown = useCallback((id: string) => handleMoveDown(id, BoardMemberType.Advisor), [handleMoveDown])

  // Memoize counts
  const editorCount = useMemo(() => members.filter(m => m.memberType === BoardMemberType.Editor && !m.archived).length, [members])
  const advisorCount = useMemo(() => members.filter(m => m.memberType === BoardMemberType.Advisor && !m.archived).length, [members])

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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Editors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{editorCount}</div>
            <p className="text-xs text-muted-foreground">Editorial board members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advisors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advisorCount}</div>
            <p className="text-xs text-muted-foreground">Board advisory members</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="editors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="editors" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Editors ({editorCount})
          </TabsTrigger>
          <TabsTrigger value="advisors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Advisors ({advisorCount})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="editors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Editorial Board Members</CardTitle>
              <CardDescription>
                Manage the core editorial team responsible for reviewing and publishing content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberTable
                members={members}
                memberType={BoardMemberType.Editor}
                onDelete={confirmDelete}
                onMoveUp={handleEditorMoveUp}
                onMoveDown={handleEditorMoveDown}
                actionLoading={actionLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advisors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Board Advisors</CardTitle>
              <CardDescription>
                Manage the advisory board members who provide strategic guidance and expertise.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberTable
                members={members}
                memberType={BoardMemberType.Advisor}
                onDelete={confirmDelete}
                onMoveUp={handleAdvisorMoveUp}
                onMoveDown={handleAdvisorMoveDown}
                actionLoading={actionLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogCancel onClick={() => setSelectedMemberId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}