import { hash, compare } from "bcrypt"

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}

// Compare a password with a hash
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}
