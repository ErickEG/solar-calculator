# Exportación de proyecto

Ruta del proyecto: `/home/erickdev/solar-calculator`

## Árbol de directorios

```text
Proyecto: /home/erickdev/solar-calculator

├── admin-panel
│   ├── public
│   │   └── vite.svg
│   ├── src
│   │   ├── assets
│   │   │   └── react.svg
│   │   ├── components
│   │   │   ├── InvertersManager.tsx
│   │   │   └── PanelsManager.tsx
│   │   ├── services
│   │   │   └── api.ts
│   │   ├── types
│   │   │   └── api.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── backend
│   ├── src
│   │   ├── database
│   │   │   └── database.ts
│   │   ├── routes
│   │   │   ├── analysis.ts
│   │   │   ├── inverters.ts
│   │   │   └── panels.ts
│   │   ├── types
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── .env
│   ├── database.sqlite
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── public
│   └── vite.svg
├── src
│   ├── assets
│   │   └── react.svg
│   ├── components
│   │   ├── ConsumptionProfile.tsx
│   │   ├── LoadTable.tsx
│   │   ├── SystemCalculator.tsx
│   │   └── SystemRecommendation.tsx
│   ├── data
│   │   └── equipment-db.ts
│   ├── services
│   │   └── api.ts
│   ├── types
│   │   └── index.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env
├── .gitignore
├── eslint.config.js
├── estructura.py
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── project_export.md
├── README.md
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Contenido de archivos seleccionados

### `src/components/SystemCalculator.tsx`

```tsx
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
```

### `src/components/LoadTable.tsx`

```tsx
import React, { useState } from 'react'
import type { LoadItem } from '../types'
import { Plus, Trash2, Check, X, Edit2 } from 'lucide-react'
import { commonLoads } from '../data/equipment-db'

interface LoadTableProps {
  loads: LoadItem[]
  onLoadsChange: (loads: LoadItem[]) => void
}

