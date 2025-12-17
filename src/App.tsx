import { useState } from 'react'
import { SalonSettingsProvider } from './context/SalonSettingsContext'
import { BillHistoryProvider } from './context/BillHistoryContext'
import AppLayout from './components/AppLayout'
import { BillingForm } from './components/BillingForm'
import { HistoryList } from './components/HistoryList'
import { SettingsForm } from './components/SettingsForm'

// Placeholder components
// All implemented

function App() {
  const [currentView, setCurrentView] = useState<'billing' | 'history' | 'settings'>('billing');

  return (
    <SalonSettingsProvider>
      <BillHistoryProvider>
        <AppLayout currentView={currentView} onNavigate={setCurrentView}>
          {currentView === 'billing' && <BillingForm />}
          {currentView === 'history' && <HistoryList />}
          {currentView === 'settings' && <SettingsForm />}
        </AppLayout>
      </BillHistoryProvider>
    </SalonSettingsProvider>
  )
}

export default App
