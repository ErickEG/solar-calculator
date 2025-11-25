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
