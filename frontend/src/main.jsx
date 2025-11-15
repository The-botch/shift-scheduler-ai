import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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

// ラッパーコンポーネント: location.state.shift を selectedShift として渡す
const FirstPlanEditorWrapper = () => {
  const location = useLocation()
  return <FirstPlanEditor selectedShift={location.state?.shift} />
}

const SecondPlanEditorWrapper = () => {
  const location = useLocation()
  return <SecondPlanEditor selectedShift={location.state?.shift} />
}

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
            <Route path="draft-editor" element={<FirstPlanEditorWrapper />} />
            <Route path="method" element={<ShiftCreationMethodSelector />} />
            <Route path="second-plan" element={<SecondPlanEditorWrapper />} />
          </Route>
          <Route path="dev-tools" element={<DevTools />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
