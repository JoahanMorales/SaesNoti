import { Request, Response } from 'express'
import { SaesScraper, LoginResponse } from '../services/saes-scraper'
import { sessionCache } from '../services/session-cache'
import { telegram } from '../services/telegram'
import { getCampus } from '../campus'
import { v4 as uuidv4 } from 'uuid'

function getScraper(campusId: string): SaesScraper {
  return new SaesScraper(getCampus(campusId))
}

export async function getSession(req: Request, res: Response) {
  try {
    const campusId = req.query.campus as string || 'upiita'
    const scraper = getScraper(campusId)
    const session = await scraper.getSession()
    res.json({ ...session, campus: campusId })
  } catch (error) {
    res.status(500).json({
      message: 'Error al conectar con el SAES.',
      error: (error as Error).message
    })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const campusId = req.query.campus as string || 'upiita'
    const credential = req.headers['session'] as string
    const loginData = req.body

    if (!credential) {
      return res.status(401).json({ message: 'Se requiere credencial de sesión.' })
    }

    const scraper = getScraper(campusId)
    const credentials = await scraper.authenticate(credential, loginData)

    if (!credentials) {
      return res.status(401).json({ message: 'Datos de inicio de sesión incorrectos.' })
    }

    const sessionId = uuidv4()
    const loginResponse: LoginResponse = {
      username: loginData.username,
      credentials,
      time: Date.now(),
      updateAfter: Date.now() + 15 * 60 * 1000,
      expires: Date.now() + 30 * 60 * 1000
    }

    sessionCache.set(sessionId, {
      credentials,
      username: loginData.username,
      campusId,
      expiresAt: loginResponse.expires,
      lastRefresh: Date.now()
    })

    res.json({ sessionId, ...loginResponse, campus: campusId })
  } catch (error) {
    res.status(400).json({
      message: 'Error al iniciar sesión.',
      error: (error as Error).message
    })
  }
}

function getCredentials(req: Request): { credentials: { login: string; session: string }; campusId: string } | null {
  const sessionKey = req.headers['x-session-id'] as string
  const cached = sessionKey ? sessionCache.get(sessionKey) : null

  if (cached) {
    return { credentials: cached.credentials, campusId: cached.campusId }
  }

  const login = req.headers['login'] as string
  const session = req.headers['session'] as string
  const campusId = (req.headers['x-campus'] as string) || 'upiita'

  if (login && session) {
    return { credentials: { login, session }, campusId }
  }

  return null
}

export async function getUserInfo(req: Request, res: Response) {
  const auth = getCredentials(req)
  if (!auth) return res.status(401).json({ message: 'No cuentas con credenciales.' })

  try {
    const scraper = getScraper(auth.campusId)
    const info = await scraper.getUserInfo(auth.credentials)
    res.json(info)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener información.', error: (error as Error).message })
  }
}

export async function getKardex(req: Request, res: Response) {
  const auth = getCredentials(req)
  if (!auth) return res.status(401).json({ message: 'No cuentas con credenciales.' })

  try {
    const scraper = getScraper(auth.campusId)
    const kardex = await scraper.getUserKardex(auth.credentials)
    res.json(kardex)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener kárdex.', error: (error as Error).message })
  }
}

export async function getHorario(req: Request, res: Response) {
  const auth = getCredentials(req)
  if (!auth) return res.status(401).json({ message: 'No cuentas con credenciales.' })

  try {
    const scraper = getScraper(auth.campusId)
    const horario = await scraper.getUserHorario(auth.credentials)
    res.json(horario)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener horario.', error: (error as Error).message })
  }
}

export async function getCalificaciones(req: Request, res: Response) {
  const auth = getCredentials(req)
  if (!auth) return res.status(401).json({ message: 'No cuentas con credenciales.' })

  try {
    const scraper = getScraper(auth.campusId)
    const calificaciones = await scraper.getUserCalificaciones(auth.credentials)
    res.json(calificaciones)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener calificaciones.', error: (error as Error).message })
  }
}

export async function getHorariosGeneral(req: Request, res: Response) {
  const auth = getCredentials(req)
  if (!auth) return res.status(401).json({ message: 'No cuentas con credenciales.' })

  try {
    const scraper = getScraper(auth.campusId)
    const horarios = await scraper.getGeneralHorarios(auth.credentials, req.query.proximo === 'true')
    res.json(horarios)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener horarios.', error: (error as Error).message })
  }
}

export async function getAsignaturas(req: Request, res: Response) {
  const auth = getCredentials(req)
  if (!auth) return res.status(401).json({ message: 'No cuentas con credenciales.' })

  try {
    const scraper = getScraper(auth.campusId)
    const asignaturas = await scraper.getGeneralAsignaturas(auth.credentials)
    res.json(asignaturas)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener asignaturas.', error: (error as Error).message })
  }
}

export async function getCupos(req: Request, res: Response) {
  const auth = getCredentials(req)
  if (!auth) return res.status(401).json({ message: 'No cuentas con credenciales.' })

  try {
    const scraper = getScraper(auth.campusId)
    const cupos = await scraper.getGeneralCupos(auth.credentials)
    res.json(cupos)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener cupos.', error: (error as Error).message })
  }
}

export function getCampuses(req: Request, res: Response) {
  const { listCampuses } = require('../campus')
  res.json(listCampuses())
}
