// lib/auth-utils.ts
import bcrypt from "bcryptjs"

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  
  // Ensure at least one character from each category
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const symbols = "!@#$%^&*"
  
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 0

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  } else {
    score += 1
  }

  if (password.length >= 12) {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  } else {
    score += 1
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character")
  } else {
    score += 1
  }

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push("Password should not contain repeated characters")
    score -= 1
  }

  if (/123|abc|qwe|password|admin/i.test(password)) {
    errors.push("Password should not contain common patterns")
    score -= 1
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.max(0, score)
  }
}

/**
 * Sanitize user input
 */
export function sanitizeUserInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generate user avatar URL based on name
 */
export function generateAvatarUrl(name: string, size: number = 128): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, '-')
  return `https://avatar.vercel.sh/${cleanName}.png?size=${size}`
}