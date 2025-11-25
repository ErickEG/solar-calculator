export interface LoadItem {
  id: string
  name: string
  power: number
  hoursPerDay: number
  quantity: number
  dailyConsumption: number
}

export interface SystemCalculation {
  totalDailyConsumption: number
  totalMonthlyConsumption: number
  peakPower: number
  requiredPanelPower: number
  numberOfPanels: number
  inverterSize: number
  estimatedCost: number
}

export interface Load {
  name: string;
  quantity: number;
  power: number;
  hours: number;
  category: string;
}

export interface SolarPanel {
  id: string;
  brand: string;
  model: string;
  power: number;
  price: number;
  efficiency: number;
  voltage: number;        // DEBE ESTAR
  current: number;
  length: number;
  width: number;
  thickness: number;
  warranty: number;
  technology: 'Monocristalino' | 'Policristalino' | 'Thin Film';
  certification: string;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Inverter {
  id: string;
  brand: string;
  model: string;
  power: number;
  price: number;
  type: 'string' | 'micro' | 'power';
  minVoltage: number;        // AGREGAR
  maxVoltage: number;        // AGREGAR
  efficiency: number;        // AGREGAR
  warranty: number;
  mpptChannels: number;
  certification: string;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HourlyConsumption {
  hour: number; // 0-23
  consumption: number; // kWh
}

export type ConsumptionPattern = 'residential' | 'commercial' | 'industrial' | 'custom';

export interface ConsumptionProfile {
  pattern: ConsumptionPattern;
  hourlyData: HourlyConsumption[];
  totalDaily: number; // kWh
  peakHour: number;
  peakConsumption: number;
}

export interface SolarGenerationProfile {
  hour: number;
  generation: number; // kWh
}

export interface EnergyFlowAnalysis {
  hour: number;
  consumption: number;
  solarGeneration: number;
  directUse: number; // Energía solar usada directamente
  excessEnergy: number; // Energía solar excedente
  gridImport: number; // Energía tomada de red (on-grid) o batería (off-grid)
  batteryCharge?: number; // Para sistemas off-grid/híbridos
  batteryDischarge?: number;
}

export type SystemType = 'on-grid' | 'off-grid' | 'hybrid';

export interface SystemConfiguration {
  type: SystemType;
  requiresBattery: boolean;
  batteryCapacity?: number; // kWh
  batteryPower?: number; // kW
  reason: string;
}

export interface ROIAnalysis {
  systemType: SystemType;
  initialInvestment: number; // USD
  monthlySavings: number; // USD
  paybackPeriod: number; // años
  roi25Years: number; // Retorno en 25 años (%)
  npv: number; // Valor presente neto
  selfConsumptionRate: number; // % de energía solar auto-consumida
  gridDependency: number; // % de dependencia de red
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