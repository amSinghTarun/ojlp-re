"use server"

interface EmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

// In a real application, you would use a proper email service like SendGrid, Mailgun, etc.
// This is a mock implementation for demonstration purposes
export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  // In a real app, you would send an actual email here
  console.log(`Sending email to ${to}:`)
  console.log(`Subject: ${subject}`)
  console.log(`Text: ${text}`)
  console.log(`HTML: ${html}`)

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return { success: true }
}

// Generate a random OTP of specified length
export function generateOTP(length = 6): string {
  const digits = "0123456789"
  let otp = ""

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)]
  }

  return otp
}
