import React, { useState, useEffect } from 'react';
import { Calculator, Settings, TrendingUp } from 'lucide-react';
import { LoadTable } from './LoadTable';
import { ConsumptionProfile } from './ConsumptionProfile';
import { SystemRecommendation } from './SystemRecommendation';
import { getPanels, getInverters, recommendSystem } from '../services/api';
import type {
  SolarPanel,
  Inverter,
  LoadItem,
  ConsumptionProfile as ConsumptionProfileType,
  SystemRecommendation as SystemRecommendationType,
  EnergyFlowAnalysis
} from '../types/index';

type OptimizationMode = 'manual' | 'cost' | 'efficiency' | 'balanced';

export function SystemCalculator() {  // ← ESTA LÍNEA FALTABA
  const [loads, setLoads] = useState<LoadItem[]>([
    {
      id: '1',
      name: 'Refrigerador',
      quantity: 1,
      power: 150,
      hoursPerDay: 24,
      dailyConsumption: (150 * 24 * 1) / 1000
    },
    {
      id: '2',
      name: 'Televisor',
      quantity: 2,
      power: 100,
      hoursPerDay: 6,
      dailyConsumption: (100 * 6 * 2) / 1000
    },
    {
      id: '3',
      name: 'Computadora',
      quantity: 1,
      power: 200,
      hoursPerDay: 8,
      dailyConsumption: (200 * 8 * 1) / 1000
    },
    {
      id: '4',
      name: 'Iluminación LED',
      quantity: 10,
      power: 10,
      hoursPerDay: 6,
      dailyConsumption: (10 * 6 * 10) / 1000
    },
    {
      id: '5',
      name: 'Lavadora',
      quantity: 1,
      power: 500,
      hoursPerDay: 2,
      dailyConsumption: (500 * 2 * 1) / 1000
    },
  ]);


  // Parámetros del sistema
  const [peakSunHours, setPeakSunHours] = useState(5);
  const [systemEfficiency, setSystemEfficiency] = useState(0.85);
  const [safetyFactor, setSafetyFactor] = useState(1.25);
  const [electricityRate, setElectricityRate] = useState(0.15); // USD/kWh
  const [feedInTariff, setFeedInTariff] = useState(0.08); // USD/kWh para venta a red
  const [installationCost, setInstallationCost] = useState(2000); // USD
  const [batteryBudget, setBatteryBudget] = useState(5000); // USD

  // Catálogos
  const [panels, setPanels] = useState<SolarPanel[]>([]);
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [selectedPanel, setSelectedPanel] = useState<SolarPanel | null>(null);
  const [selectedInverter, setSelectedInverter] = useState<Inverter | null>(null);

  // Modo de optimización
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>('manual');

  // NUEVOS ESTADOS para perfil de consumo y recomendación
  const [consumptionProfile, setConsumptionProfile] = useState<ConsumptionProfileType | null>(null);
  const [recommendation, setRecommendation] = useState<SystemRecommendationType | null>(null);
  const [energyFlow, setEnergyFlow] = useState<EnergyFlowAnalysis[]>([]);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  // Cargar catálogos
  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      const [panelsData, invertersData] = await Promise.all([
        getPanels(),
        getInverters()
      ]);
      setPanels(panelsData);
      setInverters(invertersData);
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  // Cálculos básicos
  const calculateDailyEnergy = () => {
  return loads.reduce((total, load) => {
    return total + load.dailyConsumption;
  }, 0);
  };
  const calculateRequiredPower = () => {
    const dailyEnergy = calculateDailyEnergy();
    return (dailyEnergy * 1000) / (peakSunHours * systemEfficiency) * safetyFactor;
  };

  const calculateNumberOfPanels = (panel: SolarPanel) => {
    const requiredPower = calculateRequiredPower();
    return Math.ceil(requiredPower / panel.power);
  };

  const calculateSystemPower = () => {
    if (!selectedPanel) return 0;
    return (calculateNumberOfPanels(selectedPanel) * selectedPanel.power) / 1000; // kW
  };

  const calculateTotalCost = () => {
    if (!selectedPanel || !selectedInverter) return 0;
    const panelCost = calculateNumberOfPanels(selectedPanel) * selectedPanel.price;
    return panelCost + selectedInverter.price + installationCost;
  };

  // NUEVA FUNCIÓN: Analizar y recomendar sistema
  const analyzeSystem = async () => {
    if (!selectedPanel || !selectedInverter || !consumptionProfile) {
      alert('Por favor completa todos los datos: cargas, perfil de consumo y equipos seleccionados');
      return;
    }

    setLoadingRecommendation(true);
    setShowRecommendation(true);

    try {
      const systemPower = calculateSystemPower();
      const panelCost = calculateNumberOfPanels(selectedPanel) * selectedPanel.price;

      const result = await recommendSystem({
        consumptionProfile,
        systemPower,
        peakSunHours,
        panelCost,
        inverterCost: selectedInverter.price,
        installationCost,
        electricityRate,
        feedInTariff,
        batteryBudget
      });

      setRecommendation(result.data);
      setEnergyFlow(result.energyFlow);
    } catch (error) {
      console.error('Error analyzing system:', error);
      alert('Error al analizar el sistema. Por favor verifica los datos.');
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Optimización automática (código existente se mantiene)
  const optimizeSystem = async () => {
    if (optimizationMode === 'manual') return;

    try {
      const requiredPower = calculateRequiredPower();
      let bestPanel: SolarPanel | null = null;
      let bestInverter: Inverter | null = null;
      let bestScore = -Infinity;

      for (const panel of panels) {
        const numPanels = Math.ceil(requiredPower / panel.power);
        const systemVoltage = panel.voltage * Math.ceil(numPanels / 2);
        
        const compatibleInverters = inverters.filter(inv => 
          systemVoltage >= inv.minVoltage && 
          systemVoltage <= inv.maxVoltage &&
          (numPanels * panel.power) <= inv.power * 1.2
        );

        if (compatibleInverters.length === 0) continue;

        for (const inverter of compatibleInverters) {
          const totalCost = (numPanels * panel.price) + inverter.price + installationCost;
          
          let score = 0;
          switch (optimizationMode) {
            case 'cost':
              score = -totalCost;
              break;
            case 'efficiency':
              score = panel.efficiency + inverter.efficiency;
              break;
            case 'balanced':
              const normalizedCost = totalCost / 10000;
              score = (panel.efficiency / 25) / (normalizedCost + 0.1);
              break;
          }

          if (score > bestScore) {
            bestScore = score;
            bestPanel = panel;
            bestInverter = inverter;
          }
        }
      }

      if (bestPanel && bestInverter) {
        setSelectedPanel(bestPanel);
        setSelectedInverter(bestInverter);
      }
    } catch (error) {
      console.error('Error in optimization:', error);
    }
  };

  useEffect(() => {
    if (panels.length > 0 && inverters.length > 0) {
      optimizeSystem();
    }
  }, [optimizationMode, panels, inverters, loads, peakSunHours, systemEfficiency, safetyFactor]);

  const dailyEnergy = calculateDailyEnergy();
  const requiredPower = calculateRequiredPower();
  const numberOfPanels = selectedPanel ? calculateNumberOfPanels(selectedPanel) : 0;
  const totalCost = calculateTotalCost();
  const annualSavings = dailyEnergy * 365 * electricityRate;
  const paybackPeriod = totalCost > 0 ? totalCost / annualSavings : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Calculadora Solar Profesional
          </h1>
          <p className="text-gray-600">
            Dimensiona tu sistema fotovoltaico con análisis completo y recomendación basada en ROI
          </p>
        </div>

        {/* Tabla de Cargas */}
        <LoadTable loads={loads} onLoadsChange={setLoads} />

        {/* NUEVO: Perfil de Consumo */}
        <ConsumptionProfile 
          onProfileChange={setConsumptionProfile}
          dailyConsumption={dailyEnergy}
        />

        {/* Parámetros del Sistema */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Parámetros del Sistema</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas Sol Pico (HSP)
              </label>
              <input
                type="number"
                step="0.1"
                value={peakSunHours}
                onChange={(e) => setPeakSunHours(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eficiencia del Sistema
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={systemEfficiency}
                onChange={(e) => setSystemEfficiency(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Factor de Seguridad
              </label>
              <input
                type="number"
                step="0.01"
                value={safetyFactor}
                onChange={(e) => setSafetyFactor(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarifa Eléctrica (USD/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                value={electricityRate}
                onChange={(e) => setElectricityRate(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarifa Venta a Red (USD/kWh)
              </label>
              <input
                type="number"
                step="0.01"
                value={feedInTariff}
                onChange={(e) => setFeedInTariff(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Instalación (USD)
              </label>
              <input
                type="number"
                value={installationCost}
                onChange={(e) => setInstallationCost(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Presupuesto Baterías (USD)
              </label>
              <input
                type="number"
                value={batteryBudget}
                onChange={(e) => setBatteryBudget(parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Modo de Optimización */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Modo de Selección</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { mode: 'manual', label: 'Manual', desc: 'Selección libre' },
              { mode: 'cost', label: 'Menor Costo', desc: 'Optimiza precio' },
              { mode: 'efficiency', label: 'Mayor Eficiencia', desc: 'Máximo rendimiento' },
              { mode: 'balanced', label: 'Balanceado', desc: 'Costo-eficiencia' }
            ].map(({ mode, label, desc }) => (
              <button
                key={mode}
                onClick={() => setOptimizationMode(mode as OptimizationMode)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  optimizationMode === mode
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold">{label}</div>
                <div className="text-sm text-gray-600">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selección de Equipos */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">Panel Solar</h3>
            <select
              value={selectedPanel?.id || ''}
              onChange={(e) => {
                const panel = panels.find(p => p.id === e.target.value);
                setSelectedPanel(panel || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              disabled={optimizationMode !== 'manual'}
            >
              <option value="">Seleccionar panel...</option>
              {panels.map(panel => (
                <option key={panel.id} value={panel.id}>
                  {panel.brand} {panel.model} - {panel.power}W - ${panel.price}
                </option>
              ))}
            </select>
            {selectedPanel && (
              <div className="text-sm space-y-1">
                <p><strong>Potencia:</strong> {selectedPanel.power}W</p>
                <p><strong>Eficiencia:</strong> {selectedPanel.efficiency}%</p>
                <p><strong>Cantidad necesaria:</strong> {numberOfPanels} paneles</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">Inversor</h3>
            <select
              value={selectedInverter?.id || ''}
              onChange={(e) => {
                const inverter = inverters.find(i => i.id === e.target.value);
                setSelectedInverter(inverter || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              disabled={optimizationMode !== 'manual'}
            >
              <option value="">Seleccionar inversor...</option>
              {inverters.map(inverter => (
                <option key={inverter.id} value={inverter.id}>
                  {inverter.brand} {inverter.model} - {inverter.power}W - ${inverter.price}
                </option>
              ))}
            </select>
            {selectedInverter && (
              <div className="text-sm space-y-1">
                <p><strong>Potencia:</strong> {selectedInverter.power}W</p>
                <p><strong>Eficiencia:</strong> {selectedInverter.efficiency}%</p>
                <p><strong>Tipo:</strong> {selectedInverter.type}</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumen Básico */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Resumen del Sistema</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Consumo Diario</p>
              <p className="text-2xl font-bold">{dailyEnergy.toFixed(2)} kWh</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Potencia Requerida</p>
              <p className="text-2xl font-bold">{(requiredPower / 1000).toFixed(2)} kW</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Costo Total</p>
              <p className="text-2xl font-bold">${totalCost.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Período Retorno Simple</p>
              <p className="text-2xl font-bold">{paybackPeriod.toFixed(1)} años</p>
            </div>
          </div>
        </div>

        {/* NUEVO: Botón de Análisis Completo */}
        <div className="flex justify-center">
          <button
            onClick={analyzeSystem}
            disabled={!selectedPanel || !selectedInverter || !consumptionProfile}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
          >
            <TrendingUp size={24} />
            Analizar Sistema y Recomendar Configuración
          </button>
        </div>

        {/* NUEVO: Recomendación del Sistema */}
        {showRecommendation && recommendation && (
          <SystemRecommendation 
            recommendation={recommendation}
            energyFlow={energyFlow}
            loading={loadingRecommendation}
          />
        )}
      </div>
    </div>
  );
}