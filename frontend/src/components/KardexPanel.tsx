import type { KardexEntry } from '../types'

interface Props {
  kardex: KardexEntry[] | null
  loading: boolean
  onRefresh: () => void
}

export default function KardexPanel({ kardex, loading, onRefresh }: Props) {
  if (loading) return <div className="loading"><div className="spinner" /> Cargando kárdex...</div>
  if (!kardex || kardex.length === 0) return <div className="empty-state">No hay datos de kárdex</div>

  const gradeClass = (g: string) => {
    const n = parseInt(g)
    if (n >= 90) return 'grade-high'
    if (n >= 70) return 'grade-mid'
    return 'grade-low'
  }

  const periodos = [...new Set(kardex.map(k => k.periodo))].sort()

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          {kardex.length} materias registradas en {periodos.length} periodos
        </span>
        <button className="refresh-btn" onClick={onRefresh}>↻ Actualizar</button>
      </div>

      {periodos.map(periodo => {
        const materias = kardex.filter(k => k.periodo === periodo)
        const total = materias.reduce((acc, m) => acc + (parseInt(m.calificacion) || 0), 0)
        const promedio = (total / materias.length).toFixed(1)

        return (
          <div className="card" key={periodo}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ marginBottom: 0 }}>{periodo}</h3>
              <span className={`grade-badge ${gradeClass(promedio)}`}>Promedio: {promedio}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Clave</th>
                    <th>Asignatura</th>
                    <th>Fecha</th>
                    <th>Evaluación</th>
                    <th>Calificación</th>
                  </tr>
                </thead>
                <tbody>
                  {materias.map((m, i) => (
                    <tr key={i}>
                      <td>{m.clave}</td>
                      <td>{m.asignatura}</td>
                      <td>{m.fecha}</td>
                      <td>{m.formaEvaluacion}</td>
                      <td><span className={`grade-badge ${gradeClass(m.calificacion)}`}>{m.calificacion}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </>
  )
}
