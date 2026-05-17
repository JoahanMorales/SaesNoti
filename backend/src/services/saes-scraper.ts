import axios from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'
import { JSDOM } from 'jsdom'
import { CampusConfig } from '../campus'

export interface CaptchaData {
  id: string
  imageBase64: string
}

export interface SessionData {
  credential: string
  captcha: CaptchaData
}

export interface Credentials {
  login: string
  session: string
}

export interface LoginResponse {
  username: string
  credentials: Credentials
  time: number
  updateAfter: number
  expires: number
}

export interface UserInfo {
  boleta: string
  nombre: string
  plantel: string
  rfc: string
  cartilla: string
  pasaporte: string
  sexo: string
  nacimiento: {
    fecha: string
    nacionalidad: string
    entidad: string
  }
  direccion: {
    calle: string
    numeroExt: string
    numeroInt: string
    colonia: string
    cp: string
    estado: string
    municipio: string
    telefono: string
    movil: string
    email: string
    labora: string
    oficina: string
  }
  escolaridad: {
    procedencia: string
    entidad: string
    promedioSecundaria: string
    promedioMedioSuperior: string
  }
  tutores: {
    nombreTutor: string
    rfcTutor: string
    nombrePadre: string
    nombreMadre: string
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
  horas: {
    lunes: string
    martes: string
    miercoles: string
    jueves: string
    viernes: string
  }
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
  horas: {
    lunes: string
    martes: string
    miercoles: string
    jueves: string
    viernes: string
  }
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

function getPage(url: string, cookie: string): Promise<Document> {
  return axios.get(url, {
    headers: { Cookie: cookie }
  }).then(res => new JSDOM(res.data).window.document)
}

function postPage(url: string, cookie: string, data: Record<string, string>): Promise<Document> {
  return axios.post(url, data, {
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(res => new JSDOM(res.data).window.document)
}

function safeText(el: Element | null): string {
  return el?.textContent?.trim() ?? ''
}

function elValue(el: Element | null): string {
  return (el as HTMLInputElement)?.value ?? ''
}

export class SaesScraper {
  constructor(private campus: CampusConfig) {}

  private url(path: string): string {
    return `${this.campus.baseUrl}${path}`
  }

  async getSession(): Promise<SessionData> {
    const res = await axios.get(this.campus.baseUrl, {
      headers: { Cookie: 'AspxAutoDetectCookieSupport=1' }
    })

    const page = new JSDOM(res.data).window.document
    const credential = res.headers['set-cookie']![0].split('; ')[0].split('=')[1]
    const captchaId = elValue(page.getElementById('LBD_VCID_c_default_ctl00_leftcolumn_loginuser_logincaptcha'))
    const captchaImg = page.getElementById('c_default_ctl00_leftcolumn_loginuser_logincaptcha_CaptchaImage')! as HTMLImageElement
    const captchaImgUrl = `${this.campus.baseUrl}/${captchaImg.src.split('/').pop()}`

    const captchaRes = await axios.get(captchaImgUrl, {
      headers: { Cookie: `ASP.NET_SessionId=${credential}` },
      responseType: 'arraybuffer'
    })

    return {
      credential,
      captcha: {
        id: captchaId,
        imageBase64: Buffer.from(captchaRes.data, 'binary').toString('base64')
      }
    }
  }

  async authenticate(credential: string, loginData: { username: string; password: string; captcha: { id: string; solution: string } }): Promise<Credentials | null> {
    const page = await getPage(this.campus.baseUrl, `ASP.NET_SessionId=${credential}`)

    const data: Record<string, string> = {
      '__VIEWSTATE': elValue(page.getElementById('__VIEWSTATE')),
      '__VIEWSTATEGENERATOR': elValue(page.getElementById('__VIEWSTATEGENERATOR')),
      '__EVENTVALIDATION': elValue(page.getElementById('__EVENTVALIDATION')),
      'ctl00$leftColumn$LoginUser$UserName': loginData.username,
      'ctl00$leftColumn$LoginUser$Password': loginData.password,
      'ctl00$leftColumn$LoginUser$CaptchaCodeTextBox': loginData.captcha.solution,
      'LBD_VCID_c_default_ctl00_leftcolumn_loginuser_logincaptcha': loginData.captcha.id,
      'ctl00$leftColumn$LoginUser$LoginButton': ''
    }

    const jar = new CookieJar()
    const client = wrapper(axios.create({ jar }))

    await client.post(this.campus.baseUrl, data, {
      headers: {
        Cookie: `ASP.NET_SessionId=${credential}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const cookies = jar.toJSON().cookies
    return cookies.length > 0
      ? { login: cookies[0].value, session: credential }
      : null
  }

  private cookie(credentials: Credentials): string {
    return `ASP.NET_SessionId=${credentials.session}; .ASPXFORMSAUTH=${credentials.login}`
  }

  async getUserInfo(credentials: Credentials): Promise<UserInfo> {
    const page = await getPage(this.url('/Alumnos/info_alumnos/Datos_Alumno.aspx'), this.cookie(credentials))

    const fotoRes = await axios.get(this.url('/Alumnos/info_alumnos/Fotografia.aspx'), {
      headers: { Cookie: this.cookie(credentials) },
      validateStatus: s => s === 200,
      responseType: 'arraybuffer'
    })

    return {
      boleta: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Generales_Lbl_Boleta')),
      nombre: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Generales_Lbl_Nombre')),
      plantel: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Generales_Lbl_Plantel')),
      rfc: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Generales_Lbl_RFC')),
      cartilla: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Generales_Lbl_Cartilla')),
      pasaporte: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Generales_Lbl_Pasaporte')),
      sexo: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Generales_Lbl_Sexo')),
      nacimiento: {
        fecha: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_TabPanel1_Lbl_FecNac')),
        nacionalidad: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_TabPanel1_Lbl_Nacionalidad')),
        entidad: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_TabPanel1_Lbl_EntNac'))
      },
      direccion: {
        calle: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_Calle')),
        numeroExt: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_NumExt')),
        numeroInt: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_NumInt')),
        colonia: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_Colonia')),
        cp: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_CP')),
        estado: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_Estado')),
        municipio: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_DelMpo')),
        telefono: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_Tel')),
        movil: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_Movil')),
        email: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_eMail')),
        labora: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_Labora')),
        oficina: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Direccion_Lbl_TelOficina'))
      },
      escolaridad: {
        procedencia: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Escolaridad_Lbl_EscProc')),
        entidad: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Escolaridad_Lbl_EdoEscProc')),
        promedioSecundaria: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Escolaridad_Lbl_PromSec')),
        promedioMedioSuperior: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Escolaridad_Lbl_PromNMS'))
      },
      tutores: {
        nombreTutor: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Tutor_Lbl_NomTut')),
        rfcTutor: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Tutor_Lbl_RFCTut')),
        nombrePadre: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Tutor_Lbl_Padre')),
        nombreMadre: safeText(page.getElementById('ctl00_mainCopy_TabContainer1_Tab_Tutor_Lbl_Madre'))
      },
      fotografiaBase64: Buffer.from(fotoRes.data, 'binary').toString('base64')
    }
  }

  async getUserKardex(credentials: Credentials): Promise<KardexEntry[]> {
    const page = await getPage(this.url('/Alumnos/boleta/kardex.aspx'), this.cookie(credentials))
    const kardex: KardexEntry[] = []

    const table = page.getElementById('ctl00_mainCopy_Lbl_Kardex')
    if (!table) return kardex

    const tables = table.getElementsByTagName('table')
    for (let i = 0; i < tables.length; i++) {
      const tbody = tables[i].getElementsByTagName('tbody')[0]
      if (!tbody) continue
      const rows = tbody.getElementsByTagName('tr')
      for (let j = 2; j < rows.length; j++) {
        const cols = rows[j].getElementsByTagName('td')
        if (cols.length < 6) continue
        kardex.push({
          clave: safeText(cols[0]),
          asignatura: safeText(cols[1]),
          fecha: safeText(cols[2]),
          periodo: safeText(cols[3]),
          formaEvaluacion: safeText(cols[4]),
          calificacion: safeText(cols[5])
        })
      }
    }

    return kardex
  }

  async getUserHorario(credentials: Credentials): Promise<HorarioEntry[]> {
    const page = await getPage(this.url('/Alumnos/Informacion_semestral/Horario_Alumno.aspx'), this.cookie(credentials))
    const horario: HorarioEntry[] = []

    const table = page.getElementById('ctl00_mainCopy_GV_Horario')
    if (!table) return horario

    const tbody = table.getElementsByTagName('tbody')[0]
    if (!tbody) return horario
    const rows = tbody.getElementsByTagName('tr')

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].getElementsByTagName('td')
      if (cols.length < 8) continue
      const fullSubject = safeText(cols[1])
      const [clave, ...rest] = fullSubject.split('-')
      horario.push({
        grupo: safeText(cols[0]),
        clave: clave.trim(),
        asignatura: rest.join('-').trim(),
        profesor: safeText(cols[2]),
        horas: {
          lunes: safeText(cols[3]),
          martes: safeText(cols[4]),
          miercoles: safeText(cols[5]),
          jueves: safeText(cols[6]),
          viernes: safeText(cols[7])
        }
      })
    }

    return horario
  }

  async getUserCalificaciones(credentials: Credentials): Promise<CalificacionEntry[]> {
    const page = await getPage(this.url('/Alumnos/Informacion_semestral/calificaciones_sem.aspx'), this.cookie(credentials))
    const calificaciones: CalificacionEntry[] = []

    const table = page.getElementById('ctl00_mainCopy_GV_Calif')
    if (!table) return calificaciones

    const tbody = table.getElementsByTagName('tbody')[0]
    if (!tbody) return calificaciones
    const rows = tbody.getElementsByTagName('tr')

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].getElementsByTagName('td')
      if (cols.length < 7) continue
      const fullSubject = safeText(cols[1])
      const [clave, ...rest] = fullSubject.split('-')
      calificaciones.push({
        grupo: safeText(cols[0]),
        clave: clave.trim(),
        asignatura: rest.join('-').trim(),
        parcial1: safeText(cols[2]),
        parcial2: safeText(cols[3]),
        parcial3: safeText(cols[4]),
        extraordinario: safeText(cols[5]),
        calificacion: safeText(cols[6]).split(' ')[0]
      })
    }

    return calificaciones
  }

  async getGeneralHorarios(credentials: Credentials, upcoming = false): Promise<GeneralHorarioEntry[]> {
    const cookie = this.cookie(credentials)
    let page = await getPage(this.url('/Academica/horarios.aspx'), cookie)

    let data: Record<string, string> = {
      '__VIEWSTATE': elValue(page.getElementById('__VIEWSTATE')),
      '__VIEWSTATEGENERATOR': elValue(page.getElementById('__VIEWSTATEGENERATOR')),
      '__EVENTVALIDATION': elValue(page.getElementById('__EVENTVALIDATION')),
      'ctl00$mainCopy$GroupPeriodoEscolar': upcoming ? 'optProximo' : 'optActual'
    }

    const horarios: GeneralHorarioEntry[] = []
    const carreras = page.getElementById('ctl00_mainCopy_Filtro_cboCarrera')!.getElementsByTagName('option')

    for (let i = 0; i < carreras.length; i++) {
      const carreraId = carreras[i].value
      data['ctl00$mainCopy$Filtro$cboCarrera'] = carreraId

      page = await postPage(this.url('/Academica/horarios.aspx'), cookie, data)
      data['__VIEWSTATE'] = elValue(page.getElementById('__VIEWSTATE'))
      data['__EVENTVALIDATION'] = elValue(page.getElementById('__EVENTVALIDATION'))

      const periodos = page.getElementById('ctl00_mainCopy_Filtro_lsNoPeriodos')!.getElementsByTagName('option')
      const turnos = page.getElementById('ctl00_mainCopy_Filtro_cboTurno')!.getElementsByTagName('option')
      const plan = page.getElementById('ctl00_mainCopy_Filtro_cboPlanEstud')!.getElementsByTagName('option')

      data['ctl00$mainCopy$Filtro$cboPlanEstud'] = plan[0].value

      for (let j = 0; j < periodos.length; j++) {
        data['ctl00$mainCopy$Filtro$lsNoPeriodos'] = periodos[j].value

        for (let k = 0; k < turnos.length; k++) {
          data['ctl00$mainCopy$Filtro$cboTurno'] = turnos[k].value

          page = await postPage(this.url('/Academica/horarios.aspx'), cookie, data)
          data['__VIEWSTATE'] = elValue(page.getElementById('__VIEWSTATE'))
          data['__EVENTVALIDATION'] = elValue(page.getElementById('__EVENTVALIDATION'))

          const table = page.getElementById('ctl00_mainCopy_dbgHorarios')
          if (!table) continue

          const tbody = table.getElementsByTagName('tbody')[0]
          if (!tbody) continue
          const rows = tbody.getElementsByTagName('tr')

          for (let l = 1; l < rows.length; l++) {
            const cols = rows[l].getElementsByTagName('td')
            if (cols.length < 10) continue
            horarios.push({
              carrera: carreraId,
              turno: turnos[k].value,
              periodo: periodos[j].value,
              grupo: safeText(cols[0]),
              asignatura: safeText(cols[1]),
              profesor: safeText(cols[2]),
              edificio: safeText(cols[3]),
              aula: safeText(cols[4]),
              horas: {
                lunes: safeText(cols[5]),
                martes: safeText(cols[6]),
                miercoles: safeText(cols[7]),
                jueves: safeText(cols[8]),
                viernes: safeText(cols[9])
              }
            })
          }
        }
      }
    }

    return horarios
  }

  async getGeneralAsignaturas(credentials: Credentials): Promise<AsignaturaEntry[]> {
    const cookie = this.cookie(credentials)
    let page = await getPage(this.url('/Academica/mapa_curricular.aspx'), cookie)

    let data: Record<string, string> = {
      '__VIEWSTATE': elValue(page.getElementById('__VIEWSTATE')),
      '__VIEWSTATEGENERATOR': elValue(page.getElementById('__VIEWSTATEGENERATOR')),
      '__EVENTVALIDATION': elValue(page.getElementById('__EVENTVALIDATION'))
    }

    const asignaturas: AsignaturaEntry[] = []
    const carreras = page.getElementById('ctl00_mainCopy_Filtro_cboCarrera')!.getElementsByTagName('option')

    for (let i = 0; i < carreras.length; i++) {
      const carreraId = carreras[i].value
      data['ctl00$mainCopy$Filtro$cboCarrera'] = carreraId

      page = await postPage(this.url('/Academica/mapa_curricular.aspx'), cookie, data)
      data['__VIEWSTATE'] = elValue(page.getElementById('__VIEWSTATE'))
      data['__EVENTVALIDATION'] = elValue(page.getElementById('__EVENTVALIDATION'))

      const periodos = page.getElementById('ctl00_mainCopy_Filtro_lsNoPeriodos')!.getElementsByTagName('option')
      const plan = page.getElementById('ctl00_mainCopy_Filtro_cboPlanEstud')!.getElementsByTagName('option')

      data['ctl00$mainCopy$Filtro$cboPlanEstud'] = plan[0].value

      for (let j = 0; j < periodos.length; j++) {
        data['ctl00$mainCopy$Filtro$lsNoPeriodos'] = periodos[j].value

        page = await postPage(this.url('/Academica/mapa_curricular.aspx'), cookie, data)
        data['__VIEWSTATE'] = elValue(page.getElementById('__VIEWSTATE'))
        data['__EVENTVALIDATION'] = elValue(page.getElementById('__EVENTVALIDATION'))

        const table = page.getElementById('ctl00_mainCopy_GridView1')
        if (!table) continue

        const tbody = table.getElementsByTagName('tbody')[0]
        if (!tbody) continue
        const rows = tbody.getElementsByTagName('tr')

        for (let k = 1; k < rows.length; k++) {
          const cols = rows[k].getElementsByTagName('td')
          if (cols.length < 7) continue
          asignaturas.push({
            carrera: carreraId,
            periodo: safeText(cols[0]),
            clave: safeText(cols[1]),
            nombre: safeText(cols[2]),
            tipo: safeText(cols[3]),
            creditos: safeText(cols[4]),
            horasTeoria: safeText(cols[5]),
            horasPractica: safeText(cols[6])
          })
        }
      }
    }

    return asignaturas
  }

  async getGeneralCupos(credentials: Credentials): Promise<CupoEntry[]> {
    const cookie = this.cookie(credentials)
    let page = await getPage(this.url('/Academica/Ocupabilidad_grupos.aspx'), cookie)

    let data: Record<string, string> = {
      '__VIEWSTATE': elValue(page.getElementById('__VIEWSTATE')),
      '__VIEWSTATEGENERATOR': elValue(page.getElementById('__VIEWSTATEGENERATOR')),
      '__EVENTVALIDATION': elValue(page.getElementById('__EVENTVALIDATION')),
      '__VIEWSTATEENCRYPTED': '',
      'ctl00$mainCopy$rblEsquema': '1'
    }

    page = await postPage(this.url('/Academica/Ocupabilidad_grupos.aspx'), cookie, data)
    data['__VIEWSTATE'] = elValue(page.getElementById('__VIEWSTATE'))
    data['__EVENTVALIDATION'] = elValue(page.getElementById('__EVENTVALIDATION'))

    const cupos: CupoEntry[] = []
    const carreras = page.getElementById('ctl00_mainCopy_dpdcarrera')!.getElementsByTagName('option')

    for (let i = 0; i < carreras.length; i++) {
      const carreraId = carreras[i].value
      data['ctl00$mainCopy$dpdcarrera'] = carreraId

      page = await postPage(this.url('/Academica/Ocupabilidad_grupos.aspx'), cookie, data)
      data['__VIEWSTATE'] = elValue(page.getElementById('__VIEWSTATE'))
      data['__EVENTVALIDATION'] = elValue(page.getElementById('__EVENTVALIDATION'))

      const plan = page.getElementById('ctl00_mainCopy_dpdplan')!.getElementsByTagName('option')
      data['ctl00$mainCopy$dpdplan'] = plan[0].value

      page = await postPage(this.url('/Academica/Ocupabilidad_grupos.aspx'), cookie, data)
      data['__VIEWSTATE'] = elValue(page.getElementById('__VIEWSTATE'))
      data['__EVENTVALIDATION'] = elValue(page.getElementById('__EVENTVALIDATION'))

      const table = page.getElementById('ctl00_mainCopy_GrvOcupabilidad')
      if (!table) continue

      const tbody = table.getElementsByTagName('tbody')[0]
      if (!tbody) continue
      const rows = tbody.getElementsByTagName('tr')

      for (let j = 1; j < rows.length; j++) {
        const cols = rows[j].getElementsByTagName('td')
        if (cols.length < 7) continue
        cupos.push({
          carrera: carreraId,
          grupo: safeText(cols[0]),
          clave: safeText(cols[1]),
          asignatura: safeText(cols[2]),
          periodo: safeText(cols[3]),
          cupo: safeText(cols[4]),
          inscritos: safeText(cols[5]),
          disponibles: safeText(cols[6])
        })
      }
    }

    return cupos
  }
}
