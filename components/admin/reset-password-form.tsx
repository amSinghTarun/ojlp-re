"use client"

import { useState } from "react"
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
// import { sendResetPasswordEmail } from "@/lib/actions/auth-actions"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

export function ResetPasswordForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    // try {
    //   const result = await sendResetPasswordEmail(values.email)

    //   if (result.success) {
    //     toast({
    //       title: "Reset code sent",
    //       description: "Check your email for the password reset code.",
    //     })
    //     // Store email in session storage for the next step
    //     sessionStorage.setItem("resetEmail", values.email)
    //     router.push("/admin/verify-otp")
    //   } else {
    //     toast({
    //       title: "Error",
    //       description: result.message || "Failed to send reset code. Please try again.",
    //       variant: "destructive",
    //     })
    //   }
    // } catch (error) {
    //   toast({
    //     title: "Error",
    //     description: "An unexpected error occurred. Please try again.",
    //     variant: "destructive",
    //   })
    // } finally {
    //   setIsLoading(false)
    // }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="admin@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Code"
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
