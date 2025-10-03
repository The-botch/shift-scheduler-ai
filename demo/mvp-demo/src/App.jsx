import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import './App.css'

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

// UI Components
import { Button } from './components/ui/button'
import { Menu, X, Home, FolderOpen, Users, History as HistoryIcon, MessageSquare, ClipboardList, Store, Shield, Database, TrendingUp } from 'lucide-react'

function App() {
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLineMessages, setShowLineMessages] = useState(false)
  const [showMonitoring, setShowMonitoring] = useState(false)
  const [showBudgetActualManagement, setShowBudgetActualManagement] = useState(false)

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
    if (currentStep === 2 && (shiftStatus[10] === 'first_plan_approved' || shiftStatus[10] === 'completed')) {
      setCurrentStep(1)
      setShowShiftManagement(true)
      setShowBudgetActualManagement(false)
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step) => {
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

  const goToFirstPlanFromShiftMgmt = () => {
    // ステータスに応じて遷移先を変更
    if (shiftStatus[10] === 'completed') {
      // 承認済みの場合は第2案（編集・修正）画面へ
      setShowShiftManagement(false)
      setCurrentStep(2)
    } else if (shiftStatus[10] === 'first_plan_approved') {
      // 第1案仮承認済みの場合は第2案作成（ステップ2）へ
      setShowShiftManagement(false)
      setCurrentStep(2)
    } else {
      // 未作成の場合は第1案作成へ
      setShowFirstPlanFromShiftMgmt(true)
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

  const approveSecondPlan = () => {
    // 第2案を承認・確定して履歴画面に遷移
    setShiftStatus({ ...shiftStatus, 10: 'completed' })
    setHasUnsavedChanges(false)
    setCurrentStep(1)
    setShowShiftManagement(false)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraints(false)
    setShowLineInput(false)
    setShowMonitoring(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowBudgetActualManagement(false)
    setShowHistory(true)
  }

  const renderCurrentScreen = () => {
    if (showStaffManagement) {
      return <StaffManagement />
    }

    if (showStoreManagement) {
      return <StoreManagement />
    }

    if (showConstraintManagement) {
      return <ConstraintManagement />
    }

    if (showHistory) {
      return <History onPrev={backFromHistory} />
    }

    if (showLineMessages) {
      return <LineShiftInput shiftStatus={shiftStatus} />
    }

    if (showMonitoring) {
      return <Monitoring />
    }

    if (showBudgetActualManagement) {
      return <BudgetActualManagement />
    }

    if (showShiftManagement) {
      return <ShiftManagement
        onPrev={backFromShiftManagement}
        onCreateShift={goToFirstPlanFromShiftMgmt}
        shiftStatus={shiftStatus}
      />
    }

    if (showFirstPlanFromShiftMgmt) {
      return <FirstPlan
        onNext={goToSecondPlanFromFirstPlan}
        onPrev={backToShiftManagementFromFirstPlan}
        onApprove={approveFirstPlan}
        onMarkUnsaved={() => setHasUnsavedChanges(true)}
        onMarkSaved={() => setHasUnsavedChanges(false)}
      />
    }

    switch (currentStep) {
      case 1:
        return <Dashboard
          onNext={nextStep}
          onHistory={goToHistory}
          onShiftManagement={goToShiftManagement}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onLineMessages={goToLineMessages}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
      case 2:
        return <SecondPlan onNext={approveSecondPlan} onPrev={prevStep} onMarkUnsaved={() => setHasUnsavedChanges(true)} onMarkSaved={() => setHasUnsavedChanges(false)} />
      default:
        return <Dashboard
          onNext={nextStep}
          onHistory={goToHistory}
          onShiftManagement={goToShiftManagement}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onLineMessages={goToLineMessages}
          onBudgetActualManagement={goToBudgetActualManagement}
        />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* ハンバーガーメニュー */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          size="sm"
          className="bg-white hover:bg-gray-100 text-gray-800 shadow-lg"
          variant="outline"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* メニュードロップダウン */}
      {isMenuOpen && (
        <div className="fixed top-16 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-56">
          <button
            onClick={goToDashboard}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <Home className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">ダッシュボード</span>
          </button>
          <button
            onClick={goToShiftManagement}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <FolderOpen className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">シフト管理</span>
          </button>
          <button
            onClick={goToLineMessages}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">メッセージ管理</span>
          </button>
          <button
            onClick={goToMonitoring}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <ClipboardList className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">シフト希望管理</span>
          </button>
          <button
            onClick={goToStaffManagement}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <Users className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">スタッフ管理</span>
          </button>
          <button
            onClick={goToStoreManagement}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <Store className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">店舗管理</span>
          </button>
          <button
            onClick={goToConstraintManagement}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <Shield className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">制約管理</span>
          </button>
          <button
            onClick={goToBudgetActualManagement}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">予実管理</span>
          </button>
        </div>
      )}

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <div key={
            showStaffManagement ? 'staff-management' :
            showStoreManagement ? 'store-management' :
            showConstraintManagement ? 'constraint-management' :
            showHistory ? 'history' :
            showShiftManagement ? 'shift-management' :
            showFirstPlanFromShiftMgmt ? 'first-plan-shift-mgmt' :
            showBudgetActualManagement ? 'budget-actual-management' :
            currentStep
          }>
            {renderCurrentScreen()}
          </div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
