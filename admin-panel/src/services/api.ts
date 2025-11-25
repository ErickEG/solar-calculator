import axios from 'axios'
import type { SolarPanel, Inverter, ApiResponse } from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.data)
    return response
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const panelsApi = {
  getAll: async (filters?: any): Promise<SolarPanel[]> => {
    const response = await api.get<ApiResponse<SolarPanel[]>>('/api/panels', { params: filters })
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Error al obtener paneles')
  },

  getById: async (id: string): Promise<SolarPanel> => {
    const response = await api.get<ApiResponse<SolarPanel>>(`/api/panels/${id}`)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Error al obtener panel')
  },

  create: async (panel: Omit<SolarPanel, 'id' | 'isActive' | 'created_at' | 'updated_at'>): Promise<SolarPanel> => {
    const response = await api.post<ApiResponse<SolarPanel>>('/api/panels', panel)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Error al crear panel')
  },
  update: async (id: string, panel: Partial<SolarPanel>): Promise<SolarPanel> => {
    try {
      console.log('Updating panel:', id, panel)
      const response = await api.put<ApiResponse<SolarPanel>>(`/api/panels/${id}`, panel)
      console.log('Update response:', response.data)
      
      if (response.data.success && response.data.data) {
        return response.data.data
      }
      throw new Error(response.data.error || 'Error al actualizar panel')
    } catch (error) {
      console.error('Error in panelsApi.update:', error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message
        throw new Error(`Error al actualizar panel: ${errorMessage}`)
      }
      throw error
    }
  },

  delete: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/api/inverters/${id}`)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al eliminar inversor')
    }
  }
}

export const invertersApi = {
  getAll: async (filters?: any): Promise<Inverter[]> => {
    const response = await api.get<ApiResponse<Inverter[]>>('/api/inverters', { params: filters })
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Error al obtener inversores')
  },

  create: async (inverter: Omit<Inverter, 'id' | 'isActive' | 'created_at' | 'updated_at'>): Promise<Inverter> => {
    const response = await api.post<ApiResponse<Inverter>>('/api/inverters', inverter)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Error al crear inversor')
  },
  update: async (id: string, inverter: Partial<Inverter>): Promise<Inverter> => {
    const response = await api.put<ApiResponse<Inverter>>(`/api/inverters/${id}`, inverter)
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.error || 'Error al actualizar inversor')
  },

  delete: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/api/inverters/${id}`)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Error al eliminar inversor')
    }
  }
}

export default api
