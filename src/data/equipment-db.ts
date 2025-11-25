import type { SolarPanel, Inverter } from '../types'

export const solarPanels: SolarPanel[] = [
  { id: '1', brand: 'Canadian Solar', model: 'CS3W-400P', power: 400, price: 120, efficiency: 20.5 },
  { id: '2', brand: 'Jinko Solar', model: 'JKM420N-54HL4-B', power: 420, price: 125, efficiency: 21.2 },
  { id: '3', brand: 'Trina Solar', model: 'TSM-405DE09', power: 405, price: 118, efficiency: 20.8 },
  { id: '4', brand: 'LONGi Solar', model: 'LR4-72HPH-450M', power: 450, price: 135, efficiency: 21.5 },
  { id: '5', brand: 'JA Solar', model: 'JAM60S21-330/MR', power: 330, price: 95, efficiency: 19.8 }
]

export const inverters: Inverter[] = [
  { id: '1', brand: 'SMA', model: 'SB 3000TL', power: 3000, price: 450, type: 'string' },
  { id: '2', brand: 'Fronius', model: 'Primo 5.0-1', power: 5000, price: 650, type: 'string' },
  { id: '3', brand: 'Huawei', model: 'SUN2000-8KTL', power: 8000, price: 850, type: 'string' },
  { id: '4', brand: 'SolarEdge', model: 'SE10K', power: 10000, price: 1200, type: 'power' },
  { id: '5', brand: 'Enphase', model: 'IQ7+', power: 290, price: 180, type: 'micro' }
]

export const commonLoads = [
  { name: 'Refrigerador', power: 150, hoursPerDay: 8 },
  { name: 'TV LED 32"', power: 65, hoursPerDay: 6 },
  { name: 'Bombillo LED 9W', power: 9, hoursPerDay: 8 },
  { name: 'Ventilador de techo', power: 75, hoursPerDay: 10 },
  { name: 'Microondas', power: 1000, hoursPerDay: 0.5 },
  { name: 'Lavadora', power: 500, hoursPerDay: 1 },
  { name: 'Computadora', power: 200, hoursPerDay: 8 },
  { name: 'Router WiFi', power: 12, hoursPerDay: 24 },
  { name: 'Aire acondicionado', power: 1200, hoursPerDay: 6 },
  { name: 'Plancha', power: 1000, hoursPerDay: 0.5 }
]