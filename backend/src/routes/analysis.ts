import express from 'express';
import type { Request, Response } from 'express';
import type { 
  ConsumptionProfile, 
  SystemRecommendation,
  EnergyFlowAnalysis,
  ROIAnalysis,
  SystemType 
} from '../types';

const router = express.Router();

// Perfiles predefinidos (24 horas)
const CONSUMPTION_PATTERNS = {
  residential: [
    0.15, 0.12, 0.10, 0.10, 0.12, 0.20, // 0-5 AM
    0.35, 0.45, 0.40, 0.30, 0.25, 0.30, // 6-11 AM
    0.40, 0.35, 0.30, 0.35, 0.45, 0.55, // 12-5 PM
    0.70, 0.75, 0.65, 0.50, 0.35, 0.25  // 6-11 PM
  ],
  commercial: [
    0.10, 0.10, 0.10, 0.10, 0.15, 0.25, // 0-5 AM
    0.50, 0.75, 1.00, 0.95, 0.90, 0.85, // 6-11 AM
    0.80, 0.85, 0.90, 0.95, 0.90, 0.75, // 12-5 PM
    0.50, 0.30, 0.20, 0.15, 0.10, 0.10  // 6-11 PM
  ],
  industrial: [
    0.85, 0.85, 0.85, 0.85, 0.85, 0.90, // 0-5 AM
    0.95, 1.00, 1.00, 1.00, 1.00, 1.00, // 6-11 AM
    0.95, 1.00, 1.00, 1.00, 1.00, 0.95, // 12-5 PM
    0.90, 0.85, 0.85, 0.85, 0.85, 0.85  // 6-11 PM
  ]
};

// Curva de generación solar típica (normalizada)
const SOLAR_GENERATION_CURVE = [
  0.00, 0.00, 0.00, 0.00, 0.00, 0.00, // 0-5 AM
  0.05, 0.25, 0.50, 0.70, 0.85, 0.95, // 6-11 AM
  1.00, 0.95, 0.85, 0.70, 0.50, 0.25, // 12-5 PM
  0.05, 0.00, 0.00, 0.00, 0.00, 0.00  // 6-11 PM
];

function generateEnergyFlow(
  consumptionProfile: ConsumptionProfile,
  systemPower: number, // kW
  peakSunHours: number
): EnergyFlowAnalysis[] {
  const flow: EnergyFlowAnalysis[] = [];
  const dailyGeneration = systemPower * peakSunHours; // kWh
  
  for (let hour = 0; hour < 24; hour++) {
    const consumption = consumptionProfile.hourlyData[hour].consumption;
    const solarGeneration = (SOLAR_GENERATION_CURVE[hour] * dailyGeneration) / peakSunHours;
    
    const directUse = Math.min(consumption, solarGeneration);
    const excessEnergy = Math.max(0, solarGeneration - consumption);
    const gridImport = Math.max(0, consumption - solarGeneration);
    
    flow.push({
      hour,
      consumption,
      solarGeneration,
      directUse,
      excessEnergy,
      gridImport,
    });
  }
  
  return flow;
}

function calculateOnGridROI(
  energyFlow: EnergyFlowAnalysis[],
  systemCost: number,
  electricityRate: number,
  feedInTariff: number = 0 // Tarifa por venta a red
): ROIAnalysis {
  // Cálculos mensuales
  const directUseDaily = energyFlow.reduce((sum, h) => sum + h.directUse, 0);
  const excessDaily = energyFlow.reduce((sum, h) => sum + h.excessEnergy, 0);
  const gridImportDaily = energyFlow.reduce((sum, h) => sum + h.gridImport, 0);
  const consumptionDaily = energyFlow.reduce((sum, h) => sum + h.consumption, 0);
  
  // Ahorros mensuales
  const savingsFromSolar = directUseDaily * 30 * electricityRate;
  const incomeFromExcess = excessDaily * 30 * feedInTariff;
  const monthlySavings = savingsFromSolar + incomeFromExcess;
  
  // Payback period
  const paybackPeriod = systemCost / (monthlySavings * 12);
  
  // ROI a 25 años
  const totalSavings25Years = monthlySavings * 12 * 25;
  const roi25Years = ((totalSavings25Years - systemCost) / systemCost) * 100;
  
  // NPV (tasa descuento 5%)
  let npv = -systemCost;
  for (let year = 1; year <= 25; year++) {
    const annualSavings = monthlySavings * 12;
    npv += annualSavings / Math.pow(1.05, year);
  }
  
  const selfConsumptionRate = (directUseDaily / (directUseDaily + excessDaily)) * 100;
  const gridDependency = (gridImportDaily / consumptionDaily) * 100;
  
  return {
    systemType: 'on-grid',
    initialInvestment: systemCost,
    monthlySavings,
    paybackPeriod,
    roi25Years,
    npv,
    selfConsumptionRate,
    gridDependency
  };
}

