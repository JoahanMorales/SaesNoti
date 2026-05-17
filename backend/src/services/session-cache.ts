import { Credentials } from './saes-scraper'

interface CachedSession {
  credentials: Credentials
  username: string
  password: string
  campusId: string
  expiresAt: number
  lastRefresh: number
  lastKeepAlive: number
  alive: boolean
}

const SESSION_TTL_MS = 30 * 60 * 1000

export class SessionCache {
  private cache = new Map<string, CachedSession>()
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null

  start(intervalMs = 10 * 60 * 1000): void {
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer)
    this.keepAliveTimer = setInterval(() => this.cleanup(), intervalMs)
  }

  stop(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer)
      this.keepAliveTimer = null
    }
  }

  set(key: string, session: CachedSession): void {
    this.cache.set(key, session)
  }

  get(key: string): CachedSession | undefined {
    return this.cache.get(key)
  }

  update(key: string, updates: Partial<CachedSession>): void {
    const existing = this.cache.get(key)
    if (existing) {
      this.cache.set(key, { ...existing, ...updates })
    }
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  getAll(): Map<string, CachedSession> {
    return new Map(this.cache)
  }

  getActiveSessions(): Map<string, CachedSession> {
    const active = new Map<string, CachedSession>()
    for (const [key, session] of this.cache.entries()) {
      if (session.alive) active.set(key, session)
    }
    return active
  }

  markAlive(key: string): void {
    this.update(key, { alive: true, lastKeepAlive: Date.now() })
  }

  markDead(key: string): void {
    this.update(key, { alive: false })
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, session] of this.cache.entries()) {
      if (!session.alive && now - session.lastKeepAlive > 60 * 60 * 1000) {
        this.cache.delete(key)
      }
    }
  }

  getSessionCount(): number {
    return this.cache.size
  }

  getActiveCount(): number {
    let count = 0
    for (const s of this.cache.values()) {
      if (s.alive) count++
    }
    return count
  }
}

export const sessionCache = new SessionCache()
