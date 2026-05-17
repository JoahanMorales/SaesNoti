import { useState, useEffect, useCallback } from 'react'
import type { LoginResult, UserInfo, KardexEntry, HorarioEntry, CalificacionEntry } from '../types'
import { getUserInfo, getKardex, getHorario, getCalificaciones } from '../api'
import InfoPanel from './InfoPanel'
import KardexPanel from './KardexPanel'
import HorarioPanel from './HorarioPanel'
import CalificacionesPanel from './CalificacionesPanel'

const TABS = [
  { id: 'info', label: 'Info Personal' },
  { id: 'kardex', label: 'Kárdex' },
  { id: 'horario', label: 'Horario' },
  { id: 'calificaciones', label: 'Calificaciones' }
]

interface Props {
  session: LoginResult
  onLogout: () => void
}

export default function Dashboard({ session, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState('info')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [kardex, setKardex] = useState<KardexEntry[] | null>(null)
  const [horario, setHorario] = useState<HorarioEntry[] | null>(null)
  const [calificaciones, setCalificaciones] = useState<CalificacionEntry[] | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (tab: string) => {
    setLoading(true)
    try {
      switch (tab) {
        case 'info': {
          const info = await getUserInfo(session.sessionId)
          setUserInfo(info)
          break
        }
        case 'kardex': {
          const k = await getKardex(session.sessionId)
          setKardex(k)
          break
        }
        case 'horario': {
          const h = await getHorario(session.sessionId)
          setHorario(h)
          break
        }
        case 'calificaciones': {
          const c = await getCalificaciones(session.sessionId)
          setCalificaciones(c)
          break
        }
      }
    } catch (e) {
      console.error('Error:', e)
    } finally {
      setLoading(false)
    }
  }, [session.sessionId])

  useEffect(() => {
    fetchData(activeTab)
  }, [activeTab, fetchData])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>SaesNoti</h2>
        <div className="header-info">
          <span>{session.username}</span>
          <span className="badge badge-campus">{session.campus.toUpperCase()}</span>
          <button className="btn-logout" onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'info' && (
          <InfoPanel info={userInfo} loading={loading} onRefresh={() => fetchData('info')} />
        )}
        {activeTab === 'kardex' && (
          <KardexPanel kardex={kardex} loading={loading} onRefresh={() => fetchData('kardex')} />
        )}
        {activeTab === 'horario' && (
          <HorarioPanel horario={horario} loading={loading} onRefresh={() => fetchData('horario')} />
        )}
        {activeTab === 'calificaciones' && (
          <CalificacionesPanel calificaciones={calificaciones} loading={loading} onRefresh={() => fetchData('calificaciones')} />
        )}
      </div>
    </div>
  )
}
