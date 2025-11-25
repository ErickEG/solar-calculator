import { Router, Request, Response } from 'express'
import db from '../database/database'
import type { SolarPanel, ApiResponse } from '../types'

const router = Router()

// GET /api/panels
router.get('/', async (req: Request, res: Response) => {
  try {
    const { brand, minPower, maxPower, technology, active = 'true' } = req.query
    
    let query = db('solar_panels')
    
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
    
    if (technology) {
      query = query.where('technology', technology)
    }
    
    const panels = await query.orderBy('brand', 'asc').orderBy('model', 'asc')
    
    const response: ApiResponse<SolarPanel[]> = {
      success: true,
      data: panels
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error en GET /panels:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error al obtener paneles'
    }
    res.status(500).json(response)
  }
})

// GET /api/panels/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const panel = await db('solar_panels').where('id', req.params.id).first()
    
    if (!panel) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Panel no encontrado'
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse<SolarPanel> = {
      success: true,
      data: panel
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error en GET /panels/:id:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error al obtener panel'
    }
    res.status(500).json(response)
  }
})

// POST /api/panels
router.post('/', async (req: Request, res: Response) => {
  try {
    const requiredFields = ['brand', 'model', 'power', 'price', 'efficiency', 'voltage', 'current', 'length', 'width', 'thickness', 'warranty', 'technology']
    
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        return res.status(400).json({
          success: false,
          error: `Campo requerido: ${field}`
        })
      }
    }

    const panelData = {
      id: `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      brand: req.body.brand,
      model: req.body.model,
      power: Number(req.body.power),
      price: Number(req.body.price),
      efficiency: Number(req.body.efficiency),
      voltage: Number(req.body.voltage),
      current: Number(req.body.current),
      length: Number(req.body.length),
      width: Number(req.body.width),
      thickness: Number(req.body.thickness),
      warranty: Number(req.body.warranty),
      technology: req.body.technology,
      certification: req.body.certification || '',
      isActive: true
    }
    
    await db('solar_panels').insert(panelData)
    
    const response: ApiResponse<SolarPanel> = {
      success: true,
      data: panelData,
      message: 'Panel creado exitosamente'
    }
    
    res.status(201).json(response)
  } catch (error) {
    console.error('Error en POST /panels:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error al crear panel: ' + (error as Error).message
    }
    res.status(500).json(response)
  }
})

// PUT /api/panels/:id - CORREGIDA
router.put('/:id', async (req: Request, res: Response) => {
  try {
    console.log('PUT /panels/:id - ID:', req.params.id)
    console.log('PUT /panels/:id - Body:', req.body)

    // Verificar que el panel existe
    const existingPanel = await db('solar_panels').where('id', req.params.id).first()
    if (!existingPanel) {
      return res.status(404).json({
        success: false,
        error: 'Panel no encontrado'
      })
    }

    // Extraer solo los campos que se pueden actualizar y limpiar
    const {
      id,
      created_at,
      updated_at,
      isActive,
      ...updateFields
    } = req.body

    // Crear objeto de actualización con validación
    const updateData: any = {}

    // Validar y asignar cada campo
    if (updateFields.brand !== undefined) updateData.brand = String(updateFields.brand)
    if (updateFields.model !== undefined) updateData.model = String(updateFields.model)
    if (updateFields.power !== undefined) updateData.power = Number(updateFields.power)
    if (updateFields.price !== undefined) updateData.price = Number(updateFields.price)
    if (updateFields.efficiency !== undefined) updateData.efficiency = Number(updateFields.efficiency)
    if (updateFields.voltage !== undefined) updateData.voltage = Number(updateFields.voltage)
    if (updateFields.current !== undefined) updateData.current = Number(updateFields.current)
    if (updateFields.length !== undefined) updateData.length = Number(updateFields.length)
    if (updateFields.width !== undefined) updateData.width = Number(updateFields.width)
    if (updateFields.thickness !== undefined) updateData.thickness = Number(updateFields.thickness)
    if (updateFields.warranty !== undefined) updateData.warranty = Number(updateFields.warranty)
    if (updateFields.technology !== undefined) updateData.technology = String(updateFields.technology)
    if (updateFields.certification !== undefined) updateData.certification = String(updateFields.certification)

    // Siempre actualizar el timestamp
    updateData.updated_at = new Date()

    console.log('Datos para actualizar:', updateData)

    const updated = await db('solar_panels')
      .where('id', req.params.id)
      .update(updateData)
    
    if (updated === 0) {
      return res.status(404).json({
        success: false,
        error: 'Panel no encontrado o no se pudo actualizar'
      })
    }
    
    // Obtener el panel actualizado
    const panel = await db('solar_panels').where('id', req.params.id).first()
    
    const response: ApiResponse<SolarPanel> = {
      success: true,
      data: panel,
      message: 'Panel actualizado exitosamente'
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error en PUT /panels/:id:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error al actualizar panel: ' + (error as Error).message
    }
    res.status(500).json(response)
  }
})

// DELETE /api/panels/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db('solar_panels')
      .where('id', req.params.id)
      .update({ 
        isActive: false, 
        updated_at: new Date() 
      })
    
    if (updated === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Panel no encontrado'
      }
      return res.status(404).json(response)
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Panel eliminado exitosamente'
    }
    
    res.json(response)
  } catch (error) {
    console.error('Error en DELETE /panels/:id:', error)
    const response: ApiResponse<null> = {
      success: false,
      error: 'Error al eliminar panel'
    }
    res.status(500).json(response)
  }
})

export default router