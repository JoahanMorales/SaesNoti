import type { Campus, CaptchaSession, LoginResult, UserInfo, KardexEntry, HorarioEntry, CalificacionEntry, GeneralHorarioEntry, AsignaturaEntry, CupoEntry } from './types'

const API = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || `Error ${res.status}`)
  }
  return res.json()
}

export async function getCampuses(): Promise<Campus[]> {
  return request('/campuses')
}

export async function getCaptchaSession(campus: string): Promise<CaptchaSession> {
  return request(`/session?campus=${campus}`)
}

export async function login(campus: string, sessionHeader: string, body: { username: string; password: string; captcha: { id: string; solution: string } }): Promise<LoginResult> {
  return request(`/login?campus=${campus}`, {
    method: 'POST',
    headers: { session: sessionHeader },
    body: JSON.stringify(body)
  })
}

export async function getUserInfo(sessionId: string): Promise<UserInfo> {
  return request('/user/info', { headers: { 'X-Session-Id': sessionId } })
}

export async function getKardex(sessionId: string): Promise<KardexEntry[]> {
  return request('/user/kardex', { headers: { 'X-Session-Id': sessionId } })
}

export async function getHorario(sessionId: string): Promise<HorarioEntry[]> {
  return request('/user/horario', { headers: { 'X-Session-Id': sessionId } })
}

export async function getCalificaciones(sessionId: string): Promise<CalificacionEntry[]> {
  return request('/user/calificaciones', { headers: { 'X-Session-Id': sessionId } })
}

export async function getGeneralHorarios(sessionId: string, proximo = false): Promise<GeneralHorarioEntry[]> {
  return request(`/general/horarios${proximo ? '-proximo' : ''}`, { headers: { 'X-Session-Id': sessionId } })
}

export async function getAsignaturas(sessionId: string): Promise<AsignaturaEntry[]> {
  return request('/general/asignaturas', { headers: { 'X-Session-Id': sessionId } })
}

export async function getCupos(sessionId: string): Promise<CupoEntry[]> {
  return request('/general/cupos', { headers: { 'X-Session-Id': sessionId } })
}
