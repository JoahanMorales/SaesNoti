import { Request, Response } from 'express'
import { SaesScraper, CalificacionEntry } from '../services/saes-scraper'
import { sessionCache } from '../services/session-cache'
import { telegram } from '../services/telegram'
import { getCampus } from '../campus'

const lastGrades = new Map<string, Map<string, string>>()

export async function checkGradeChanges() {
  for (const [sessionId, cached] of sessionCache.getAll()) {
    try {
      const scraper = new SaesScraper(getCampus(cached.campusId))
      const calificaciones = await scraper.getUserCalificaciones(cached.credentials)

      const prevGrades = lastGrades.get(sessionId) ?? new Map()
      const newGrades = new Map<string, string>()

      for (const cal of calificaciones) {
        const key = `${cal.clave}-${cal.grupo}`
        const grade = cal.calificacion || '-'
        newGrades.set(key, grade)

        if (prevGrades.has(key)) {
          const prev = prevGrades.get(key)!
          if (prev !== grade && grade !== '-') {
            await telegram.sendGradeUpdate(
              cached.username,
              cal.asignatura,
              prev,
              grade,
              cached.campusId.toUpperCase()
            )
            console.log(`[Telegram] Calificación actualizada: ${cal.asignatura} ${prev} -> ${grade}`)
          }
        } else if (grade !== '-') {
          await telegram.sendNewSubject(cached.username, cal.asignatura, cached.campusId.toUpperCase())
          console.log(`[Telegram] Nueva materia: ${cal.asignatura}`)
        }
      }

      lastGrades.set(sessionId, newGrades)

      sessionCache.set(sessionId, {
        ...cached,
        expiresAt: Date.now() + 30 * 60 * 1000,
        lastRefresh: Date.now()
      })
    } catch (error) {
      console.error(`[Check] Error para sesión ${sessionId}:`, (error as Error).message)
    }
  }
}

export function getLastGradesForSession(sessionId: string): Map<string, string> {
  return lastGrades.get(sessionId) ?? new Map()
}
