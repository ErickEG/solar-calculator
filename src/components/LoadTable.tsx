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