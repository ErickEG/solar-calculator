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