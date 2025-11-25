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
