export interface Campus {
  id: string
  name: string
  baseUrl: string
  schoolId: string
}

export interface CaptchaSession {
  credential: string
  captcha: {
    id: string
    imageBase64: string
  }
  campus: string
}

export interface LoginResult {
  sessionId: string
  username: string
  credentials: {
    login: string
    session: string
  }
  time: number
  updateAfter: number
  expires: number
  campus: string
}

export interface UserInfo {
  boleta: string
  nombre: string
  plantel: string
  rfc: string
  cartilla: string
  pasaporte: string
  sexo: string
  nacimiento: { fecha: string; nacionalidad: string; entidad: string }
  direccion: {
    calle: string; numeroExt: string; numeroInt: string; colonia: string
    cp: string; estado: string; municipio: string; telefono: string
    movil: string; email: string; labora: string; oficina: string
  }
  escolaridad: {
    procedencia: string; entidad: string
    promedioSecundaria: string; promedioMedioSuperior: string
  }
  tutores: {
    nombreTutor: string; rfcTutor: string
    nombrePadre: string; nombreMadre: string
  }
  fotografiaBase64: string
}

export interface KardexEntry {
  clave: string
  asignatura: string
  fecha: string
  periodo: string
  formaEvaluacion: string
  calificacion: string
}

export interface HorarioEntry {
  grupo: string
  clave: string
  asignatura: string
  profesor: string
  horas: { lunes: string; martes: string; miercoles: string; jueves: string; viernes: string }
}

export interface CalificacionEntry {
  grupo: string
  clave: string
  asignatura: string
  parcial1: string
  parcial2: string
  parcial3: string
  extraordinario: string
  calificacion: string
}

export interface GeneralHorarioEntry {
  carrera: string
  turno: string
  periodo: string
  grupo: string
  asignatura: string
  profesor: string
  edificio: string
  aula: string
  horas: { lunes: string; martes: string; miercoles: string; jueves: string; viernes: string }
}

export interface AsignaturaEntry {
  carrera: string
  periodo: string
  clave: string
  nombre: string
  tipo: string
  creditos: string
  horasTeoria: string
  horasPractica: string
}

export interface CupoEntry {
  carrera: string
  grupo: string
  clave: string
  asignatura: string
  periodo: string
  cupo: string
  inscritos: string
  disponibles: string
}