function calculateOffGridROI(
  energyFlow: EnergyFlowAnalysis[],
  systemCost: number,
  batteryCost: number,
  electricityRate: number
): ROIAnalysis {
  const consumptionDaily = energyFlow.reduce((sum, h) => sum + h.consumption, 0);
  
  // Sistema off-grid: ahorro = evitar comprar toda la energía de red
  const monthlySavings = consumptionDaily * 30 * electricityRate;
  
  const totalInvestment = systemCost + batteryCost;
  const paybackPeriod = totalInvestment / (monthlySavings * 12);
  
  // ROI a 25 años (considerando reemplazo de baterías cada 10 años)
  const batteryReplacements = Math.floor(25 / 10);
  const totalCost = totalInvestment + (batteryReplacements * batteryCost);
  const totalSavings25Years = monthlySavings * 12 * 25;
  const roi25Years = ((totalSavings25Years - totalCost) / totalCost) * 100;
  
  // NPV
  let npv = -totalInvestment;
  for (let year = 1; year <= 25; year++) {
    let annualCashFlow = monthlySavings * 12;
    // Restar reemplazo de baterías
    if (year % 10 === 0 && year < 25) {
      annualCashFlow -= batteryCost;
    }
    npv += annualCashFlow / Math.pow(1.05, year);
  }
  
  return {
    systemType: 'off-grid',
    initialInvestment: totalInvestment,
    monthlySavings,
    paybackPeriod,
    roi25Years,
    npv,
    selfConsumptionRate: 100,
    gridDependency: 0
  };
}

function calculateHybridROI(
  energyFlow: EnergyFlowAnalysis[],
  systemCost: number,
  batteryCost: number,
  electricityRate: number,
  feedInTariff: number = 0
): ROIAnalysis {
  const directUseDaily = energyFlow.reduce((sum, h) => sum + h.directUse, 0);
  const excessDaily = energyFlow.reduce((sum, h) => sum + h.excessEnergy, 0);
  const gridImportDaily = energyFlow.reduce((sum, h) => sum + h.gridImport, 0);
  const consumptionDaily = energyFlow.reduce((sum, h) => sum + h.consumption, 0);
  
  // Batería almacena exceso hasta su capacidad
  const batteryCapacityKWh = batteryCost / 500; // Estimación: $500/kWh
  const storedDaily = Math.min(excessDaily, batteryCapacityKWh);
  const excessToGrid = excessDaily - storedDaily;
  
  // Batería reduce importación de red
  const gridImportReduced = Math.max(0, gridImportDaily - storedDaily);
  
  const savingsFromSolar = directUseDaily * 30 * electricityRate;
  const savingsFromBattery = storedDaily * 30 * electricityRate;
  const incomeFromExcess = excessToGrid * 30 * feedInTariff;
  const monthlySavings = savingsFromSolar + savingsFromBattery + incomeFromExcess;
  
  const totalInvestment = systemCost + batteryCost;
  const paybackPeriod = totalInvestment / (monthlySavings * 12);
  
  // ROI a 25 años
  const batteryReplacements = Math.floor(25 / 10);
  const totalCost = totalInvestment + (batteryReplacements * batteryCost);
  const totalSavings25Years = monthlySavings * 12 * 25;
  const roi25Years = ((totalSavings25Years - totalCost) / totalCost) * 100;
  
  // NPV
  let npv = -totalInvestment;
  for (let year = 1; year <= 25; year++) {
    let annualCashFlow = monthlySavings * 12;
    if (year % 10 === 0 && year < 25) {
      annualCashFlow -= batteryCost;
    }
    npv += annualCashFlow / Math.pow(1.05, year);
  }
  
  const selfConsumptionRate = ((directUseDaily + storedDaily) / (directUseDaily + excessDaily)) * 100;
  const gridDependency = (gridImportReduced / consumptionDaily) * 100;
  
  return {
    systemType: 'hybrid',
    initialInvestment: totalInvestment,
    monthlySavings,
    paybackPeriod,
    roi25Years,
    npv,
    selfConsumptionRate,
    gridDependency
  };
}

// POST /api/analysis/recommend-system
router.post('/recommend-system', (req: Request, res: Response) => {
  try {
    const {
      consumptionProfile,
      systemPower,
      peakSunHours,
      panelCost,
      inverterCost,
      installationCost,
      electricityRate,
      feedInTariff = 0,
      batteryBudget = 5000
    } = req.body;

    // Validaciones
    if (!consumptionProfile || !systemPower || !peakSunHours) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }

    const systemCost = panelCost + inverterCost + installationCost;
    
    // Generar flujo de energía
    const energyFlow = generateEnergyFlow(
      consumptionProfile,
      systemPower,
      peakSunHours
    );

    // Calcular ROI para cada tipo de sistema
    const onGridROI = calculateOnGridROI(
      energyFlow,
      systemCost,
      electricityRate,
      feedInTariff
    );

    const offGridROI = calculateOffGridROI(
      energyFlow,
      systemCost,
      batteryBudget,
      electricityRate
    );

    const hybridROI = calculateHybridROI(
      energyFlow,
      systemCost,
      batteryBudget,
      electricityRate,
      feedInTariff
    );

    // Ranking basado en NPV (mejor indicador financiero)
    const ranking = [
      { type: 'on-grid' as SystemType, score: onGridROI.npv, roi: onGridROI.roi25Years },
      { type: 'off-grid' as SystemType, score: offGridROI.npv, roi: offGridROI.roi25Years },
      { type: 'hybrid' as SystemType, score: hybridROI.npv, roi: hybridROI.roi25Years }
    ].sort((a, b) => b.score - a.score);

    const recommendation: SystemRecommendation = {
      recommended: ranking[0].type,
      configurations: {
        onGrid: onGridROI,
        offGrid: offGridROI,
        hybrid: hybridROI
      },
      ranking
    };

    res.json({
      success: true,
      data: recommendation,
      energyFlow
    });

  } catch (error) {
    console.error('Error in system recommendation:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/analysis/consumption-patterns
router.get('/consumption-patterns', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: CONSUMPTION_PATTERNS
  });
});

export default router;