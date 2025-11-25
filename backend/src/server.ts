import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'

import { initializeDatabase } from './database/database'
import panelsRouter from './routes/panels'
import invertersRouter from './routes/inverters'
import analysisRoutes from './routes/analysis';

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3001

// Middlewares
app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:5173',  // Calculadora principal
    'http://localhost:5174',  // Panel de administración
    'http://localhost:3000',  // Fallback
    'http://10.255.255.254:5173',  // Red WSL
    'http://172.23.251.63:5173',    // Red WSL
    'https://solar-calculator-mjbw1836c-ericks-projects-7013dd5d.vercel.app',
    'https://solar-calculator-navy.vercel.app/', // Tu dominio final de Vercel
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rutas
app.use('/api/panels', panelsRouter)
app.use('/api/inverters', invertersRouter)
app.use('/api/analysis', analysisRoutes); // NUEVA LÍNEA

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'Solar Calculator API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      panels: '/api/panels',
      inverters: '/api/inverters'
    }
  })
})

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  })
})

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  })
})

async function startServer() {
  try {
    await initializeDatabase()
    console.log('✅ Base de datos inicializada')
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor API corriendo en http://localhost:${PORT}`)
      console.log(`📋 Health check: http://localhost:${PORT}/health`)
      console.log(`🔗 Calculadora: http://localhost:5173`)
      console.log(`⚙️  Admin Panel: http://localhost:5174`)
    })
  } catch (error) {
    console.error('❌ Error al inicializar servidor:', error)
    process.exit(1)
  }
}

startServer()