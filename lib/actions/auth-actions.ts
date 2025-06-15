"use server"

import { signIn, signOut } from "next-auth/react"
import { redirect } from "next/navigation"
import { z } from "zod"
import { generateOTP, storeOTP, verifyOTP } from "@/lib/email-utils"
import prisma from "@/lib/prisma"
import { hashPassword } from "@/lib/auth-utils"

// Login schema with validation
const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// Reset password schema with validation
const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

// Verify OTP schema with validation
const VerifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
})

// New password schema with validation
const NewPasswordSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export async function login(formData: FormData) {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      return {
        success: false,
        errors: {
          _form: ["Invalid email or password"],
        },
      }
    }

    redirect("/admin")
  } catch (error) {
    return {
      success: false,
      errors: {
        _form: ["An error occurred during login. Please try again."],
      },
    }
  }
}

export async function logout() {
  await signOut({ redirect: false })
  redirect("/admin/login")
}

export async function resetPassword(formData: FormData) {
  const validatedFields = ResetPasswordSchema.safeParse({
    email: formData.get("email"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email } = validatedFields.data

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    // Don't reveal that the user doesn't exist for security reasons
    return {
      success: true,
      message: "If your email is registered, you will receive a reset link shortly.",
    }
  }

  try {
    // Generate OTP
    const otp = generateOTP()

    // Store OTP (in a real app, this would be in a database with expiration)
    await storeOTP(email, otp)

    // In a real app, you would send an email with the OTP
    console.log(`OTP for ${email}: ${otp}`)

    return {
      success: true,
      message: "If your email is registered, you will receive a reset link shortly.",
    }
  } catch (error) {
    return {
      success: false,
      errors: {
        _form: ["An error occurred. Please try again."],
      },
    }
  }
}

export async function verifyOTPAction(formData: FormData) {
  const validatedFields = VerifyOTPSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, otp } = validatedFields.data

  try {
    // Verify OTP
    const isValid = await verifyOTP(email, otp)

    if (!isValid) {
      return {
        success: false,
        errors: {
          otp: ["Invalid or expired OTP"],
        },
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      errors: {
        _form: ["An error occurred. Please try again."],
      },
    }
  }
}

export async function setNewPassword(formData: FormData) {
  const validatedFields = NewPasswordSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, otp, password } = validatedFields.data

  try {
    // Verify OTP one more time
    const isValid = await verifyOTP(email, otp)

    if (!isValid) {
      return {
        success: false,
        errors: {
          _form: ["Invalid or expired OTP"],
        },
      }
    }

    // Update user password
    const hashedPassword = await hashPassword(password)

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    return {
      success: true,
      message: "Password updated successfully. You can now log in with your new password.",
    }
  } catch (error) {
    return {
      success: false,
      errors: {
        _form: ["An error occurred. Please try again."],
      },
    }
  }
}
