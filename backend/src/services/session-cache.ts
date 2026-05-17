import { Credentials } from './saes-scraper'

interface CachedSession {
  credentials: Credentials
  username: string
  campusId: string
  expiresAt: number
  lastRefresh: number
}

const SESSION_TTL_MS = 30 * 60 * 1000
const REFRESH_BEFORE_EXPIRE_MS = 5 * 60 * 1000

export class SessionCache {
  private cache = new Map<string, CachedSession>()
  private refreshTimer: ReturnType<typeof setInterval> | null = null

  start(refreshIntervalMs = 5 * 60 * 1000): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer)
    this.refreshTimer = setInterval(() => this.refreshExpired(), refreshIntervalMs)
  }

  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  set(key: string, session: CachedSession): void {
    this.cache.set(key, session)
  }

  get(key: string): CachedSession | undefined {
    return this.cache.get(key)
  }

  has(key: string): boolean {
    const session = this.cache.get(key)
    if (!session) return false
    if (Date.now() > session.expiresAt) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  getAll(): Map<string, CachedSession> {
    return new Map(this.cache)
  }

  needsRefresh(key: string): boolean {
    const session = this.cache.get(key)
    if (!session) return false
    return Date.now() > session.expiresAt - REFRESH_BEFORE_EXPIRE_MS
  }

  private refreshExpired(): void {
    const now = Date.now()
    for (const [key, session] of this.cache.entries()) {
      if (now > session.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  getSessionCount(): number {
    return this.cache.size
  }
}

export const sessionCache = new SessionCache()