export const LoadTable: React.FC<LoadTableProps> = ({ loads, onLoadsChange }) => {
  const [newLoad, setNewLoad] = useState({
    name: '',
    power: 0,
    hoursPerDay: 0,
    quantity: 1
  })
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<Partial<LoadItem>>({})

  const addLoad = () => {
    if (newLoad.name && newLoad.power > 0) {
      const dailyConsumption = (newLoad.power * newLoad.hoursPerDay * newLoad.quantity) / 1000
      
      const loadItem: LoadItem = {
        id: Date.now().toString(),
        name: newLoad.name,
        power: newLoad.power,
        hoursPerDay: newLoad.hoursPerDay,
        quantity: newLoad.quantity,
        dailyConsumption
      }

      onLoadsChange([...loads, loadItem])
      setNewLoad({ name: '', power: 0, hoursPerDay: 0, quantity: 1 })
    }
  }

  const removeLoad = (id: string) => {
    onLoadsChange(loads.filter(load => load.id !== id))
  }

  const addCommonLoad = (commonLoad: typeof commonLoads[0]) => {
    const dailyConsumption = (commonLoad.power * commonLoad.hoursPerDay) / 1000
    
    const loadItem: LoadItem = {
      id: Date.now().toString(),
      name: commonLoad.name,
      power: commonLoad.power,
      hoursPerDay: commonLoad.hoursPerDay,
      quantity: 1,
      dailyConsumption
    }

    onLoadsChange([...loads, loadItem])
  }

  const startEditing = (load: LoadItem) => {
    setEditingId(load.id)
    setEditingValues({
      name: load.name,
      power: load.power,
      hoursPerDay: load.hoursPerDay,
      quantity: load.quantity
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingValues({})
  }

  const saveEditing = () => {
    if (editingId && editingValues.name && editingValues.power && editingValues.power > 0) {
      const dailyConsumption = (editingValues.power! * editingValues.hoursPerDay! * editingValues.quantity!) / 1000
      
      const updatedLoads = loads.map(load => 
        load.id === editingId 
          ? {
              ...load,
              name: editingValues.name!,
              power: editingValues.power!,
              hoursPerDay: editingValues.hoursPerDay!,
              quantity: editingValues.quantity!,
              dailyConsumption
            }
          : load
      )
      
      onLoadsChange(updatedLoads)
      setEditingId(null)
      setEditingValues({})
    }
  }

  const updateEditingValue = (field: keyof LoadItem, value: string | number) => {
    setEditingValues(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const totalDailyConsumption = loads.reduce((sum, load) => sum + load.dailyConsumption, 0)
  const totalPeakPower = loads.reduce((sum, load) => sum + (load.power * load.quantity), 0)

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1.5rem' }}>
        Cuadro de Cargas
      </h2>
      
      {/* Cargas Comunes */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>
          Cargas Típicas
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '0.5rem' 
        }}>
          {commonLoads.map((load, index) => (
            <button
              key={index}
              onClick={() => addCommonLoad(load)}
              style={{
                fontSize: '0.875rem',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid #dbeafe',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#dbeafe'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff'
              }}
            >
              {load.name}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario para agregar carga */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
      }}>
        <input
          type="text"
          placeholder="Nombre del equipo"
          value={newLoad.name}
          onChange={(e) => setNewLoad({...newLoad, name: e.target.value})}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}
        />
        <input
          type="number"
          placeholder="Potencia (W)"
          value={newLoad.power || ''}
          onChange={(e) => setNewLoad({...newLoad, power: Number(e.target.value)})}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}
        />
        <input
          type="number"
          placeholder="Horas/día"
          value={newLoad.hoursPerDay || ''}
          onChange={(e) => setNewLoad({...newLoad, hoursPerDay: Number(e.target.value)})}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}
        />
        <input
          type="number"
          placeholder="Cantidad"
          value={newLoad.quantity || ''}
          onChange={(e) => setNewLoad({...newLoad, quantity: Number(e.target.value)})}
          style={{
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem'
          }}
        />
        <button
          onClick={addLoad}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {/* Tabla de cargas */}
      {loads.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #d1d5db', padding: '0.75rem', textAlign: 'left' }}>Equipo</th>
                <th style={{ border: '1px solid #d1d5db', padding: '0.75rem', textAlign: 'center' }}>Potencia (W)</th>
                <th style={{ border: '1px solid #d1d5db', padding: '0.75rem', textAlign: 'center' }}>Horas/día</th>
                <th style={{ border: '1px solid #d1d5db', padding: '0.75rem', textAlign: 'center' }}>Cantidad</th>
                <th style={{ border: '1px solid #d1d5db', padding: '0.75rem', textAlign: 'center' }}>Consumo (kWh/día)</th>
                <th style={{ border: '1px solid #d1d5db', padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loads.map((load) => (
                <tr key={load.id} style={{ backgroundColor: editingId === load.id ? '#fef3c7' : 'white' }}>
                  <td style={{ border: '1px solid #d1d5db', padding: '0.75rem' }}>
                    {editingId === load.id ? (
                      <input
                        type="text"
                        value={editingValues.name || ''}
                        onChange={(e) => updateEditingValue('name', e.target.value)}
                        style={{ width: '100%', padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      />
                    ) : (
                      load.name
                    )}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '0.75rem', textAlign: 'center' }}>
                    {editingId === load.id ? (
                      <input
                        type="number"
                        value={editingValues.power || ''}
                        onChange={(e) => updateEditingValue('power', Number(e.target.value))}
                        style={{ width: '80px', padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      />
                    ) : (
                      load.power
                    )}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '0.75rem', textAlign: 'center' }}>
                    {editingId === load.id ? (
                      <input
                        type="number"
                        value={editingValues.hoursPerDay || ''}
                        onChange={(e) => updateEditingValue('hoursPerDay', Number(e.target.value))}
                        style={{ width: '60px', padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      />
                    ) : (
                      load.hoursPerDay
                    )}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '0.75rem', textAlign: 'center' }}>
                    {editingId === load.id ? (
                      <input
                        type="number"
                        value={editingValues.quantity || ''}
                        onChange={(e) => updateEditingValue('quantity', Number(e.target.value))}
                        style={{ width: '60px', padding: '0.25rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      />
                    ) : (
                      load.quantity
                    )}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '0.75rem', textAlign: 'center' }}>
                    {load.dailyConsumption.toFixed(2)}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '0.75rem', textAlign: 'center' }}>
                    {editingId === load.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={saveEditing}
                          style={{
                            color: '#059669',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          style={{
                            color: '#dc2626',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => startEditing(load)}
                          style={{
                            color: '#2563eb',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => removeLoad(load.id)}
                          style={{
                            color: '#dc2626',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resumen */}
      {loads.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: '600', color: '#065f46' }}>Consumo Total Diario</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#047857' }}>
              {totalDailyConsumption.toFixed(2)} kWh
            </p>
          </div>
          <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: '600', color: '#1e40af' }}>Potencia Pico Total</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1d4ed8' }}>
              {totalPeakPower.toFixed(0)} W
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
```

### `src/components/ConsumptionProfile.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Upload } from 'lucide-react';
import type { ConsumptionProfile, ConsumptionPattern, HourlyConsumption } from '../types/index';

interface Props {
  onProfileChange: (profile: ConsumptionProfile) => void;
  dailyConsumption: number;
}

export function ConsumptionProfile({ onProfileChange, dailyConsumption }: Props) {
  const [pattern, setPattern] = useState<ConsumptionPattern>('residential');
  const [hourlyData, setHourlyData] = useState<HourlyConsumption[]>([]);
  const [isCustom, setIsCustom] = useState(false);

  // Inicializar con patrón residencial
  useEffect(() => {
    loadPattern('residential');
  }, []);

  // Actualizar cuando cambia el consumo diario total
  useEffect(() => {
    if (hourlyData.length > 0) {
      updateProfile();
    }
  }, [dailyConsumption]);

  const loadPattern = async (selectedPattern: ConsumptionPattern) => {
    if (selectedPattern === 'custom') {
      setIsCustom(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/analysis/consumption-patterns');
      const result = await response.json();
      
      const patternData = result.data[selectedPattern];
      const normalizedData: HourlyConsumption[] = patternData.map((factor: number, hour: number) => ({
        hour,
        consumption: (factor * dailyConsumption) / patternData.reduce((a: number, b: number) => a + b, 0)
      }));

      setHourlyData(normalizedData);
      setPattern(selectedPattern);
      setIsCustom(false);
      
      updateProfileData(normalizedData, selectedPattern);
    } catch (error) {
      console.error('Error loading pattern:', error);
    }
  };

  const updateProfileData = (data: HourlyConsumption[], currentPattern: ConsumptionPattern) => {
    const totalDaily = data.reduce((sum, h) => sum + h.consumption, 0);
    const maxHour = data.reduce((max, h) => h.consumption > max.consumption ? h : max);

    const profile: ConsumptionProfile = {
      pattern: currentPattern,
      hourlyData: data,
      totalDaily,
      peakHour: maxHour.hour,
      peakConsumption: maxHour.consumption
    };

    onProfileChange(profile);
  };

  const updateProfile = () => {
    updateProfileData(hourlyData, pattern);
  };

  const handleHourChange = (hour: number, value: string) => {
    const consumption = parseFloat(value) || 0;
    const newData = hourlyData.map(h => 
      h.hour === hour ? { ...h, consumption } : h
    );
    setHourlyData(newData);
    updateProfileData(newData, 'custom');
  };

  const exportProfile = () => {
    const dataStr = JSON.stringify(hourlyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'consumption-profile.json';
    link.click();
  };

  const importProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setHourlyData(imported);
        setPattern('custom');
        setIsCustom(true);
        updateProfileData(imported, 'custom');
      } catch (error) {
        console.error('Error importing profile:', error);
        alert('Error al importar el perfil');
      }
    };
    reader.readAsText(file);
  };

  const maxConsumption = Math.max(...hourlyData.map(h => h.consumption));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold">Perfil de Consumo</h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportProfile}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            title="Exportar perfil"
          >
            <Download size={16} />
            Exportar
          </button>
          <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm cursor-pointer">
            <Upload size={16} />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={importProfile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Perfil
        </label>
        <select
          value={pattern}
          onChange={(e) => loadPattern(e.target.value as ConsumptionPattern)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="residential">Residencial</option>
          <option value="commercial">Comercial</option>
          <option value="industrial">Industrial</option>
          <option value="custom">Personalizado</option>
        </select>
        <p className="mt-2 text-sm text-gray-600">
          {pattern === 'residential' && 'Consumo típico residencial: picos en mañana y noche'}
          {pattern === 'commercial' && 'Consumo comercial: mayor durante horario laboral'}
          {pattern === 'industrial' && 'Consumo industrial: constante 24/7'}
          {pattern === 'custom' && 'Perfil personalizado: edita los valores manualmente'}
        </p>
      </div>

      {/* Gráfico de barras simple */}
      <div className="mb-6">
        <div className="h-64 flex items-end gap-1 border-b border-l border-gray-300 p-4">
          {hourlyData.map((hour) => (
            <div
              key={hour.hour}
              className="flex-1 bg-blue-500 hover:bg-blue-600 transition-colors rounded-t relative group cursor-pointer"
              style={{ height: `${(hour.consumption / maxConsumption) * 100}%` }}
              title={`${hour.hour}:00 - ${hour.consumption.toFixed(2)} kWh`}
            >
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {hour.hour}:00<br/>
                {hour.consumption.toFixed(2)} kWh
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2 px-4">
          <span>0h</span>
          <span>6h</span>
          <span>12h</span>
          <span>18h</span>
          <span>24h</span>
        </div>
      </div>

      {/* Tabla editable para modo personalizado */}
      {isCustom && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Editar Consumo Horario (kWh)
          </h3>
          <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {hourlyData.map((hour) => (
              <div key={hour.hour} className="flex flex-col">
                <label className="text-xs text-gray-600 mb-1">
                  {hour.hour}:00
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={hour.consumption.toFixed(2)}
                  onChange={(e) => handleHourChange(hour.hour, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
        <div>
          <p className="text-sm text-gray-600">Consumo Total</p>
          <p className="text-lg font-semibold text-gray-900">
            {hourlyData.reduce((sum, h) => sum + h.consumption, 0).toFixed(2)} kWh/día
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Hora Pico</p>
          <p className="text-lg font-semibold text-gray-900">
            {hourlyData.reduce((max, h) => h.consumption > max.consumption ? h : max, hourlyData[0])?.hour || 0}:00
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Consumo Máximo</p>
          <p className="text-lg font-semibold text-gray-900">
            {maxConsumption.toFixed(2)} kWh
          </p>
        </div>
      </div>
    </div>
  );
}

```

### `src/components/SystemRecommendation.tsx`

```tsx
import React from 'react';
import { TrendingUp, Battery, Zap, DollarSign, Calendar, Percent } from 'lucide-react';
import type { SystemRecommendation as SystemRecommendationType, SystemType, EnergyFlowAnalysis } from '../types/index';

interface Props {
  recommendation: SystemRecommendationType;  // Cambiar aquí también
  energyFlow: EnergyFlowAnalysis[];
  loading?: boolean;
}

export function SystemRecommendation({ recommendation, energyFlow, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return null;
  }

  const getSystemIcon = (type: SystemType) => {
    switch (type) {
      case 'on-grid': return <Zap className="text-blue-600" size={24} />;
      case 'off-grid': return <Battery className="text-green-600" size={24} />;
      case 'hybrid': return <TrendingUp className="text-purple-600" size={24} />;
    }
  };

  const getSystemColor = (type: SystemType) => {
    switch (type) {
      case 'on-grid': return 'blue';
      case 'off-grid': return 'green';
      case 'hybrid': return 'purple';
    }
  };

  const getSystemName = (type: SystemType) => {
    switch (type) {
      case 'on-grid': return 'Conectado a Red';
      case 'off-grid': return 'Autónomo (Off-Grid)';
      case 'hybrid': return 'Híbrido';
    }
  };

  const getSystemDescription = (type: SystemType) => {
    switch (type) {
      case 'on-grid': 
        return 'Sistema conectado a la red eléctrica. Vende excedentes y usa red cuando es necesario.';
      case 'off-grid': 
        return 'Sistema completamente autónomo con baterías. No depende de la red eléctrica.';
      case 'hybrid': 
        return 'Sistema con baterías y conexión a red. Máxima flexibilidad y respaldo.';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatYears = (value: number) => {
    const years = Math.floor(value);
    const months = Math.round((value - years) * 12);
    return `${years} años ${months > 0 ? `${months} meses` : ''}`;
  };

  // Calcular totales de energía del flujo
  const totalConsumption = energyFlow.reduce((sum, h) => sum + h.consumption, 0);
  const totalSolarGen = energyFlow.reduce((sum, h) => sum + h.solarGeneration, 0);
  const totalDirectUse = energyFlow.reduce((sum, h) => sum + h.directUse, 0);
  const totalExcess = energyFlow.reduce((sum, h) => sum + h.excessEnergy, 0);
  const totalGridImport = energyFlow.reduce((sum, h) => sum + h.gridImport, 0);

  const recommendedConfig = recommendation.configurations[
    recommendation.recommended === 'on-grid' ? 'onGrid' :
    recommendation.recommended === 'off-grid' ? 'offGrid' : 'hybrid'
  ]!;

  return (
    <div className="space-y-6">
      {/* Sistema Recomendado */}
      <div className={`bg-gradient-to-br from-${getSystemColor(recommendation.recommended)}-50 to-${getSystemColor(recommendation.recommended)}-100 rounded-lg shadow-lg p-6 border-2 border-${getSystemColor(recommendation.recommended)}-400`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getSystemIcon(recommendation.recommended)}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {getSystemName(recommendation.recommended)}
                </h2>
                <span className={`px-3 py-1 bg-${getSystemColor(recommendation.recommended)}-600 text-white text-xs font-semibold rounded-full`}>
                  RECOMENDADO
                </span>
              </div>
              <p className="text-gray-700 mt-1">
                {getSystemDescription(recommendation.recommended)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign size={16} />
              <span className="text-sm">Inversión Inicial</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(recommendedConfig.initialInvestment)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Calendar size={16} />
              <span className="text-sm">Periodo de Retorno</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatYears(recommendedConfig.paybackPeriod)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <TrendingUp size={16} />
              <span className="text-sm">ROI a 25 años</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatPercent(recommendedConfig.roi25Years)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Percent size={16} />
              <span className="text-sm">Autoconsumo</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {formatPercent(recommendedConfig.selfConsumptionRate)}
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Ahorro mensual estimado:</strong> {formatCurrency(recommendedConfig.monthlySavings)}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <strong>Valor Presente Neto (VPN):</strong> {formatCurrency(recommendedConfig.npv)}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <strong>Dependencia de red:</strong> {formatPercent(recommendedConfig.gridDependency)}
          </p>
        </div>
      </div>

      {/* Comparación de Sistemas */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Comparación de Sistemas</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Criterio</th>
                <th className="text-center py-3 px-4 font-semibold text-blue-700">Conectado a Red</th>
                <th className="text-center py-3 px-4 font-semibold text-green-700">Autónomo</th>
                <th className="text-center py-3 px-4 font-semibold text-purple-700">Híbrido</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-700">Inversión Inicial</td>
                <td className="text-center py-3 px-4">
                  {formatCurrency(recommendation.configurations.onGrid.initialInvestment)}
                </td>
                <td className="text-center py-3 px-4">
                  {formatCurrency(recommendation.configurations.offGrid!.initialInvestment)}
                </td>
                <td className="text-center py-3 px-4">
                  {formatCurrency(recommendation.configurations.hybrid!.initialInvestment)}
                </td>
              </tr>
              
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-700">Periodo de Retorno</td>
                <td className="text-center py-3 px-4">
                  {formatYears(recommendation.configurations.onGrid.paybackPeriod)}
                </td>
                <td className="text-center py-3 px-4">
                  {formatYears(recommendation.configurations.offGrid!.paybackPeriod)}
                </td>
                <td className="text-center py-3 px-4">
                  {formatYears(recommendation.configurations.hybrid!.paybackPeriod)}
                </td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-700">ROI 25 años</td>
                <td className="text-center py-3 px-4 font-semibold text-blue-600">
                  {formatPercent(recommendation.configurations.onGrid.roi25Years)}
                </td>
                <td className="text-center py-3 px-4 font-semibold text-green-600">
                  {formatPercent(recommendation.configurations.offGrid!.roi25Years)}
                </td>
                <td className="text-center py-3 px-4 font-semibold text-purple-600">
                  {formatPercent(recommendation.configurations.hybrid!.roi25Years)}
                </td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-700">VPN</td>
                <td className="text-center py-3 px-4">
                  {formatCurrency(recommendation.configurations.onGrid.npv)}
                </td>
                <td className="text-center py-3 px-4">
                  {formatCurrency(recommendation.configurations.offGrid!.npv)}
                </td>
                <td className="text-center py-3 px-4">
                  {formatCurrency(recommendation.configurations.hybrid!.npv)}
                </td>
              </tr>

              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-700">Autoconsumo</td>
                <td className="text-center py-3 px-4">
                  {formatPercent(recommendation.configurations.onGrid.selfConsumptionRate)}
                </td>
                <td className="text-center py-3 px-4">
                  {formatPercent(recommendation.configurations.offGrid!.selfConsumptionRate)}
                </td>
                <td className="text-center py-3 px-4">
                  {formatPercent(recommendation.configurations.hybrid!.selfConsumptionRate)}
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 text-gray-700">Dependencia Red</td>
                <td className="text-center py-3 px-4">
                  {formatPercent(recommendation.configurations.onGrid.gridDependency)}
                </td>
                <td className="text-center py-3 px-4">
                  {formatPercent(recommendation.configurations.offGrid!.gridDependency)}
                </td>
                <td className="text-center py-3 px-4">
                  {formatPercent(recommendation.configurations.hybrid!.gridDependency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Ranking */}
        <div className="mt-6">
          <h4 className="font-semibold text-gray-700 mb-3">Ranking por ROI Financiero (VPN)</h4>
          <div className="space-y-2">
            {recommendation.ranking.map((item, index) => (
              <div 
                key={item.type}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-50 border border-yellow-300' :
                  index === 1 ? 'bg-gray-50 border border-gray-300' :
                  'bg-orange-50 border border-orange-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${
                    index === 0 ? 'text-yellow-600' :
                    index === 1 ? 'text-gray-600' :
                    'text-orange-600'
                  }`}>
                    #{index + 1}
                  </span>
                  {getSystemIcon(item.type)}
                  <span className="font-medium">{getSystemName(item.type)}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">VPN</p>
                  <p className="font-semibold">{formatCurrency(item.score)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Análisis de Flujo de Energía */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Análisis Energético Diario</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Consumo Total</p>
            <p className="text-xl font-bold text-gray-900">{totalConsumption.toFixed(2)} kWh</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Generación Solar</p>
            <p className="text-xl font-bold text-yellow-600">{totalSolarGen.toFixed(2)} kWh</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Uso Directo</p>
            <p className="text-xl font-bold text-green-600">{totalDirectUse.toFixed(2)} kWh</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Excedente</p>
            <p className="text-xl font-bold text-blue-600">{totalExcess.toFixed(2)} kWh</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">De Red/Batería</p>
            <p className="text-xl font-bold text-red-600">{totalGridImport.toFixed(2)} kWh</p>
          </div>
        </div>

        {/* Gráfico de flujo energético por hora */}
        <div className="h-64 border-b-2 border-l-2 border-gray-300 p-4 bg-white relative">
          <div className="w-full h-full flex items-end gap-1">
            {energyFlow.map((hour) => {
              const maxValue = Math.max(
                ...energyFlow.map(h => Math.max(h.consumption, h.solarGeneration))
              );
              
              const consumptionPercent = (hour.consumption / maxValue) * 100;
              const solarPercent = (hour.solarGeneration / maxValue) * 100;
              
              return (
                <div key={hour.hour} className="flex-1 relative group" style={{ height: '100%' }}>
                  {/* Barra de consumo (gris) - fondo */}
                  <div 
                    className="absolute bottom-0 w-full bg-gray-400 hover:bg-gray-500 transition-colors"
                    style={{ height: `${consumptionPercent}%` }}
                  ></div>
                  
                  {/* Barra de generación solar (amarillo) - superpuesta */}
                  <div 
                    className="absolute bottom-0 w-full bg-yellow-400 hover:bg-yellow-500 transition-colors opacity-75"
                    style={{ height: `${solarPercent}%` }}
                  ></div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {hour.hour}:00<br/>
                    Consumo: {hour.consumption.toFixed(2)} kWh<br/>
                    Solar: {hour.solarGeneration.toFixed(2)} kWh
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-600 mt-2 px-4">
          <span>0h</span>
          <span>6h</span>
          <span>12h</span>
          <span>18h</span>
          <span>24h</span>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span>Consumo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span>Generación Solar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

```

### `src/services/api.ts`

```typescript
import axios from 'axios';
import type { SolarPanel, Inverter } from '../types/index';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Paneles
export async function getPanels(filters?: {
  brand?: string;
  minPower?: number;
  maxPower?: number;
  minPrice?: number;
  maxPrice?: number;
  technology?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await axios.get(`${API_URL}/panels?${params}`);
  return response.data.data as SolarPanel[];  // Cambiar esta línea
}

export async function getPanelById(id: string) {
  const response = await axios.get(`${API_URL}/panels/${id}`);
  return response.data as SolarPanel;
}

export async function createPanel(panel: Omit<SolarPanel, 'id' | 'created_at' | 'updated_at'>) {
  const response = await axios.post(`${API_URL}/panels`, panel);
  return response.data as SolarPanel;
}

export async function updatePanel(id: string, panel: Partial<SolarPanel>) {
  const response = await axios.put(`${API_URL}/panels/${id}`, panel);
  return response.data as SolarPanel;
}

export async function deletePanel(id: string) {
  await axios.delete(`${API_URL}/panels/${id}`);
}

// Inversores
export async function getInverters(filters?: {
  brand?: string;
  minPower?: number;
  maxPower?: number;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await axios.get(`${API_URL}/inverters?${params}`);
  return response.data.data as Inverter[];  // Cambiar esta línea
}

export async function getInverterById(id: string) {
  const response = await axios.get(`${API_URL}/inverters/${id}`);
  return response.data as Inverter;
}

export async function createInverter(inverter: Omit<Inverter, 'id' | 'created_at' | 'updated_at'>) {
  const response = await axios.post(`${API_URL}/inverters`, inverter);
  return response.data as Inverter;
}

export async function updateInverter(id: string, inverter: Partial<Inverter>) {
  const response = await axios.put(`${API_URL}/inverters/${id}`, inverter);
  return response.data as Inverter;
}

export async function deleteInverter(id: string) {
  await axios.delete(`${API_URL}/inverters/${id}`);
}

// NUEVAS FUNCIONES para análisis de sistemas
export async function getConsumptionPatterns() {
  const response = await axios.get(`${API_URL}/analysis/consumption-patterns`);
  return response.data.data;
}

export async function recommendSystem(data: {
  consumptionProfile: any;
  systemPower: number;
  peakSunHours: number;
  panelCost: number;
  inverterCost: number;
  installationCost: number;
  electricityRate: number;
  feedInTariff?: number;
  batteryBudget?: number;
}) {
  const response = await axios.post(`${API_URL}/analysis/recommend-system`, data);
  return response.data;
}
```

### `src/types/index.ts`

```typescript
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
```

### `src/App.tsx`

```tsx
import { SystemCalculator } from './components/SystemCalculator'

function App() {
  return <SystemCalculator />
}

export default App
```

### `src/data/equipment-db.ts`

```typescript
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
```

### `package.json`

```json
{
  "name": "solar-calculator",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@tanstack/react-table": "^8.21.3",
    "axios": "^1.12.2",
    "clsx": "^2.1.1",
    "html2canvas": "^1.4.1",
    "jspdf": "^3.0.3",
    "lucide-react": "^0.544.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-hook-form": "^7.63.0",
    "tailwind-merge": "^3.3.1",
    "zod": "^4.1.11"
  },
  "devDependencies": {
    "@eslint/js": "^9.36.0",
    "@tailwindcss/postcss": "^4.1.13",
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9",
    "@vitejs/plugin-react": "^5.0.3",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.36.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.4.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.13",
    "typescript": "~5.8.3",
    "typescript-eslint": "^8.44.0",
    "vite": "^7.1.7"
  }
}

```

### `.env`

```
VITE_API_URL=http://localhost:3001/api

```

### `backend/src/server.ts`

```typescript
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
    'http://172.23.251.63:5173'    // Red WSL
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
```

### `backend/src/routes/panels.ts`

```typescript
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
```

### `backend/src/routes/inverters.ts`

```typescript
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
```

### `backend/src/routes/analysis.ts`

```typescript
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
```

### `backend/src/types/index.ts`

```typescript
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
```

### `backend/src/database/database.ts`

```typescript
import knex from 'knex'
import path from 'path'

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, '../../database.sqlite')
  },
  useNullAsDefault: true
})

export async function initializeDatabase() {
  // Crear tabla solar_panels
  const panelsExists = await db.schema.hasTable('solar_panels')
  if (!panelsExists) {
    await db.schema.createTable('solar_panels', table => {
      table.string('id').primary()
      table.string('brand').notNullable()
      table.string('model').notNullable()
      table.integer('power').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.decimal('efficiency', 5, 2).notNullable()
      table.decimal('voltage', 8, 2).notNullable()
      table.decimal('current', 8, 2).notNullable()
      table.integer('length').notNullable()
      table.integer('width').notNullable()
      table.integer('thickness').notNullable()
      table.integer('warranty').notNullable()
      table.string('technology').notNullable()
      table.text('certification')
      table.boolean('isActive').defaultTo(true)
      table.timestamps(true, true)
    })
    console.log('Tabla solar_panels creada')
  }

  // Crear tabla inverters
  const invertersExists = await db.schema.hasTable('inverters')
  if (!invertersExists) {
    await db.schema.createTable('inverters', table => {
      table.string('id').primary()
      table.string('brand').notNullable()
      table.string('model').notNullable()
      table.integer('power').notNullable()
      table.decimal('price', 10, 2).notNullable()
      table.string('type').notNullable()
      table.integer('minVoltage').notNullable()
      table.integer('maxVoltage').notNullable()
      table.decimal('efficiency', 5, 2).notNullable()
      table.integer('warranty').notNullable()
      table.integer('mpptChannels').notNullable()
      table.text('certification')
      table.boolean('isActive').defaultTo(true)
      table.timestamps(true, true)
    })
    console.log('Tabla inverters creada')
  }

  // Insertar datos iniciales
  await seedInitialData()
}

async function seedInitialData() {
  const panelCount = await db('solar_panels').count('id as count').first()
  
  if (Number(panelCount?.count) === 0) {
    await db('solar_panels').insert([
      {
        id: 'cs-400p',
        brand: 'Canadian Solar',
        model: 'CS3W-400P',
        power: 400,
        price: 120,
        efficiency: 20.5,
        voltage: 40.9,
        current: 9.78,
        length: 2008,
        width: 1002,
        thickness: 35,
        warranty: 25,
        technology: 'Monocristalino',
        certification: 'IEC 61215, IEC 61730',
        isActive: true
      },
      {
        id: 'jk-420n',
        brand: 'Jinko Solar',
        model: 'JKM420N-54HL4-B',
        power: 420,
        price: 125,
        efficiency: 21.2,
        voltage: 40.6,
        current: 10.34,
        length: 2008,
        width: 1002,
        thickness: 35,
        warranty: 25,
        technology: 'Monocristalino',
        certification: 'IEC 61215, IEC 61730, UL 1703',
        isActive: true
      }
    ])
    console.log('Datos iniciales de paneles insertados')
  }

  const inverterCount = await db('inverters').count('id as count').first()
  
  if (Number(inverterCount?.count) === 0) {
    await db('inverters').insert([
      {
        id: 'sma-3000tl',
        brand: 'SMA',
        model: 'SB 3000TL',
        power: 3000,
        price: 450,
        type: 'string',
        minVoltage: 125,
        maxVoltage: 750,
        efficiency: 96.8,
        warranty: 10,
        mpptChannels: 2,
        certification: 'IEC 62109-1, IEC 62109-2',
        isActive: true
      },
      {
        id: 'fronius-5000',
        brand: 'Fronius',
        model: 'Primo 5.0-1',
        power: 5000,
        price: 650,
        type: 'string',
        minVoltage: 80,
        maxVoltage: 800,
        efficiency: 96.8,
        warranty: 10,
        mpptChannels: 2,
        certification: 'IEC 62109-1, IEC 62109-2',
        isActive: true
      }
    ])
    console.log('Datos iniciales de inversores insertados')
  }
}

export default db

```

### `backend/package.json`

```json
{
  "name": "solar-calculator-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "knex": "^2.5.1",
    "morgan": "^1.10.0",
    "sqlite3": "^5.1.6"
  },
  "devDependencies": {
    "@types/compression": "^1.8.1",
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/morgan": "^1.9.10",
    "@types/node": "^20.5.0",
    "nodemon": "^3.0.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  }
}

```

### `admin-panel/src/components/PanelsManager.tsx`

```tsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { panelsApi } from '../services/api'
import type { SolarPanel } from '../types/api'

interface PanelFormData {
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
}

export function PanelsManager() {
  const [panels, setPanels] = useState<SolarPanel[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPanel, setEditingPanel] = useState<SolarPanel | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PanelFormData>()

  useEffect(() => {
    loadPanels()
  }, [])

  const loadPanels = async () => {
    try {
      setLoading(true)
      const data = await panelsApi.getAll()
      setPanels(data)
    } catch (error) {
      showMessage('error', 'Error al cargar paneles')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const onSubmit = async (data: PanelFormData) => {
    try {
      if (editingPanel) {
        await panelsApi.update(editingPanel.id, data)
        showMessage('success', 'Panel actualizado exitosamente')
      } else {
        await panelsApi.create(data)
        showMessage('success', 'Panel creado exitosamente')
      }
      
      reset()
      setShowForm(false)
      setEditingPanel(null)
      loadPanels()
    } catch (error) {
      showMessage('error', 'Error al guardar panel')
    }
  }

  const handleEdit = (panel: SolarPanel) => {
    setEditingPanel(panel)
    setValue('brand', panel.brand)
    setValue('model', panel.model)
    setValue('power', panel.power)
    setValue('price', panel.price)
    setValue('efficiency', panel.efficiency)
    setValue('voltage', panel.voltage)
    setValue('current', panel.current)
    setValue('length', panel.length)
    setValue('width', panel.width)
    setValue('thickness', panel.thickness)
    setValue('warranty', panel.warranty)
    setValue('technology', panel.technology)
    setValue('certification', panel.certification)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este panel?')) {
      try {
        await panelsApi.delete(id)
        showMessage('success', 'Panel eliminado exitosamente')
        loadPanels()
      } catch (error) {
        showMessage('error', 'Error al eliminar panel')
      }
    }
  }

  const cancelForm = () => {
    reset()
    setShowForm(false)
    setEditingPanel(null)
  }

  if (loading) {
    return <div className="empty-state">Cargando paneles...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">
          Gestión de Paneles Solares
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary btn-lg"
        >
          <Plus size={20} />
          Agregar Panel
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="text-xl font-semibold mb-5 text-primary">
            {editingPanel ? 'Editar Panel' : 'Nuevo Panel'}
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-auto-fit gap-4 mb-5">
              <div className="form-group">
                <label className="label">Marca</label>
                <input
                  {...register('brand', { required: 'La marca es requerida' })}
                  className="input"
                />
                {errors.brand && <span className="error-text">{errors.brand.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Modelo</label>
                <input
                  {...register('model', { required: 'El modelo es requerido' })}
                  className="input"
                />
                {errors.model && <span className="error-text">{errors.model.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Potencia (W)</label>
                <input
                  type="number"
                  {...register('power', { required: 'La potencia es requerida', min: 1 })}
                  className="input"
                />
                {errors.power && <span className="error-text">{errors.power.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Precio ($)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { required: 'El precio es requerido', min: 0 })}
                  className="input"
                />
                {errors.price && <span className="error-text">{errors.price.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Eficiencia (%)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('efficiency', { required: 'La eficiencia es requerida', min: 0, max: 100 })}
                  className="input"
                />
                {errors.efficiency && <span className="error-text">{errors.efficiency.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Voltaje (V)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('voltage', { required: 'El voltaje es requerido', min: 0 })}
                  className="input"
                />
                {errors.voltage && <span className="error-text">{errors.voltage.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Corriente (A)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('current', { required: 'La corriente es requerida', min: 0 })}
                  className="input"
                />
                {errors.current && <span className="error-text">{errors.current.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Largo (mm)</label>
                <input
                  type="number"
                  {...register('length', { required: 'El largo es requerido', min: 1 })}
                  className="input"
                />
                {errors.length && <span className="error-text">{errors.length.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Ancho (mm)</label>
                <input
                  type="number"
                  {...register('width', { required: 'El ancho es requerido', min: 1 })}
                  className="input"
                />
                {errors.width && <span className="error-text">{errors.width.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Grosor (mm)</label>
                <input
                  type="number"
                  {...register('thickness', { required: 'El grosor es requerido', min: 1 })}
                  className="input"
                />
                {errors.thickness && <span className="error-text">{errors.thickness.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Garantía (años)</label>
                <input
                  type="number"
                  {...register('warranty', { required: 'La garantía es requerida', min: 1 })}
                  className="input"
                />
                {errors.warranty && <span className="error-text">{errors.warranty.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Tecnología</label>
                <select
                  {...register('technology', { required: 'La tecnología es requerida' })}
                  className="input"
                >
                  <option value="">Seleccionar tecnología</option>
                  <option value="Monocristalino">Monocristalino</option>
                  <option value="Policristalino">Policristalino</option>
                  <option value="Thin Film">Thin Film</option>
                </select>
                {errors.technology && <span className="error-text">{errors.technology.message}</span>}
              </div>

              <div className="form-group grid-full">
                <label className="label">Certificaciones</label>
                <input
                  {...register('certification', { required: 'Las certificaciones son requeridas' })}
                  placeholder="Ej: IEC 61215, IEC 61730"
                  className="input"
                />
                {errors.certification && <span className="error-text">{errors.certification.message}</span>}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelForm}
                className="btn btn-secondary"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                <Save size={16} />
                {editingPanel ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Marca</th>
              <th className="table-header-cell">Modelo</th>
              <th className="table-header-cell">Potencia</th>
              <th className="table-header-cell">Precio</th>
              <th className="table-header-cell">Eficiencia</th>
              <th className="table-header-cell">Tecnología</th>
              <th className="table-header-cell">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {panels.map((panel) => (
              <tr key={panel.id} className="table-row">
                <td className="table-cell">{panel.brand}</td>
                <td className="table-cell">{panel.model}</td>
                <td className="table-cell">{panel.power}W</td>
                <td className="table-cell">${panel.price}</td>
                <td className="table-cell">{panel.efficiency}%</td>
                <td className="table-cell">{panel.technology}</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(panel)}
                      className="btn btn-primary btn-sm"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(panel.id)}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {panels.length === 0 && (
        <div className="empty-state">
          No hay paneles registrados. Agrega el primer panel usando el botón "Agregar Panel".
        </div>
      )}
    </div>
  )
}
```

### `admin-panel/src/components/InvertersManager.tsx`

```tsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { invertersApi } from '../services/api'
import type { Inverter } from '../types/api'

interface InverterFormData {
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
}

export function InvertersManager() {
  const [inverters, setInverters] = useState<Inverter[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingInverter, setEditingInverter] = useState<Inverter | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<InverterFormData>()

  useEffect(() => {
    loadInverters()
  }, [])

  const loadInverters = async () => {
    try {
      setLoading(true)
      const data = await invertersApi.getAll()
      setInverters(data)
    } catch (error) {
      showMessage('error', 'Error al cargar inversores')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const onSubmit = async (data: InverterFormData) => {
    try {
      if (editingInverter) {
        await invertersApi.update(editingInverter.id, data)
        showMessage('success', 'Inversor actualizado exitosamente')
      } else {
        await invertersApi.create(data)
        showMessage('success', 'Inversor creado exitosamente')
      }
      
      reset()
      setShowForm(false)
      setEditingInverter(null)
      loadInverters()
    } catch (error) {
      showMessage('error', 'Error al guardar inversor')
    }
  }

  const handleEdit = (inverter: Inverter) => {
    setEditingInverter(inverter)
    setValue('brand', inverter.brand)
    setValue('model', inverter.model)
    setValue('power', inverter.power)
    setValue('price', inverter.price)
    setValue('type', inverter.type)
    setValue('minVoltage', inverter.minVoltage)
    setValue('maxVoltage', inverter.maxVoltage)
    setValue('efficiency', inverter.efficiency)
    setValue('warranty', inverter.warranty)
    setValue('mpptChannels', inverter.mpptChannels)
    setValue('certification', inverter.certification)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este inversor?')) {
      try {
        await invertersApi.delete(id)
        showMessage('success', 'Inversor eliminado exitosamente')
        loadInverters()
      } catch (error) {
        showMessage('error', 'Error al eliminar inversor')
      }
    }
  }

  const cancelForm = () => {
    reset()
    setShowForm(false)
    setEditingInverter(null)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'string': return 'String'
      case 'micro': return 'Microinversor'
      case 'power': return 'Optimizadores'
      default: return type
    }
  }

  if (loading) {
    return <div className="empty-state">Cargando inversores...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">
          Gestión de Inversores
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary btn-lg"
        >
          <Plus size={20} />
          Agregar Inversor
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="text-xl font-semibold mb-5 text-primary">
            {editingInverter ? 'Editar Inversor' : 'Nuevo Inversor'}
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-auto-fit gap-4 mb-5">
              <div className="form-group">
                <label className="label">Marca</label>
                <input
                  {...register('brand', { required: 'La marca es requerida' })}
                  className="input"
                />
                {errors.brand && <span className="error-text">{errors.brand.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Modelo</label>
                <input
                  {...register('model', { required: 'El modelo es requerido' })}
                  className="input"
                />
                {errors.model && <span className="error-text">{errors.model.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Potencia (W)</label>
                <input
                  type="number"
                  {...register('power', { required: 'La potencia es requerida', min: 1 })}
                  className="input"
                />
                {errors.power && <span className="error-text">{errors.power.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Precio ($)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { required: 'El precio es requerido', min: 0 })}
                  className="input"
                />
                {errors.price && <span className="error-text">{errors.price.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Tipo</label>
                <select
                  {...register('type', { required: 'El tipo es requerido' })}
                  className="input"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="string">String</option>
                  <option value="micro">Microinversor</option>
                  <option value="power">Optimizadores</option>
                </select>
                {errors.type && <span className="error-text">{errors.type.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Voltaje Mínimo (V)</label>
                <input
                  type="number"
                  {...register('minVoltage', { required: 'El voltaje mínimo es requerido', min: 0 })}
                  className="input"
                />
                {errors.minVoltage && <span className="error-text">{errors.minVoltage.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Voltaje Máximo (V)</label>
                <input
                  type="number"
                  {...register('maxVoltage', { required: 'El voltaje máximo es requerido', min: 0 })}
                  className="input"
                />
                {errors.maxVoltage && <span className="error-text">{errors.maxVoltage.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Eficiencia (%)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('efficiency', { required: 'La eficiencia es requerida', min: 0, max: 100 })}
                  className="input"
                />
                {errors.efficiency && <span className="error-text">{errors.efficiency.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Garantía (años)</label>
                <input
                  type="number"
                  {...register('warranty', { required: 'La garantía es requerida', min: 1 })}
                  className="input"
                />
                {errors.warranty && <span className="error-text">{errors.warranty.message}</span>}
              </div>

              <div className="form-group">
                <label className="label">Canales MPPT</label>
                <input
                  type="number"
                  {...register('mpptChannels', { required: 'Los canales MPPT son requeridos', min: 1 })}
                  className="input"
                />
                {errors.mpptChannels && <span className="error-text">{errors.mpptChannels.message}</span>}
              </div>

              <div className="form-group grid-full">
                <label className="label">Certificaciones</label>
                <input
                  {...register('certification', { required: 'Las certificaciones son requeridas' })}
                  placeholder="Ej: IEC 62109-1, IEC 62109-2"
                  className="input"
                />
                {errors.certification && <span className="error-text">{errors.certification.message}</span>}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelForm}
                className="btn btn-secondary"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                <Save size={16} />
                {editingInverter ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Marca</th>
              <th className="table-header-cell">Modelo</th>
              <th className="table-header-cell">Potencia</th>
              <th className="table-header-cell">Precio</th>
              <th className="table-header-cell">Tipo</th>
              <th className="table-header-cell">Eficiencia</th>
              <th className="table-header-cell">Rango V</th>
              <th className="table-header-cell">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inverters.map((inverter) => (
              <tr key={inverter.id} className="table-row">
                <td className="table-cell">{inverter.brand}</td>
                <td className="table-cell">{inverter.model}</td>
                <td className="table-cell">{inverter.power}W</td>
                <td className="table-cell">${inverter.price}</td>
                <td className="table-cell">{getTypeLabel(inverter.type)}</td>
                <td className="table-cell">{inverter.efficiency}%</td>
                <td className="table-cell">{inverter.minVoltage}-{inverter.maxVoltage}V</td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(inverter)}
                      className="btn btn-primary btn-sm"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(inverter.id)}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inverters.length === 0 && (
        <div className="empty-state">
          No hay inversores registrados. Agrega el primer inversor usando el botón "Agregar Inversor".
        </div>
      )}
    </div>
  )
}
```

### `admin-panel/src/types/api.ts`

```typescript
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

```

### `admin-panel/src/services/api.ts`

```typescript
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

```
