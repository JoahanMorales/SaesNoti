import type { HorarioEntry } from '../types'

interface Props {
  horario: HorarioEntry[] | null
  loading: boolean
  onRefresh: () => void
}

const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const
const nombresDia: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes'
}

export default function HorarioPanel({ horario, loading, onRefresh }: Props) {
  if (loading) return <div className="loading"><div className="spinner" /> Cargando horario...</div>
  if (!horario || horario.length === 0) return <div className="empty-state">No hay horario registrado</div>

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          {horario.length} materias este semestre
        </span>
        <button className="refresh-btn" onClick={onRefresh}>↻ Actualizar</button>
      </div>

      <div className="horario-grid">
        {dias.map(dia => (
          <div className="horario-day" key={dia}>
            <h4>{nombresDia[dia]}</h4>
            {horario.map((h, i) => {
              const time = h.horas[dia]
              if (!time) return null
              return (
                <div className="horario-item" key={i}>
                  <div className="time">{time}</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{h.asignatura}</div>
                  <div style={{ color: 'var(--text-dim)', marginTop: 2 }}>{h.profesor}</div>
                  <div style={{ color: 'var(--accent)', fontSize: 11 }}>Grupo {h.grupo}</div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Lista de Materias</h3>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Clave</th>
                <th>Asignatura</th>
                <th>Profesor</th>
                <th>Lunes</th>
                <th>Martes</th>
                <th>Miércoles</th>
                <th>Jueves</th>
                <th>Viernes</th>
              </tr>
            </thead>
            <tbody>
              {horario.map((h, i) => (
                <tr key={i}>
                  <td>{h.grupo}</td>
                  <td>{h.clave}</td>
                  <td>{h.asignatura}</td>
                  <td>{h.profesor}</td>
                  <td>{h.horas.lunes}</td>
                  <td>{h.horas.martes}</td>
                  <td>{h.horas.miercoles}</td>
                  <td>{h.horas.jueves}</td>
                  <td>{h.horas.viernes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
