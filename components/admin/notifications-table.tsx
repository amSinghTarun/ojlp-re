"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { ArrowUpDown, ChevronDown, MoreHorizontal, Pencil, Trash, Eye, EyeOff, Loader2 } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
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
import {
  getAllNotifications,
  updateExistingNotification,
  deleteExistingNotification,
} from "@/lib/actions/notification-actions"
import { NotificationType, Priority } from "@prisma/client"

export type NotificationItem = {
  id: string
  title: string
  content: string
  date: Date
  type: NotificationType
  priority: Priority
  link?: string | null
  image?: string | null
  read: boolean
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date | null
}

export function NotificationsTable() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAllNotifications()
      if (result.success) {
        setNotifications(result.data)
      } else {
        setError(result.error)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
      setError("Failed to fetch notifications. Please try again.")
      toast({
        title: "Error",
        description: "Failed to fetch notifications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleDeleteNotification = useCallback(async (id: string) => {
    setActionLoading(id)
    try {
      const result = await deleteExistingNotification(id)
      if (result.success) {
        setNotifications(prev => prev.filter((notification) => notification.id !== id))
        toast({
          title: "Notification deleted",
          description: "The notification has been deleted successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed to delete notification:", err)
      toast({
        title: "Error",
        description: "Failed to delete notification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }, [])

  const toggleReadStatus = useCallback(async (notification: NotificationItem) => {
    if (actionLoading) return
    
    setActionLoading(notification.id)
    try {
      const result = await updateExistingNotification(notification.id, {
        read: !notification.read,
      })
      if (result.success) {
        setNotifications(prev => prev.map((n) => 
          n.id === notification.id ? { ...n, read: !n.read } : n
        ))
        toast({
          title: notification.read ? "Marked as unread" : "Marked as read",
          description: `"${notification.title}" has been marked as ${notification.read ? "unread" : "read"}.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Failed to update notification:", err)
      toast({
        title: "Error",
        description: "Failed to update notification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }, [actionLoading])

  const confirmDelete = useCallback((id: string) => {
    setSelectedNotificationId(id)
    setDeleteDialogOpen(true)
  }, [])

  const executeDelete = useCallback(async () => {
    if (selectedNotificationId) {
      await handleDeleteNotification(selectedNotificationId)
      setDeleteDialogOpen(false)
      setSelectedNotificationId(null)
    }
  }, [selectedNotificationId, handleDeleteNotification])

  // Format notification type for display
  const formatNotificationType = (type: NotificationType): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Check if notification is expired
  const isExpired = (expiresAt: Date | null): boolean => {
    if (!expiresAt) return false
    return new Date() > new Date(expiresAt)
  }

  const columns: ColumnDef<NotificationItem>[] = useMemo(() => [
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
      cell: ({ row }) => {
        const notification = row.original
        const expired = isExpired(notification.expiresAt)
        
        return (
          <div className="flex items-center gap-2">
            <span className={`max-w-[300px] truncate font-medium ${expired ? 'text-muted-foreground line-through' : ''}`}>
              {row.getValue("title")}
            </span>
            {!notification.read && <Badge variant="secondary">Unread</Badge>}
            {expired && <Badge variant="destructive">Expired</Badge>}
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{formatNotificationType(row.getValue("type"))}</Badge>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as Priority
        const badgeVariant = priority === Priority.high ? "destructive" : 
                           priority === Priority.medium ? "default" : "outline"

        return <Badge variant={badgeVariant}>{priority}</Badge>
      },
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
      cell: ({ row }) => <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>,
    },
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => {
        const expiresAt = row.original.expiresAt
        if (!expiresAt) return <span className="text-muted-foreground">Never</span>
        
        const expired = isExpired(expiresAt)
        return (
          <span className={expired ? "text-destructive" : "text-muted-foreground"}>
            {new Date(expiresAt).toLocaleDateString()}
          </span>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const notification = row.original
        const isActionLoadingForRow = actionLoading === notification.id

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isActionLoadingForRow}>
                <span className="sr-only">Open menu</span>
                {isActionLoadingForRow ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/admin/notifications/${notification.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleReadStatus(notification)}
                disabled={isActionLoadingForRow}
              >
                {notification.read ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Mark as unread
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Mark as read
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => confirmDelete(notification.id)}
                disabled={isActionLoadingForRow}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [actionLoading, toggleReadStatus, confirmDelete])

  const table = useReactTable({
    data: notifications,
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        {/* <Loader2 className="h-8 w-8 animate-spin text-primary" /> */}
        <span className="ml-2">Notifications</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadNotifications}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter notifications..."
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No notifications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} notification(s).
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the notification "
              {notifications.find((n) => n.id === selectedNotificationId)?.title}" and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedNotificationId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}