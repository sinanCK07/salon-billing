import { useState } from 'react'
import { SalonSettingsProvider } from './context/SalonSettingsContext'
import { BillHistoryProvider } from './context/BillHistoryContext'
import AppLayout from './components/AppLayout'
import { BillingForm } from './components/BillingForm'
import { HistoryList } from './components/HistoryList'
import { SettingsForm } from './components/SettingsForm'
import { SettingsLock } from './components/SettingsLock'
import { Dashboard } from './components/Dashboard'

// Placeholder components
// All implemented

function App() {
  const [currentView, setCurrentView] = useState<'billing' | 'history' | 'settings' | 'dashboard'>('billing');

  return (
    <SalonSettingsProvider>
      <BillHistoryProvider>
        <AppLayout currentView={currentView} onNavigate={setCurrentView}>
          {currentView === 'dashboard' && (
            <SettingsLock>
              <Dashboard />
            </SettingsLock>
          )}
          {currentView === 'billing' && <BillingForm />}
          {currentView === 'history' && (
            <SettingsLock>
              <HistoryList />
            </SettingsLock>
          )}
          {currentView === 'settings' && (
            <SettingsLock>
              <SettingsForm />
            </SettingsLock>
          )}
        </AppLayout>
      </BillHistoryProvider>
    </SalonSettingsProvider>
  )
}

export default App
