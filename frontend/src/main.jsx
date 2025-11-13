import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import AppLayout from './AppLayout.jsx'
import { getCurrentTenantId, setCurrentTenantId, resetTenantId } from './config/tenant'

// Screen Components
import ShiftManagement from './components/screens/shift/ShiftManagement'
import FirstPlanEditor from './components/screens/shift/FirstPlanEditor'
import SecondPlanEditor from './components/screens/shift/SecondPlanEditor'
import ShiftCreationMethodSelector from './components/screens/shift/ShiftCreationMethodSelector'
import LineShiftInput from './components/screens/shift/LineShiftInput'
import Monitoring from './components/screens/shift/Monitoring'
import History from './components/screens/shift/History'
import StaffManagement from './components/screens/StaffManagement'
import StoreManagement from './components/screens/StoreManagement'
import ConstraintManagement from './components/screens/ConstraintManagement'
import BudgetActualManagement from './components/screens/BudgetActualManagement'
import MasterDataManagement from './components/screens/MasterDataManagement'
import DevTools from './dev/DevTools'

// デバッグ用: グローバルにテナント設定関数を公開
window.getCurrentTenantId = getCurrentTenantId
window.setCurrentTenantId = setCurrentTenantId
window.resetTenantId = resetTenantId

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<ShiftManagement />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="store" element={<StoreManagement />} />
          <Route path="master" element={<MasterDataManagement />} />
          <Route path="budget-actual" element={<BudgetActualManagement />} />
          <Route path="constraint" element={<ConstraintManagement />} />
          <Route path="shift">
            <Route path="history" element={<History />} />
            <Route path="line" element={<LineShiftInput />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="draft-editor" element={<FirstPlanEditor />} />
            <Route path="method" element={<ShiftCreationMethodSelector />} />
            <Route path="second-plan" element={<SecondPlanEditor />} />
          </Route>
          <Route path="dev-tools" element={<DevTools />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
