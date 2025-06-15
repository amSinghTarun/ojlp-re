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
import { verifyOtp, sendResetPasswordEmail } from "@/lib/actions/auth-actions"

const formSchema = z.object({
  otp: z.string().min(6, {
    message: "OTP must be at least 6 characters.",
  }),
})

export function VerifyOtpForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [resendDisabled, setResendDisabled] = useState(false)
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem("resetEmail")
    if (!storedEmail) {
      toast({
        title: "Error",
        description: "Email not found. Please restart the password reset process.",
        variant: "destructive",
      })
      router.push("/admin/reset-password")
      return
    }
    setEmail(storedEmail)
  }, [router])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (resendDisabled && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    } else if (countdown === 0) {
      setResendDisabled(false)
      setCountdown(60)
    }
    return () => clearTimeout(timer)
  }, [resendDisabled, countdown])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!email) {
      toast({
        title: "Error",
        description: "Email not found. Please restart the password reset process.",
        variant: "destructive",
      })
      router.push("/admin/reset-password")
      return
    }

    setIsLoading(true)

    try {
      const result = await verifyOtp(email, values.otp)

      if (result.success) {
        toast({
          title: "OTP verified",
          description: "You can now set a new password.",
        })
        // Store verification token in session storage for the next step
        sessionStorage.setItem("verificationToken", result.token)
        router.push("/admin/new-password")
      } else {
        toast({
          title: "Verification failed",
          description: result.message || "Invalid or expired OTP. Please try again.",
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

  async function handleResendOtp() {
    if (!email) return

    setResendDisabled(true)

    try {
      const result = await sendResetPasswordEmail(email)

      if (result.success) {
        toast({
          title: "OTP resent",
          description: "A new verification code has been sent to your email.",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to resend OTP. Please try again.",
          variant: "destructive",
        })
        setResendDisabled(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setResendDisabled(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <Input placeholder="Enter 6-digit code" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </Button>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendDisabled}
              className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              {resendDisabled ? `Resend in ${countdown}s` : "Resend"}
            </button>
          </p>
          <div>
            <Link href="/admin/login" className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}
