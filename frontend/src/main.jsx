import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, useLocation, useNavigate } from 'react-router-dom'
import './index.css'
import AppLayout from './AppLayout.jsx'
import { TenantProvider } from './contexts/TenantContext'
import { getCurrentTenantId, setCurrentTenantId, resetTenantId } from './config/tenant'

// Screen Components
import ShiftDashboard from './components/screens/shift/ShiftDashboard'
import FirstPlanEditor from './components/screens/shift/FirstPlanEditor'
import SecondPlanEditor from './components/screens/shift/SecondPlanEditor'
import ShiftCreationMethodSelector from './components/screens/shift/ShiftCreationMethodSelector'
import LineShiftInput from './components/screens/shift/LineShiftInput'
import Monitoring from './components/screens/shift/Monitoring'
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
  const navigate = useNavigate()
  return <FirstPlanEditor selectedShift={location.state?.shift} onApprove={() => navigate('/')} />
}

const SecondPlanEditorWrapper = () => {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <SecondPlanEditor
      selectedShift={location.state?.shift}
      onNext={() => navigate('/')}
      onPrev={() => navigate(-1)}
    />
  )
}

// createBrowserRouter でルートを定義（useBlockerが使用可能になる）
const router = createBrowserRouter([
  {
    // ShiftDashboardは独自レイアウト（サイドバー+ヘッダー）を持つのでAppLayoutを使わない
    path: '/',
    element: <ShiftDashboard />,
  },
  {
    element: <AppLayout />,
    children: [
      { path: 'staff', element: <StaffManagement /> },
      { path: 'store', element: <StoreManagement /> },
      { path: 'master', element: <MasterDataManagement /> },
      { path: 'budget-actual', element: <BudgetActualManagement /> },
      { path: 'constraint', element: <ConstraintManagement /> },
      {
        path: 'shift',
        children: [
          { path: 'line', element: <LineShiftInput /> },
          { path: 'monitoring', element: <Monitoring /> },
          { path: 'draft-editor', element: <FirstPlanEditorWrapper /> },
          { path: 'method', element: <ShiftCreationMethodSelector /> },
          { path: 'second-plan', element: <SecondPlanEditorWrapper /> },
        ],
      },
      { path: 'dev-tools', element: <DevTools /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TenantProvider>
      <RouterProvider router={router} />
    </TenantProvider>
  </StrictMode>
)
