import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import './App.css'

// Context Providers
import { TenantProvider } from './contexts/TenantContext'

// Screen Components
import Dashboard from './components/screens/Dashboard'
import FirstPlan from './components/screens/FirstPlan'
import LineShiftInput from './components/screens/LineShiftInput'
import Monitoring from './components/screens/Monitoring'
import SecondPlan from './components/screens/SecondPlan'
import StaffManagement from './components/screens/StaffManagement'
import StoreManagement from './components/screens/StoreManagement'
import ConstraintManagement from './components/screens/ConstraintManagement'
import History from './components/screens/History'
import ShiftManagement from './components/screens/ShiftManagement'
import BudgetActualManagement from './components/screens/BudgetActualManagement'
import DevTools from './dev/DevTools'

// UI Components
import { Button } from './components/ui/button'
import AppHeader from './components/shared/AppHeader'

function AppContent() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showStaffManagement, setShowStaffManagement] = useState(false)
  const [showStoreManagement, setShowStoreManagement] = useState(false)
  const [showConstraintManagement, setShowConstraintManagement] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showShiftManagement, setShowShiftManagement] = useState(false)
  const [showFirstPlanFromShiftMgmt, setShowFirstPlanFromShiftMgmt] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [shiftStatus, setShiftStatus] = useState({
    10: 'not_started', // 10月のステータス
  })
  const [showLineMessages, setShowLineMessages] = useState(false)
  const [showMonitoring, setShowMonitoring] = useState(false)
  const [showBudgetActualManagement, setShowBudgetActualManagement] = useState(false)
  const [showDevTools, setShowDevTools] = useState(false)
  const [showTenantSettings, setShowTenantSettings] = useState(false)
  const [selectedShiftForSecondPlan, setSelectedShiftForSecondPlan] = useState(null)
  const [shiftManagementKey, setShiftManagementKey] = useState(0) // 再マウント用
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。前の画面に戻りますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }

    // 第2案画面からの戻りの場合、シフト管理に戻す（第1案仮承認済みまたは確定済みの場合）
    if (
      currentStep === 2 &&
      (shiftStatus[10] === 'first_plan_approved' || shiftStatus[10] === 'completed')
    ) {
      setCurrentStep(1)
      setShowShiftManagement(true)
      setShowBudgetActualManagement(false)
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = step => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。画面を移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setCurrentStep(step)
  }

  const goToStaffManagement = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。スタッフ管理に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowStaffManagement(true)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowTenantSettings(false)
    setIsMenuOpen(false)
  }

  const goToStoreManagement = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。店舗管理に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowStoreManagement(true)
    setShowStaffManagement(false)
    setShowConstraintManagement(false)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowTenantSettings(false)
    setIsMenuOpen(false)
  }

  const goToConstraintManagement = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。制約管理に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowConstraintManagement(true)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowTenantSettings(false)
    setIsMenuOpen(false)
  }

  const goToDashboard = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。ダッシュボードに移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setCurrentStep(1)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowTenantSettings(false)
    setIsMenuOpen(false)
  }

  const goToHistory = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。履歴画面に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowHistory(true)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setIsMenuOpen(false)
  }

  const goToLineMessages = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。メッセージ画面に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowLineMessages(true)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowHistory(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setIsMenuOpen(false)
  }

  const goToMonitoring = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。モニタリング画面に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowMonitoring(true)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowBudgetActualManagement(false)
    setIsMenuOpen(false)
  }

  const goToBudgetActualManagement = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。予実管理画面に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowBudgetActualManagement(true)
    setShowMonitoring(false)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowDevTools(false)
    setShowTenantSettings(false)
    setIsMenuOpen(false)
  }

  const goToTenantSettings = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。テナント設定に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowTenantSettings(true)
    setShowBudgetActualManagement(false)
    setShowMonitoring(false)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowDevTools(false)
    setIsMenuOpen(false)
  }

  const goToDevTools = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。開発者ツールに移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowDevTools(true)
    setShowBudgetActualManagement(false)
    setShowMonitoring(false)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setIsMenuOpen(false)
  }

  const backFromHistory = () => {
    setShowHistory(false)
  }

  const goToShiftManagement = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。シフト管理に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowShiftManagement(true)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowDevTools(false)
    setIsMenuOpen(false)
  }

  const backFromShiftManagement = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。戻りますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowShiftManagement(false)
  }

  const goToFirstPlanFromShiftMgmt = async (shift) => {
    console.log('goToFirstPlanFromShiftMgmt called with:', shift)

    // shiftオブジェクトから情報を取得
    const status = shift?.status || 'not_started'
    const year = shift?.year || new Date().getFullYear()
    const month = shift?.month || new Date().getMonth() + 1

    if (status === 'completed') {
      // 承認済みの場合は閲覧のみ（履歴画面へ）
      alert('このシフトは確定済みのため、閲覧のみ可能です')
      return
    } else if (status === 'second_plan_approved') {
      // 第2案承認済みの場合は第2案編集画面へ
      setSelectedShiftForSecondPlan(shift)
      setShowShiftManagement(false)
      setCurrentStep(2)
    } else if (status === 'first_plan_approved') {
      // 第1案承認済みの場合は第1案表示または第2案作成へ
      setSelectedShiftForSecondPlan(shift)
      setShowFirstPlanFromShiftMgmt(true)
      setShowShiftManagement(false)
    } else {
      // 未作成の場合は開発者ツール画面に遷移（データ確認・設定のため）
      console.log('未作成シフト - 開発者ツール画面に遷移:', shift)
      setSelectedShiftForSecondPlan(shift)
      setShowDevTools(true)
      setShowShiftManagement(false)
    }
  }

  const backToShiftManagementFromFirstPlan = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。シフト管理に戻りますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowFirstPlanFromShiftMgmt(false)
    setShowShiftManagement(true)
    // データを再読み込みするために再マウント
    setShiftManagementKey(prev => prev + 1)
  }

  const approveFirstPlan = () => {
    // 第1案を仮承認してシフト管理画面に戻る
    setShiftStatus({ ...shiftStatus, 10: 'first_plan_approved' })
    setHasUnsavedChanges(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowShiftManagement(true)
    setShowBudgetActualManagement(false)
  }

  const goToSecondPlanFromFirstPlan = () => {
    // 第1案から修正ボタンで第2案へ
    setShowFirstPlanFromShiftMgmt(false)
    setCurrentStep(2) // 第2案画面へ
  }

  const goToCreateSecondPlan = (shift) => {
    // 第2案作成画面へ
    setSelectedShiftForSecondPlan(shift)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowMonitoring(false)
    setShowHistory(false)
    setShowBudgetActualManagement(false)
    setCurrentStep(2)
  }

  const approveSecondPlan = () => {
    // 第2案を承認・確定してシフト管理画面に戻る
    setShiftStatus({ ...shiftStatus, 10: 'completed' })
    setHasUnsavedChanges(false)
    setCurrentStep(1)
    setShowShiftManagement(true)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowMonitoring(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowBudgetActualManagement(false)
    setShowHistory(false)
    // データを再読み込みするために再マウント
    setShiftManagementKey(prev => prev + 1)
  }

  const renderCurrentScreen = () => {
    if (showStaffManagement) {
      return (
        <StaffManagement
          onHome={goToDashboard}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
      )
    }

    if (showStoreManagement) {
      return (
        <StoreManagement
          onHome={goToDashboard}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
      )
    }

    if (showConstraintManagement) {
      return (
        <ConstraintManagement
          onHome={goToDashboard}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
      )
    }

    if (showHistory) {
      return (
        <History
          onPrev={backFromHistory}
          onHome={goToDashboard}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
      )
    }

    if (showLineMessages) {
      return (
        <LineShiftInput
          shiftStatus={shiftStatus}
          onHome={goToDashboard}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
      )
    }

    if (showMonitoring) {
      return (
        <Monitoring
          onHome={goToDashboard}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
      )
    }

    if (showBudgetActualManagement) {
      return (
        <BudgetActualManagement
          onHome={goToDashboard}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
      )
    }

    if (showDevTools) {
      return (
        <DevTools
          targetYear={selectedShiftForSecondPlan?.year || new Date().getFullYear()}
          targetMonth={selectedShiftForSecondPlan?.month || new Date().getMonth() + 1}
          onHome={goToDashboard}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
      )
    }

    if (showShiftManagement) {
      return (
        <ShiftManagement
          key={shiftManagementKey}
          onPrev={backFromShiftManagement}
          onFirstPlan={goToFirstPlanFromShiftMgmt}
          onCreateShift={goToFirstPlanFromShiftMgmt}
          onCreateSecondPlan={goToCreateSecondPlan}
          shiftStatus={shiftStatus}
          onHome={goToDashboard}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
      )
    }

    if (showFirstPlanFromShiftMgmt) {
      return (
        <FirstPlan
          onNext={goToSecondPlanFromFirstPlan}
          onPrev={backToShiftManagementFromFirstPlan}
          onApprove={approveFirstPlan}
          onMarkUnsaved={() => setHasUnsavedChanges(true)}
          onMarkSaved={() => setHasUnsavedChanges(false)}
          selectedShift={selectedShiftForSecondPlan}
        />
      )
    }

    switch (currentStep) {
      case 1:
        return (
          <Dashboard
            onNext={nextStep}
            onHistory={goToHistory}
            onShiftManagement={goToShiftManagement}
            onMonitoring={goToMonitoring}
            onStaffManagement={goToStaffManagement}
            onStoreManagement={goToStoreManagement}
            onConstraintManagement={goToConstraintManagement}
            onLineMessages={goToLineMessages}
            onBudgetActualManagement={goToBudgetActualManagement}
            onDevTools={goToDevTools}
          />
        )
      case 2:
        return (
          <SecondPlan
            onNext={approveSecondPlan}
            onPrev={prevStep}
            onMarkUnsaved={() => setHasUnsavedChanges(true)}
            onMarkSaved={() => setHasUnsavedChanges(false)}
            selectedShift={selectedShiftForSecondPlan}
          />
        )
      default:
        return (
          <Dashboard
            onNext={nextStep}
            onHistory={goToHistory}
            onShiftManagement={goToShiftManagement}
            onMonitoring={goToMonitoring}
            onStaffManagement={goToStaffManagement}
            onStoreManagement={goToStoreManagement}
            onConstraintManagement={goToConstraintManagement}
            onLineMessages={goToLineMessages}
            onBudgetActualManagement={goToBudgetActualManagement}
            onDevTools={goToDevTools}
          />
        )
    }
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
        <AppHeader
          onHome={goToDashboard}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <div
            key={
              showStaffManagement
                ? 'staff-management'
                : showStoreManagement
                  ? 'store-management'
                  : showConstraintManagement
                    ? 'constraint-management'
                    : showHistory
                      ? 'history'
                      : showShiftManagement
                        ? 'shift-management'
                        : showFirstPlanFromShiftMgmt
                          ? 'first-plan-shift-mgmt'
                          : showBudgetActualManagement
                            ? 'budget-actual-management'
                            : currentStep
            }
          >
            {renderCurrentScreen()}
          </div>
        </AnimatePresence>
      </div>
      </div>
  )
}

function App() {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  )
}

export default App
