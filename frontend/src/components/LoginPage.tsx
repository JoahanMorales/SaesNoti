import { useState } from 'react'
import type { CaptchaSession, LoginResult } from '../types'
import { getCampuses, getCaptchaSession, login } from '../api'

interface Props {
  onLogin: (result: LoginResult) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [campus, setCampus] = useState('upiita')
  const [captchaSession, setCaptchaSession] = useState<CaptchaSession | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([])
  const [loadedCampuses, setLoadedCampuses] = useState(false)

  const loadCampuses = async () => {
    try {
      const list = await getCampuses()
      setCampuses(list)
      setLoadedCampuses(true)
    } catch {
      setCampuses([{ id: 'upiita', name: 'UPIITA' }, { id: 'upiicsa', name: 'UPIICSA' }])
      setLoadedCampuses(true)
    }
  }

  const fetchCaptcha = async () => {
    try {
      setError('')
      setLoading(true)
      const session = await getCaptchaSession(campus)
      setCaptchaSession(session)
      setCaptcha('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaSession) return

    try {
      setError('')
      setLoading(true)
      const result = await login(campus, captchaSession.credential, {
        username,
        password,
        captcha: { id: captchaSession.captcha.id, solution: captcha }
      })
      onLogin(result)
    } catch (e) {
      setError((e as Error).message)
      fetchCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>SaesNoti</h1>
        <p className="subtitle">Consulta tu SAES y recibe notificaciones</p>

        {!loadedCampuses && (
          <button className="btn btn-primary" onClick={loadCampuses} style={{ marginBottom: 16 }}>
            Cargar campus disponibles
          </button>
        )}

        <div className="campus-select">
          {campuses.map(c => (
            <button
              key={c.id}
              className={`campus-option ${campus === c.id ? 'active' : ''}`}
              onClick={() => { setCampus(c.id); setCaptchaSession(null) }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {!captchaSession && (
          <button
            className="btn btn-primary"
            onClick={fetchCaptcha}
            disabled={loading}
            style={{ marginBottom: 16 }}
          >
            {loading ? 'Cargando...' : 'Obtener Captcha'}
          </button>
        )}

        {captchaSession && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Boleta</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Tu número de boleta"
                maxLength={15}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                maxLength={15}
              />
            </div>

            <div className="form-group">
              <label>Captcha</label>
              <div className="captcha-section">
                <img
                  className="captcha-image"
                  src={`data:image/png;base64,${captchaSession.captcha.imageBase64}`}
                  alt="Captcha"
                />
                <input
                  type="text"
                  value={captcha}
                  onChange={e => setCaptcha(e.target.value)}
                  placeholder="Escribe el captcha"
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: 18, letterSpacing: 4 }}
                />
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
