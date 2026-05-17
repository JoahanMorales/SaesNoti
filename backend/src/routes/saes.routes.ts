import express from 'express'
import * as ctrl from '../controllers/saes.controller'

const router = express.Router()

router.get('/session', ctrl.getSession)
router.post('/login', ctrl.login)
router.get('/user/info', ctrl.getUserInfo)
router.get('/user/kardex', ctrl.getKardex)
router.get('/user/horario', ctrl.getHorario)
router.get('/user/calificaciones', ctrl.getCalificaciones)
router.get('/general/horarios', ctrl.getHorariosGeneral)
router.get('/general/horarios-proximo', ctrl.getHorariosGeneral)
router.get('/general/asignaturas', ctrl.getAsignaturas)
router.get('/general/cupos', ctrl.getCupos)
router.get('/campuses', ctrl.getCampuses)

export default router
