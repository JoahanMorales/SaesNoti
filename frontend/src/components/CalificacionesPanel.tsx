import type { CalificacionEntry } from '../types'

interface Props {
  calificaciones: CalificacionEntry[] | null
  loading: boolean
  onRefresh: () => void
}

export default function CalificacionesPanel({ calificaciones, loading, onRefresh }: Props) {
  if (loading) return <div className="loading"><div className="spinner" /> Cargando calificaciones...</div>
  if (!calificaciones || calificaciones.length === 0) return <div className="empty-state">No hay calificaciones registradas</div>

  const gradeClass = (g: string) => {
    if (!g || g === '-') return ''
    const n = parseInt(g)
    if (n >= 90) return 'grade-high'
    if (n >= 70) return 'grade-mid'
    return 'grade-low'
  }

  const calcularPromedio = () => {
    const validas = calificaciones.filter(c => c.calificacion && c.calificacion !== '-')
    if (validas.length === 0) return 'N/A'
    const total = validas.reduce((acc, c) => acc + parseInt(c.calificacion), 0)
    return (total / validas.length).toFixed(1)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>
            {calificaciones.length} materias este semestre
          </span>
          <span style={{ marginLeft: 16 }}>
            Promedio: <span className={`grade-badge ${gradeClass(calcularPromedio())}`}>{calcularPromedio()}</span>
          </span>
        </div>
        <button className="refresh-btn" onClick={onRefresh}>↻ Actualizar</button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Clave</th>
                <th>Asignatura</th>
                <th>Parcial 1</th>
                <th>Parcial 2</th>
                <th>Parcial 3</th>
                <th>Extraordinario</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              {calificaciones.map((c, i) => (
                <tr key={i}>
                  <td>{c.grupo}</td>
                  <td>{c.clave}</td>
                  <td>{c.asignatura}</td>
                  <td>{c.parcial1 || '-'}</td>
                  <td>{c.parcial2 || '-'}</td>
                  <td>{c.parcial3 || '-'}</td>
                  <td>{c.extraordinario || '-'}</td>
                  <td><span className={`grade-badge ${gradeClass(c.calificacion)}`}>{c.calificacion || '-'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
