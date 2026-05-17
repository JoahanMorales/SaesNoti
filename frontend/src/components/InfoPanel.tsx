import type { UserInfo } from '../types'

interface Props {
  info: UserInfo | null
  loading: boolean
  onRefresh: () => void
}

export default function InfoPanel({ info, loading, onRefresh }: Props) {
  if (loading) return <div className="loading"><div className="spinner" /> Cargando información...</div>
  if (!info) return <div className="empty-state">No hay información disponible</div>

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="refresh-btn" onClick={onRefresh}>↻ Actualizar</button>
      </div>

      <div className="card">
        <div className="photo-wrapper">
          <img className="photo" src={`data:image/jpeg;base64,${info.fotografiaBase64}`} alt="Foto" />
          <div className="info-grid" style={{ flex: 1 }}>
            <div className="info-item">
              <label>Nombre</label>
              <span>{info.nombre}</span>
            </div>
            <div className="info-item">
              <label>Boleta</label>
              <span>{info.boleta}</span>
            </div>
            <div className="info-item">
              <label>Plantel</label>
              <span>{info.plantel}</span>
            </div>
            <div className="info-item">
              <label>RFC</label>
              <span>{info.rfc}</span>
            </div>
            <div className="info-item">
              <label>Sexo</label>
              <span>{info.sexo}</span>
            </div>
            <div className="info-item">
              <label>Cartilla</label>
              <span>{info.cartilla}</span>
            </div>
            <div className="info-item">
              <label>Pasaporte</label>
              <span>{info.pasaporte}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>📅 Nacimiento</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Fecha</label>
            <span>{info.nacimiento.fecha}</span>
          </div>
          <div className="info-item">
            <label>Nacionalidad</label>
            <span>{info.nacimiento.nacionalidad}</span>
          </div>
          <div className="info-item">
            <label>Entidad</label>
            <span>{info.nacimiento.entidad}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>📍 Dirección</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Calle</label>
            <span>{info.direccion.calle}</span>
          </div>
          <div className="info-item">
            <label>No. Ext</label>
            <span>{info.direccion.numeroExt}</span>
          </div>
          <div className="info-item">
            <label>No. Int</label>
            <span>{info.direccion.numeroInt}</span>
          </div>
          <div className="info-item">
            <label>Colonia</label>
            <span>{info.direccion.colonia}</span>
          </div>
          <div className="info-item">
            <label>CP</label>
            <span>{info.direccion.cp}</span>
          </div>
          <div className="info-item">
            <label>Estado</label>
            <span>{info.direccion.estado}</span>
          </div>
          <div className="info-item">
            <label>Municipio</label>
            <span>{info.direccion.municipio}</span>
          </div>
          <div className="info-item">
            <label>Teléfono</label>
            <span>{info.direccion.telefono}</span>
          </div>
          <div className="info-item">
            <label>Móvil</label>
            <span>{info.direccion.movil}</span>
          </div>
          <div className="info-item">
            <label>Email</label>
            <span>{info.direccion.email}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>🎓 Escolaridad</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Procedencia</label>
            <span>{info.escolaridad.procedencia}</span>
          </div>
          <div className="info-item">
            <label>Entidad</label>
            <span>{info.escolaridad.entidad}</span>
          </div>
          <div className="info-item">
            <label>Prom. Secundaria</label>
            <span>{info.escolaridad.promedioSecundaria}</span>
          </div>
          <div className="info-item">
            <label>Prom. Media Superior</label>
            <span>{info.escolaridad.promedioMedioSuperior}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>👨‍👩‍👦 Tutores</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Padre</label>
            <span>{info.tutores.nombrePadre}</span>
          </div>
          <div className="info-item">
            <label>Madre</label>
            <span>{info.tutores.nombreMadre}</span>
          </div>
          <div className="info-item">
            <label>Tutor</label>
            <span>{info.tutores.nombreTutor}</span>
          </div>
          <div className="info-item">
            <label>RFC Tutor</label>
            <span>{info.tutores.rfcTutor}</span>
          </div>
        </div>
      </div>
    </>
  )
}
