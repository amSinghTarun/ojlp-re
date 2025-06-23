// components/admin/logout-button.tsx
"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
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
import { LogOut } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      // Use NextAuth's signOut - this works in client components
      await signOut({
        callbackUrl: "/admin/login",
        redirect: true
      })
      
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      })
      setIsLoggingOut(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoggingOut}>
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to log out? You will need to sign in again to access the admin panel.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Quick logout without confirmation
export function QuickLogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut({
        callbackUrl: "/admin/login",
        redirect: true
      })
    } catch (error) {
      console.error("Logout error:", error)
      setIsLoggingOut(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  )
}