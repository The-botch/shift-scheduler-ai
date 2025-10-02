import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import './App.css'

// Screen Components
import Dashboard from './components/screens/Dashboard'
import FirstPlan from './components/screens/FirstPlan'
import LineShiftInput from './components/screens/LineShiftInput'
import Monitoring from './components/screens/Monitoring'
import SecondPlan from './components/screens/SecondPlan'
import FinalDistribution from './components/screens/FinalDistribution'
import MasterData from './components/screens/MasterData'
import History from './components/screens/History'
import ShiftManagement from './components/screens/ShiftManagement'

// UI Components
import { Button } from './components/ui/button'
import { Menu, X, Home, FolderOpen, Users, History as HistoryIcon, MessageSquare, ClipboardList } from 'lucide-react'

function App() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showMasterData, setShowMasterData] = useState(false)
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
    if (currentStep > 1) {
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

  const goToMasterData = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。マスターデータ管理に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowMasterData(true)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
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
    setShowMasterData(false)
    setShowShiftManagement(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setIsMenuOpen(false)
  }

  const backFromMasterData = () => {
    setShowMasterData(false)
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
    setShowMasterData(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
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
    setShowMasterData(false)
    setShowHistory(false)
    setShowMonitoring(false)
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
    setShowMasterData(false)
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
    setShowMasterData(false)
    setShowFirstPlanFromShiftMgmt(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
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
  }

  const goToSecondPlanFromFirstPlan = () => {
    // 第1案から修正ボタンで第2案へ
    setShowFirstPlanFromShiftMgmt(false)
    setCurrentStep(2) // 第2案画面へ
  }

  const approveSecondPlan = () => {
    // 第2案を承認・確定してシフト管理画面に戻る
    setShiftStatus({ ...shiftStatus, 10: 'completed' })
    setHasUnsavedChanges(false)
    setCurrentStep(1)
    setShowShiftManagement(true)
  }

  const renderCurrentScreen = () => {
    if (showMasterData) {
      return <MasterData onPrev={backFromMasterData} />
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
        return <Dashboard onNext={nextStep} onMasterData={goToMasterData} onHistory={goToHistory} onShiftManagement={goToShiftManagement} onMonitoring={goToMonitoring} />
      case 2:
        return <SecondPlan onNext={approveSecondPlan} onPrev={prevStep} onMarkUnsaved={() => setHasUnsavedChanges(true)} onMarkSaved={() => setHasUnsavedChanges(false)} />
      case 3:
        return <FinalDistribution onNext={nextStep} onPrev={prevStep} />
      default:
        return <Dashboard onNext={nextStep} onMasterData={goToMasterData} onHistory={goToHistory} onShiftManagement={goToShiftManagement} onMonitoring={goToMonitoring} />
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
            <span className="font-medium text-gray-800">メッセージ</span>
          </button>
          <button
            onClick={goToMonitoring}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <ClipboardList className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">希望回収状況</span>
          </button>
          <button
            onClick={goToMasterData}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <Users className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">マスターデータ</span>
          </button>
          <button
            onClick={goToHistory}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
          >
            <HistoryIcon className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">履歴</span>
          </button>
        </div>
      )}

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <div key={showMasterData ? 'master-data' : showHistory ? 'history' : showShiftManagement ? 'shift-management' : showFirstPlanFromShiftMgmt ? 'first-plan-shift-mgmt' : currentStep}>
            {renderCurrentScreen()}
          </div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
