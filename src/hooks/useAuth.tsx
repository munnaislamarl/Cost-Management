import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { authService } from '@/services/authService'
import type { SessionUser } from '@/types'
import type { Permission } from '@/utils/permissions'
import { hasPermission } from '@/utils/permissions'

interface AuthContextValue {
  user: SessionUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (identifier: string, password: string) => Promise<SessionUser>
  logout: () => void
  can: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(
    () => authService.getSession()?.user ?? null,
  )
  const isBootstrapping = false

  const login = useCallback(async (identifier: string, password: string) => {
    const session = await authService.login(identifier, password)
    setUser(session.user)
    return session.user
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const can = useCallback(
    (permission: Permission) => hasPermission(user?.role, permission),
    [user?.role],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user != null,
      isBootstrapping,
      login,
      logout,
      can,
    }),
    [user, isBootstrapping, login, logout, can],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
