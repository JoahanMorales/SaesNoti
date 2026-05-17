import express from 'express'

const router = express.Router()

router.get('/', (_req, res) => {
  res.json({
    message: 'SaesNoti API v2.0',
    endpoints: {
      auth: {
        'GET /api/session': 'Obtener captcha y sesión (query: ?campus=upiicsa)',
        'POST /api/login': 'Iniciar sesión (query: ?campus=upiicsa, header: session, body: {username, password, captcha: {id, solution}})'
      },
      user: {
        'GET /api/user/info': 'Info del alumno',
        'GET /api/user/kardex': 'Kárdex completo',
        'GET /api/user/horario': 'Horario actual',
        'GET /api/user/calificaciones': 'Calificaciones del semestre'
      },
      general: {
        'GET /api/general/horarios': 'Horarios generales',
        'GET /api/general/horarios-proximo': 'Horarios próximo periodo',
        'GET /api/general/asignaturas': 'Mapa curricular',
        'GET /api/general/cupos': 'Cupos disponibles'
      },
      other: {
        'GET /api/campuses': 'Lista de campus disponibles'
      }
    },
    auth_methods: 'Header X-Session-ID (con sesión cacheada) o headers login + session'
  })
})

export default router
