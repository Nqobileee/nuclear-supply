'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, AuthResult } from '@/models'
import { sanitizeErrorMessage, isNetworkError, EmailConfirmationRequiredError, AccountExistsError } from '@/lib/utils/errors'

// Demo credentials
const DEMO_EMAIL = 'demo@nuclear.app'
const DEMO_PASSWORD = 'demo123456'
const AUTH_STORAGE_KEY = 'nuclear_auth_user'

interface AuthContextValue {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function generateInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

function createDemoUser(): User {
  const name = 'Demo User'
  return {
    id: 'demo-user-id',
    name,
    role: 'Hospital Administrator',
    initials: generateInitials(name)
  }
}

function createUserFromEmail(email: string, id: string): User {
  const name = email.split('@')[0].split('.').map(part =>
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ')

  return {
    id,
    name: name || 'User',
    role: 'Hospital Administrator',
    initials: generateInitials(name || 'User')
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First check localStorage for demo user
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser)
            // Check if it's a demo user
            if (parsed.id === 'demo-user-id') {
              setUser(parsed)
              // Set cookie for middleware
              document.cookie = `nuclear_demo_user=true; path=/; max-age=86400` // 24 hours
              setIsLoading(false)
              return
            }
          } catch (error) {
            console.error('Failed to parse stored user:', error)
            localStorage.removeItem(AUTH_STORAGE_KEY)
          }
        }

        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const appUser = createUserFromEmail(session.user.email || '', session.user.id)
          setUser(appUser)
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser))
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const appUser = createUserFromEmail(session.user.email || '', session.user.id)
        setUser(appUser)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser))
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    // Check for demo credentials first
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const demoUser = createDemoUser()
      setUser(demoUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser))
      // Set a cookie to indicate demo user for middleware
      document.cookie = `nuclear_demo_user=true; path=/; max-age=86400` // 24 hours
      return { success: true, user: demoUser }
    }

    // Try Supabase authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Provide more specific error messages
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' }
        }

        if (error.message.toLowerCase().includes('email not confirmed')) {
          return { success: false, error: 'Please confirm your email address before logging in. Check your inbox for the confirmation link.' }
        }

        return { success: false, error: sanitizeErrorMessage(error) }
      }

      if (data.user) {
        const appUser = createUserFromEmail(data.user.email || '', data.user.id)
        setUser(appUser)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser))
        return { success: true, user: appUser }
      }

      return { success: false, error: 'Login failed. Please try again.' }
    } catch (error) {
      console.error('Login error:', error)

      // Check if it's a network error
      if (isNetworkError(error)) {
        return { success: false, error: 'Network error. Please check your internet connection and try again.' }
      }

      return { success: false, error: sanitizeErrorMessage(error) }
    }
  }, [supabase.auth])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        // Handle specific Supabase error cases
        if (error.message.toLowerCase().includes('user already registered')) {
          throw new AccountExistsError()
        }

        if (error.message.toLowerCase().includes('password')) {
          return { success: false, error: 'Password must be at least 6 characters long.' }
        }

        if (error.message.toLowerCase().includes('email')) {
          return { success: false, error: 'Invalid email format. Please enter a valid email address.' }
        }

        if (error.message.toLowerCase().includes('rate limit')) {
          return { success: false, error: 'Too many signup attempts. Please try again in a few minutes.' }
        }

        return { success: false, error: sanitizeErrorMessage(error) }
      }

      if (data.user) {
        // Check if email confirmation is required
        // If identities array is empty, the user already exists
        if (data.user.identities && data.user.identities.length === 0) {
          throw new AccountExistsError()
        }

        // If email confirmation is required (no session returned)
        if (!data.session) {
          const appUser = createUserFromEmail(email, data.user.id)
          throw new EmailConfirmationRequiredError(
            'Account created successfully! Please check your email to confirm your account before logging in.'
          )
        }

        // Email confirmation is disabled - user is logged in immediately
        const appUser = createUserFromEmail(data.user.email || '', data.user.id)
        setUser(appUser)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(appUser))

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Signup successful for user:', data.user.email)
        }

        return {
          success: true,
          user: appUser,
          message: 'Account created successfully! You are now logged in.'
        }
      }

      return { success: false, error: 'Sign up failed. Please try again.' }
    } catch (error) {
      console.error('Sign up error:', error)

      // Handle custom errors
      if (error instanceof EmailConfirmationRequiredError) {
        // Generate a temporary ID for the user pending confirmation
        // This user object is informational only and won't be stored
        const tempId = `pending-${Date.now()}`
        return {
          success: true,
          user: createUserFromEmail(email, tempId),
          message: error.message
        }
      }

      if (error instanceof AccountExistsError) {
        return { success: false, error: error.message }
      }

      // Check if it's a network error
      if (isNetworkError(error)) {
        return { success: false, error: 'Network error. Please check your internet connection and try again.' }
      }

      return { success: false, error: sanitizeErrorMessage(error) }
    }
  }, [supabase.auth])

  const logout = useCallback(async () => {
    // Check if it's a demo user
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        if (parsed.id === 'demo-user-id') {
          setUser(null)
          localStorage.removeItem(AUTH_STORAGE_KEY)
          // Remove demo cookie
          document.cookie = `nuclear_demo_user=; path=/; max-age=0`
          return
        }
      } catch (error) {
        // Continue with Supabase logout
      }
    }

    // Sign out from Supabase
    await supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    // Remove demo cookie
    document.cookie = `nuclear_demo_user=; path=/; max-age=0`
  }, [supabase.auth])

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error(`${provider} OAuth error:`, error)
        throw error
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      throw error
    }
  }, [supabase.auth])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      })

      if (error) {
        if (error.message.toLowerCase().includes('rate limit')) {
          return { success: false, error: 'Too many password reset attempts. Please try again in a few minutes.' }
        }

        return { success: false, error: sanitizeErrorMessage(error) }
      }

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)

      if (isNetworkError(error)) {
        return { success: false, error: 'Network error. Please check your internet connection and try again.' }
      }

      return { success: false, error: sanitizeErrorMessage(error) }
    }
  }, [supabase.auth])

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,
      user,
      isLoading,
      login,
      signUp,
      signInWithOAuth,
      logout,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export { AuthContext }
