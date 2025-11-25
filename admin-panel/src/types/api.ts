export interface SolarPanel {
  id: string
  brand: string
  model: string
  power: number
  price: number
  efficiency: number
  voltage: number
  current: number
  length: number
  width: number
  thickness: number
  warranty: number
  technology: 'Monocristalino' | 'Policristalino' | 'Thin Film'
  certification: string
  isActive: boolean
  created_at?: string
  updated_at?: string
}

export interface Inverter {
  id: string
  brand: string
  model: string
  power: number
  price: number
  type: 'string' | 'micro' | 'power'
  minVoltage: number
  maxVoltage: number
  efficiency: number
  warranty: number
  mpptChannels: number
  certification: string
  isActive: boolean
  created_at?: string
  updated_at?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
