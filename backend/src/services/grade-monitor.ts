import axios from 'axios'
import { SaesScraper, CalificacionEntry, Credentials } from '../services/saes-scraper'
import { sessionCache } from '../services/session-cache'
import { telegram } from '../services/telegram'
import { getCampus } from '../campus'

const lastGrades = new Map<string, Map<string, string>>()

async function keepAlive(sessionId: string, credentials: Credentials, campusId: string): Promise<boolean> {
  try {
    const campus = getCampus(campusId)
    const cookie = `ASP.NET_SessionId=${credentials.session}; .ASPXFORMSAUTH=${credentials.login}`

    await axios.get(`${campus.baseUrl}/Alumnos/Informacion_semestral/calificaciones_sem.aspx`, {
      headers: { Cookie: cookie },
      timeout: 10000,
      validateStatus: () => true
    })

    sessionCache.update(sessionId, {
      lastKeepAlive: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
      alive: true
    })

    return true
  } catch {
    return false
  }
}

async function tryRelogin(sessionId: string, username: string, password: string, campusId: string): Promise<boolean> {
  try {
    const scraper = new SaesScraper(getCampus(campusId))
    const sessionData = await scraper.getSession()

    const credentials = await scraper.authenticate(sessionData.credential, {
      username,
      password,
      captcha: { id: sessionData.captcha.id, solution: '' }
    })

    if (!credentials) return false

    sessionCache.update(sessionId, {
      credentials,
      expiresAt: Date.now() + 30 * 60 * 1000,
      lastRefresh: Date.now(),
      lastKeepAlive: Date.now(),
      alive: true
    })

    console.log(`[Relogin] Éxito para ${username} (${campusId})`)
    return true
  } catch (error) {
    console.log(`[Relogin] Falló para ${username} (${campusId}): ${(error as Error).message}`)
    return false
  }
}

export async function checkGradeChanges() {
  console.log(`[Monitor] Revisando ${sessionCache.getActiveCount()} sesiones activas...`)

  for (const [sessionId, cached] of sessionCache.getAll()) {
    try {
      const scraper = new SaesScraper(getCampus(cached.campusId))

      const alive = await keepAlive(sessionId, cached.credentials, cached.campusId)

      if (!alive) {
        console.log(`[Monitor] Sesión muerta para ${cached.username}, intentando relogin...`)

        const reloginOk = await tryRelogin(sessionId, cached.username, cached.password, cached.campusId)

        if (!reloginOk) {
          sessionCache.markDead(sessionId)
          await telegram.send(
            `⚠️ <b>SaesNoti - Sesión Expirada</b>\n\n👤 ${cached.username} (${cached.campusId.toUpperCase()})\n\nNo se pudo renovar la sesión automáticamente. Inicia sesión de nuevo desde la app.`
          )
          continue
        }
      }

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
            console.log(`[Telegram] ${cal.asignatura}: ${prev} → ${grade}`)
          }
        } else if (grade !== '-') {
          await telegram.sendNewSubject(cached.username, cal.asignatura, cached.campusId.toUpperCase())
          console.log(`[Telegram] Nueva materia: ${cal.asignatura}`)
        }
      }

      lastGrades.set(sessionId, newGrades)
    } catch (error) {
      console.error(`[Monitor] Error para ${cached.username}: ${(error as Error).message}`)
    }
  }
}

export async function keepAllAlive() {
  for (const [sessionId, cached] of sessionCache.getAll()) {
    if (!cached.alive) continue
    const ok = await keepAlive(sessionId, cached.credentials, cached.campusId)
    if (!ok) {
      console.log(`[KeepAlive] Sesión muerta para ${cached.username} (${cached.campusId})`)
    }
  }
}

export function getLastGradesForSession(sessionId: string): Map<string, string> {
  return lastGrades.get(sessionId) ?? new Map()
}
