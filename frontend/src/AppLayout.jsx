import { Outlet } from 'react-router-dom'
import './App.css'

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
