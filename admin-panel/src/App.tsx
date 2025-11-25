import { useState } from 'react'
import { PanelsManager } from './components/PanelsManager'
import { InvertersManager } from './components/InvertersManager'
import { Settings, Sun, Zap } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState<'panels' | 'inverters'>('panels')

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="header px-6 py-4">
        <div className="container flex items-center gap-4">
          <Settings size={32} color="var(--accent)" />
          <h1 className="text-2xl font-bold text-primary">
            Panel de Administración - Solar Calculator
          </h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav px-6">
        <div className="container flex gap-8">
          <button
            onClick={() => setActiveTab('panels')}
            className={`tab ${activeTab === 'panels' ? 'tab-active' : 'tab-inactive'}`}
          >
            <Sun size={20} />
            Paneles Solares
          </button>
          
          <button
            onClick={() => setActiveTab('inverters')}
            className={`tab ${activeTab === 'inverters' ? 'tab-active' : 'tab-inactive'}`}
          >
            <Zap size={20} />
            Inversores
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="container p-6">
        {activeTab === 'panels' && <PanelsManager />}
        {activeTab === 'inverters' && <InvertersManager />}
      </main>
    </div>
  )
}

export default App