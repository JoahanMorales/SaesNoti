import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cron from 'node-cron'
import { sessionCache } from './services/session-cache'
import { checkGradeChanges, keepAllAlive } from './services/grade-monitor'
import indexRoutes from './routes/index.routes'
import saesRoutes from './routes/saes.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL_MINUTES || '15')
const KEEP_ALIVE_INTERVAL = 10

app.use(cors({
  origin: true,
  credentials: true
}))

app.use(express.json())

app.use('/', indexRoutes)
app.use('/api', saesRoutes)

sessionCache.start()

cron.schedule(`*/${KEEP_ALIVE_INTERVAL} * * * *`, async () => {
  console.log(`[${new Date().toISOString()}] Keep-alive para ${sessionCache.getActiveCount()} sesiones...`)
  await keepAllAlive()
})

cron.schedule(`*/${CHECK_INTERVAL} * * * *`, async () => {
  console.log(`[${new Date().toISOString()}] Revisando calificaciones...`)
  await checkGradeChanges()
})

app.listen(PORT, () => {
  console.log(`🚀 SaesNoti API running on port ${PORT}`)
  console.log(`📚 Campuses disponibles: UPIITA, UPIICSA`)
  console.log(`💓 Keep-alive: cada ${KEEP_ALIVE_INTERVAL} min`)
  console.log(`📊 Monitor calificaciones: cada ${CHECK_INTERVAL} min`)
})
