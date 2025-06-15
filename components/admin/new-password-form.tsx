"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { resetPassword } from "@/lib/actions/auth-actions"

const formSchema = z
  .object({
    password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export function NewPasswordForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")

  useEffect(() => {
    // Get email and token from session storage
    const storedEmail = sessionStorage.getItem("resetEmail")
    const storedToken = sessionStorage.getItem("verificationToken")

    if (!storedEmail || !storedToken) {
      toast({
        title: "Error",
        description: "Verification information not found. Please restart the password reset process.",
        variant: "destructive",
      })
      router.push("/admin/reset-password")
      return
    }

    setEmail(storedEmail)
    setToken(storedToken)
  }, [router])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!email || !token) {
      toast({
        title: "Error",
        description: "Verification information not found. Please restart the password reset process.",
        variant: "destructive",
      })
      router.push("/admin/reset-password")
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPassword(email, token, values.password)

      if (result.success) {
        toast({
          title: "Password reset successful",
          description: "Your password has been updated. You can now log in with your new password.",
        })

        // Clear session storage
        sessionStorage.removeItem("resetEmail")
        sessionStorage.removeItem("verificationToken")

        router.push("/admin/login")
      } else {
        toast({
          title: "Password reset failed",
          description: result.message || "Failed to reset password. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating password...
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
        <div className="text-center">
          <Link href="/admin/login" className="text-sm text-primary hover:underline">
            Back to login
          </Link>
        </div>
      </form>
    </Form>
  )
}
