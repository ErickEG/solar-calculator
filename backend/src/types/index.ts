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

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface HourlyConsumption {
  hour: number;
  consumption: number;
}

export type ConsumptionPattern = 'residential' | 'commercial' | 'industrial' | 'custom';

export interface ConsumptionProfile {
  pattern: ConsumptionPattern;
  hourlyData: HourlyConsumption[];
  totalDaily: number;
  peakHour: number;
  peakConsumption: number;
}

export interface EnergyFlowAnalysis {
  hour: number;
  consumption: number;
  solarGeneration: number;
  directUse: number;
  excessEnergy: number;
  gridImport: number;
  batteryCharge?: number;
  batteryDischarge?: number;
}

export type SystemType = 'on-grid' | 'off-grid' | 'hybrid';

export interface SystemConfiguration {
  type: SystemType;
  requiresBattery: boolean;
  batteryCapacity?: number;
  batteryPower?: number;
  reason: string;
}

export interface ROIAnalysis {
  systemType: SystemType;
  initialInvestment: number;
  monthlySavings: number;
  paybackPeriod: number;
  roi25Years: number;
  npv: number;
  selfConsumptionRate: number;
  gridDependency: number;
}

export interface SystemRecommendation {
  recommended: SystemType;
  configurations: {
    onGrid: ROIAnalysis;
    offGrid?: ROIAnalysis;
    hybrid?: ROIAnalysis;
  };
  ranking: Array<{
    type: SystemType;
    score: number;
    roi: number;
  }>;
}