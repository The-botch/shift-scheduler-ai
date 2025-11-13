import { Outlet } from 'react-router-dom'
import { TenantProvider } from './contexts/TenantContext'
import AppHeader from './components/shared/AppHeader'
import './App.css'

function AppLayout() {
  return (
    <TenantProvider>
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main>
          <Outlet />
        </main>
      </div>
    </TenantProvider>
  )
}

export default AppLayout
