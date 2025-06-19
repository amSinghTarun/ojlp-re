// hooks/use-user.ts
'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import type { User, Role, Permission } from '@prisma/client'

// Extended user type for client-side use
export type ClientUser = User & {
  role: Role & {
    permissions: Array<{
      permission: Permission
    }>
  }
  permissions: Permission[]
}

interface UseUserReturn {
  user: ClientUser | null
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<ClientUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const fetchUser = async () => {
    if (!session?.user?.id) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setIsError(false)

      const response = await fetch('/api/auth/user')
      
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const userData = await response.json()
      setUser(userData)
    } catch (error) {
      console.error('Error fetching user:', error)
      setIsError(true)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true)
      return
    }

    if (status === 'unauthenticated') {
      setUser(null)
      setIsLoading(false)
      return
    }

    if (status === 'authenticated') {
      fetchUser()
    }
  }, [session, status])

  return {
    user,
    isLoading: isLoading || status === 'loading',
    isError,
    refetch: fetchUser
  }
}

// API route to get current user with all relations
// app/api/auth/user/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Return user without sensitive data
    const { password, ...userWithoutPassword } = user
    
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Alternative simpler version using server components (if you prefer)
// hooks/use-user-simple.ts
'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

interface SimpleUser {
  id: string
  name: string
  email: string
  role: {
    name: string
  }
  permissions: string[]
}

interface UseUserSimpleReturn {
  user: SimpleUser | null
  isLoading: boolean
}

export function useUserSimple(): UseUserSimpleReturn {
  const { data: session, status } = useSession()

  const user = useMemo(() => {
    if (!session?.user) return null

    // Extract user data from session (you'll need to include this in your session)
    return {
      id: session.user.id,
      name: session.user.name || '',
      email: session.user.email || '',
      role: session.user.role || { name: 'User' },
      permissions: session.user.permissions || []
    } as SimpleUser
  }, [session])

  return {
    user,
    isLoading: status === 'loading'
  }
}

// Context provider for user data (alternative approach)
// contexts/user-context.tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useUser, ClientUser } from '@/hooks/use-user'

interface UserContextType {
  user: ClientUser | null
  isLoading: boolean
  isError: boolean
  refetch: () => Promise<void>
}

const UserContext = createContext<UserContextType | null>(null)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const userState = useUser()

  return (
    <UserContext.Provider value={userState}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext() {
  const context = useContext(UserContext)
  
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  
  return context
}

// Usage in your app layout
// app/layout.tsx
'use client'

import { SessionProvider } from 'next-auth/react'
import { UserProvider } from '@/contexts/user-context'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </SessionProvider>
      </body>
    </html>
  )
}