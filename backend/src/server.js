import express from 'express'
import cors from 'cors'
import openaiRoutes from './routes/openai.js'
import csvRoutes from './routes/csv.js'
import masterRoutes from './routes/master.js'
import shiftsRoutes from './routes/shifts.js'
import analyticsRoutes from './routes/analytics.js'
import tenantsRoutes from './routes/tenants.js'
import { appendLog } from './utils/logger.js'

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Routes
app.use('/api/openai', openaiRoutes)
app.use('/api', csvRoutes)
app.use('/api/master', masterRoutes)
app.use('/api/shifts', shiftsRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/tenants', tenantsRoutes)

// Server startup
app.listen(PORT, () => {
  const startupMsg = `🚀 Backend server running on http://localhost:${PORT}`
  const proxyMsg = `📡 OpenAI API Proxy enabled`

  console.log(startupMsg)
  console.log(proxyMsg)

  appendLog(startupMsg)
  appendLog(proxyMsg)
  appendLog('=====================================')
})
