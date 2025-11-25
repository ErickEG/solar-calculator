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
  
  const response = await axios.get(`${API_URL}/api/panels?${params}`);
  return response.data.data as SolarPanel[];  // Cambiar esta línea
}

export async function getPanelById(id: string) {
  const response = await axios.get(`${API_URL}/api/panels/${id}`);
  return response.data as SolarPanel;
}

export async function createPanel(panel: Omit<SolarPanel, 'id' | 'created_at' | 'updated_at'>) {
  const response = await axios.post(`${API_URL}/api/panels`, panel);
  return response.data as SolarPanel;
}

export async function updatePanel(id: string, panel: Partial<SolarPanel>) {
  const response = await axios.put(`${API_URL}/api/panels/${id}`, panel);
  return response.data as SolarPanel;
}

export async function deletePanel(id: string) {
  await axios.delete(`${API_URL}/api/panels/${id}`);
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
  
  const response = await axios.get(`${API_URL}/api/inverters?${params}`);
  return response.data.data as Inverter[];  // Cambiar esta línea
}

export async function getInverterById(id: string) {
  const response = await axios.get(`${API_URL}/api/inverters/${id}`);
  return response.data as Inverter;
}

export async function createInverter(inverter: Omit<Inverter, 'id' | 'created_at' | 'updated_at'>) {
  const response = await axios.post(`${API_URL}/api/inverters`, inverter);
  return response.data as Inverter;
}

export async function updateInverter(id: string, inverter: Partial<Inverter>) {
  const response = await axios.put(`${API_URL}/api/inverters/${id}`, inverter);
  return response.data as Inverter;
}

export async function deleteInverter(id: string) {
  await axios.delete(`${API_URL}/api/inverters/${id}`);
}

// NUEVAS FUNCIONES para análisis de sistemas
export async function getConsumptionPatterns() {
  const response = await axios.get(`${API_URL}/api/analysis/consumption-patterns`);
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
  const response = await axios.post(`${API_URL}/api/analysis/recommend-system`, data);
  return response.data;
}