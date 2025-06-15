import { ResetPasswordForm } from "@/components/admin/reset-password-form"
import { Scale } from "lucide-react"

export default function ResetPasswordPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-md space-y-6 p-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-primary p-2 text-primary-foreground">
              <Scale className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">LegalInsight</h1>
          </div>
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="text-sm text-muted-foreground">Enter your email to receive a password reset code</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
