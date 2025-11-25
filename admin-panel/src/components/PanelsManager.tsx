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