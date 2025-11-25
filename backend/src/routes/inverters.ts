import { Router, Request, Response } from 'express'
import db from '../database/database'
import type { Inverter, ApiResponse } from '../types'

const router = Router()

// GET /api/inverters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { brand, minPower, maxPower, type, active = 'true' } = req.query
    
    let query = db('inverters')
    
    if (active === 'true') {
      query = query.where('isActive', true)
    }
    
    if (brand) {
      query = query.where('brand', 'like', `%${brand}%`)
    }
    
    if (minPower) {
      query = query.where('power', '>=', Number(minPower))
    }
    
    if (maxPower) {
      query = query.where('power', '<=', Number(maxPower))
    }
    
    if (type) {
      query = query.where('type', type)
    }
    
    const inverters = await query.orderBy('brand', 'asc').orderBy('model', 'asc')
    
    const response: ApiResponse<Inverter[]> = {
      success: true,
      data: inverters
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error en GET /inverters:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error al obtener inversores'
    }
    res.status(500).json(response)
  }
})

// GET /api/inverters/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const inverter = await db('inverters').where('id', req.params.id).first()
    
    if (!inverter) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Inversor no encontrado'
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse<Inverter> = {
      success: true,
      data: inverter
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error en GET /inverters/:id:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error al obtener inversor'
    }
    res.status(500).json(response)
  }
})

// POST /api/inverters
router.post('/', async (req: Request, res: Response) => {
  try {
    const inverterData = {
      id: `inverter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...req.body,
      isActive: true
    }
    
    await db('inverters').insert(inverterData)
    
    const response: ApiResponse<Inverter> = {
      success: true,
      data: inverterData,
      message: 'Inversor creado exitosamente'
    }
    
    res.status(201).json(response)
  } catch (error) {
    console.error('Error en POST /inverters:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error al crear inversor'
    }
    res.status(500).json(response)
  }
})

// PUT /api/inverters/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id, created_at, updated_at, ...updateData } = req.body
    
    const updated = await db('inverters')
      .where('id', req.params.id)
      .update({
        ...updateData,
        updated_at: new Date()
      })
    
    if (updated === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Inversor no encontrado'
      }
      return res.status(404).json(response)
    }
    
    const inverter = await db('inverters').where('id', req.params.id).first()
    
    const response: ApiResponse<Inverter> = {
      success: true,
      data: inverter,
      message: 'Inversor actualizado exitosamente'
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error en PUT /inverters/:id:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error al actualizar inversor'
    }
    res.status(500).json(response)
  }
})

// DELETE /api/inverters/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db('inverters')
      .where('id', req.params.id)
      .update({ 
        isActive: false, 
        updated_at: new Date() 
      })
    
    if (updated === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Inversor no encontrado'
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Inversor eliminado exitosamente'
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error en DELETE /inverters/:id:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error al eliminar inversor'
    }
    res.status(500).json(response)
  }
})

export default router