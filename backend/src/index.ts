import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cron from 'node-cron'
import { sessionCache } from './services/session-cache'
import { checkGradeChanges } from './services/grade-monitor'
import indexRoutes from './routes/index.routes'
import saesRoutes from './routes/saes.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL_MINUTES || '15')

app.use(cors({
  origin: true,
  credentials: true
}))

app.use(express.json())

app.use('/', indexRoutes)
app.use('/api', saesRoutes)

sessionCache.start()

cron.schedule(`*/${CHECK_INTERVAL} * * * *`, async () => {
  console.log(`[${new Date().toISOString()}] Revisando cambios de calificaciones...`)
  await checkGradeChanges()
})

app.listen(PORT, () => {
  console.log(`🚀 SaesNoti API running on port ${PORT}`)
  console.log(`📚 Campuses disponibles: UPIITA, UPIICSA`)
  console.log(`⏰ Monitor de calificaciones: cada ${CHECK_INTERVAL} min`)
})
