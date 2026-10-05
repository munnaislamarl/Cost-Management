import { STORAGE_KEYS } from '@/utils/constants'
import type { SessionUser } from '@/types'
import { dataSource } from '@/services/datasource'

export interface StoredSession {
  user: SessionUser
  token: string
  issuedAt: string
  expiresAt: string
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 8

function createToken(): string {
  const bytes = new Uint8Array(24)
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (!parsed?.expiresAt || new Date(parsed.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(STORAGE_KEYS.session)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export const authService = {
  getSession(): StoredSession | null {
    return readSession()
  },

  async login(identifier: string, password: string): Promise<StoredSession> {
    const user = await dataSource.authenticate(identifier.trim(), password)
    const now = new Date()
    const session: StoredSession = {
      user,
      token: createToken(),
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session))
    return session
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.session)
  },

  isAuthenticated(): boolean {
    return readSession() != null
  },
}
