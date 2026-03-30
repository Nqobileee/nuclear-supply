'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User, AuthResult } from '@/models'
import { defaultProfile } from '@/lib/hardcoded-data'

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

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
        if (storedUser) {
          const parsed = JSON.parse(storedUser)
          setUser(parsed)
          document.cookie = `nuclear_demo_user=true; path=/; max-age=86400`
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem(AUTH_STORAGE_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    await new Promise(resolve => setTimeout(resolve, 500))

    // Always succeed
    const demoUser = defaultProfile as User
    setUser(demoUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser))
    document.cookie = `nuclear_demo_user=true; path=/; max-age=86400`
    return { success: true, user: demoUser }
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    const demoUser = defaultProfile as User
    setUser(demoUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(demoUser))
    document.cookie = `nuclear_demo_user=true; path=/; max-age=86400`
    return {
      success: true,
      user: demoUser,
      message: 'Account created successfully!'
    }
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    document.cookie = `nuclear_demo_user=; path=/; max-age=0`
  }, [])

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    await login('demo@nuclear.app', 'demo123456')
  }, [login])

  const resetPassword = useCallback(async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true }
  }, [])

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
