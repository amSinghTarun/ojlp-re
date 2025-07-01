import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { comparePassword } from "@/lib/auth-utils"
import { rateLimit } from "@/lib/rate-limit"

const prisma = new PrismaClient()

// Create a limiter for login attempts
// 5 attempts per IP address in a 15-minute window
const loginLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500, // Max 500 users per interval
})

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Apply rate limiting based on email (or IP in a real implementation)
        try {
          await loginLimiter.check(5, credentials.email) // 5 requests per window
        } catch (error) {
          throw new Error("Too many login attempts. Please try again later.")
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            role: true,
          },
        })

        console.log("USER", await comparePassword(credentials.password, user.password))

        // If no user or password doesn't match
        if (!user || !(await comparePassword(credentials.password, user.password))) {
          // We don't want to reveal which part was wrong for security reasons
          return null
        }

        // Only allow users with admin roles to login
        // const adminRoles = ["SUPER_ADMIN", "Admin", "Editor"]
        // if (!adminRoles.includes(user.role.name)) {
        //   return null
        // }
        console.log("USER", user)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          image: user.image,
        }
      },
    }),
  ],
  pages: {
    signIn: "/admin-protected-login",
    error: "/admin-protected-login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add role and id to JWT token when user signs in
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      // Add role and id to session from token
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
