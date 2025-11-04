import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { MESSAGES } from './constants/messages'
import './App.css'

// Context Providers
import { TenantProvider } from './contexts/TenantContext'

// Screen Components
import Dashboard from './components/screens/Dashboard'
import DraftShiftEditor from './components/screens/DraftShiftEditor'
import ShiftCreationMethodSelector from './components/screens/ShiftCreationMethodSelector'
import LineShiftInput from './components/screens/LineShiftInput'
import Monitoring from './components/screens/Monitoring'
import SecondPlan from './components/screens/SecondPlan'
import StaffManagement from './components/screens/StaffManagement'
import StoreManagement from './components/screens/StoreManagement'
import ConstraintManagement from './components/screens/ConstraintManagement'
import History from './components/screens/History'
import ShiftManagement from './components/screens/ShiftManagement'
import BudgetActualManagement from './components/screens/BudgetActualManagement'
import MasterDataManagement from './components/screens/MasterDataManagement'
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
  const [showDraftShiftEditor, setShowDraftShiftEditor] = useState(false)
  const [showShiftCreationMethodSelector, setShowShiftCreationMethodSelector] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [shiftStatus, setShiftStatus] = useState({
    10: 'not_started', // 10月のステータス
  })
  const [showLineMessages, setShowLineMessages] = useState(false)
  const [showMonitoring, setShowMonitoring] = useState(false)
  const [showBudgetActualManagement, setShowBudgetActualManagement] = useState(false)
  const [showMasterDataManagement, setShowMasterDataManagement] = useState(false)
  const [showDevTools, setShowDevTools] = useState(false)
  const [showTenantSettings, setShowTenantSettings] = useState(false)
  const [selectedShiftForEdit, setSelectedShiftForEdit] = useState(null)
  const [selectedShiftForSecondPlan, setSelectedShiftForSecondPlan] = useState(null)
  const [shiftManagementKey, setShiftManagementKey] = useState(0) // 再マウント用
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [monitoringInitialMonth, setMonitoringInitialMonth] = useState(null) // Monitoring画面に渡す初期月

  // 店舗フィルター（ShiftManagementとHistoryで共通）
  const [selectedStore, setSelectedStore] = useState('all')
  const [availableStores, setAvailableStores] = useState([])

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
    setMonitoringInitialMonth(null)
    setShowStaffManagement(true)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowShiftManagement(false)
    setShowDraftShiftEditor(false)
    setShowShiftCreationMethodSelector(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowMasterDataManagement(false)
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
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowMasterDataManagement(false)
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
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowMasterDataManagement(false)
    setShowTenantSettings(false)
    setIsMenuOpen(false)
  }

  const goToDashboard = () => {
    // ダッシュボードは廃止され、シフト管理がホームになった
    goToShiftManagement()
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
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowMasterDataManagement(false)
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
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowHistory(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowMasterDataManagement(false)
    setIsMenuOpen(false)
  }

  const goToMonitoring = (initialMonth = null) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。モニタリング画面に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setMonitoringInitialMonth(initialMonth)
    setShowMonitoring(true)
    setShowShiftManagement(false)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowBudgetActualManagement(false)
    setShowMasterDataManagement(false)
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
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMasterDataManagement(false)
    setShowDevTools(false)
    setShowTenantSettings(false)
    setIsMenuOpen(false)
  }

  const goToMasterDataManagement = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。マスターデータ管理に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowMasterDataManagement(true)
    setShowBudgetActualManagement(false)
    setShowMonitoring(false)
    setShowShiftManagement(false)
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
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMasterDataManagement(false)
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
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMasterDataManagement(false)
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

    // 全てのフラグを確実にリセット
    setMonitoringInitialMonth(null)
    setShowShiftManagement(true)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowDraftShiftEditor(false)
    setShowShiftCreationMethodSelector(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowMasterDataManagement(false)
    setShowDevTools(false)
    setShowTenantSettings(false)
    setIsMenuOpen(false)

    // ステップもリセット（SecondPlan画面から戻る場合のため）
    setCurrentStep(1)

    // ShiftManagementコンポーネントを完全に再マウントして内部状態もリセット
    setShiftManagementKey(prev => prev + 1)
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
      // 確定済みの場合は閲覧のみ
      alert(MESSAGES.INFO.VIEW_ONLY)
      return
    } else if (status === 'second_plan_approved') {
      // 第2案承認済みの場合は第2案画面で編集可能
      goToCreateSecondPlan(shift)
    } else if (status === 'first_plan_approved' || status === 'draft') {
      // 第1案承認済みまたは下書きの場合はカレンダー表示・編集画面へ
      setSelectedShiftForEdit(shift)
      setShowDraftShiftEditor(true)
      setShowShiftManagement(false)
      setShowShiftCreationMethodSelector(false)
    } else {
      // 未作成の場合は作成方法選択画面へ
      setSelectedShiftForEdit(shift)
      setShowShiftCreationMethodSelector(true)
      setShowShiftManagement(false)
      setShowDraftShiftEditor(false)
    }
  }

  const backToShiftManagementFromDraft = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。シフト管理に戻りますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    setShowDraftShiftEditor(false)
    setShowShiftManagement(true)
    // データを再読み込みするために再マウント
    setShiftManagementKey(prev => prev + 1)
  }

  const backToShiftManagementFromMethodSelector = () => {
    setShowShiftCreationMethodSelector(false)
    setShowShiftManagement(true)
  }

  const handleSelectCreationMethod = async (methodId) => {
    // 作成方法選択後の処理
    if (methodId === 'ai') {
      // AI自動生成を実行
      try {
        const year = selectedShiftForEdit?.year || new Date().getFullYear()
        const month = selectedShiftForEdit?.month || new Date().getMonth() + 1

        console.log('[AI自動生成] 開始:', { year, month })

        const response = await fetch('http://localhost:3001/api/shifts/plans/generate-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: 1,
            store_id: 1,
            year,
            month,
            created_by: 1,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('[AI自動生成] エラー:', data)
          alert(`AI自動生成に失敗しました: ${data.error || data.message}`)
          return
        }

        console.log('[AI自動生成] 成功:', data)

        // 制約違反がある場合は警告を表示
        if (data.data.validation && !data.data.validation.is_valid) {
          const errorCount = data.data.validation.error || 0
          const warningCount = data.data.validation.warning || 0
          const message = `AI自動生成が完了しました。\n\nシフト数: ${data.data.shifts_count}件\n\n⚠️ 制約違反が検出されました:\n- エラー: ${errorCount}件\n- 警告: ${warningCount}件\n\n下書き編集画面で確認・修正してください。`
          alert(message)
        } else {
          alert(`AI自動生成が完了しました!\n\nシフト数: ${data.data.shifts_count}件\n\n下書き編集画面で確認できます。`)
        }

        // 下書き編集画面に遷移
        setShowShiftCreationMethodSelector(false)
        setShowDraftShiftEditor(true)
      } catch (error) {
        console.error('[AI自動生成] ネットワークエラー:', error)
        alert(`AI自動生成中にエラーが発生しました: ${error.message}`)
      }
    } else if (methodId === 'manual' || methodId === 'csv') {
      // 手動入力 or CSVインポート -> 下書き編集画面に遷移
      setShowShiftCreationMethodSelector(false)
      setShowDraftShiftEditor(true)
    }
  }

  const approveFirstPlan = () => {
    // 第1案を仮承認してシフト管理画面に戻る
    setShiftStatus({ ...shiftStatus, 10: 'first_plan_approved' })
    setHasUnsavedChanges(false)
    setShowDraftShiftEditor(false)
    setShowShiftManagement(true)
    setShowBudgetActualManagement(false)
    // データを再読み込みするために再マウント
    setShiftManagementKey(prev => prev + 1)
  }

  const goToCreateSecondPlan = (shift) => {
    // 第2案作成画面へ
    setSelectedShiftForSecondPlan(shift)
    setShowShiftManagement(false)
    setShowDraftShiftEditor(false)
    setShowShiftCreationMethodSelector(false)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowConstraintManagement(false)
    setShowMonitoring(false)
    setShowHistory(false)
    setShowLineMessages(false)
    setShowBudgetActualManagement(false)
    setShowDevTools(false)
    setShowTenantSettings(false)
    setCurrentStep(2)
  }

  const approveSecondPlan = () => {
    // 第2案を承認してシフト管理画面に戻る（ステータスはバックエンドで管理）
    setHasUnsavedChanges(false)
    setCurrentStep(1)
    setShowShiftManagement(true)
    setShowStaffManagement(false)
    setShowStoreManagement(false)
    setShowMonitoring(false)
    setShowBudgetActualManagement(false)
    setShowHistory(false)
    // データを再読み込みするために再マウント
    setShiftManagementKey(prev => prev + 1)
  }

  const renderCurrentScreen = () => {
    if (showStaffManagement) {
      return (
        <StaffManagement
          onHome={goToShiftManagement}
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
          onHome={goToShiftManagement}
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
          onHome={goToShiftManagement}
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
          onHome={goToShiftManagement}
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
          onHome={goToShiftManagement}
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
          onHome={goToShiftManagement}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
          initialMonth={monitoringInitialMonth}
        />
      )
    }

    if (showBudgetActualManagement) {
      return (
        <BudgetActualManagement
          onHome={goToShiftManagement}
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

    if (showMasterDataManagement) {
      return (
        <MasterDataManagement
          onPrev={goToShiftManagement}
        />
      )
    }

    if (showDevTools) {
      return (
        <DevTools
          targetYear={selectedShiftForSecondPlan?.year || new Date().getFullYear()}
          targetMonth={selectedShiftForSecondPlan?.month || new Date().getMonth() + 1}
          onHome={goToShiftManagement}
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

    if (showShiftCreationMethodSelector) {
      return (
        <ShiftCreationMethodSelector
          selectedShift={selectedShiftForEdit}
          onBack={backToShiftManagementFromMethodSelector}
          onSelectMethod={handleSelectCreationMethod}
        />
      )
    }

    if (showDraftShiftEditor) {
      return (
        <DraftShiftEditor
          selectedShift={selectedShiftForEdit}
          onBack={backToShiftManagementFromDraft}
          onApprove={approveFirstPlan}
          onCreateSecondPlan={goToCreateSecondPlan}
        />
      )
    }

    // デフォルト画面はシフト管理
    if (!showShiftManagement && currentStep === 1) {
      // 初回表示時は自動的にシフト管理を表示
      setShowShiftManagement(true)
    }

    if (showShiftManagement || currentStep === 1) {
      return (
        <ShiftManagement
          key={shiftManagementKey}
          onPrev={backFromShiftManagement}
          onFirstPlan={goToFirstPlanFromShiftMgmt}
          onCreateShift={goToFirstPlanFromShiftMgmt}
          onCreateSecondPlan={goToCreateSecondPlan}
          shiftStatus={shiftStatus}
          onHome={goToShiftManagement}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
          selectedStore={selectedStore}
          setSelectedStore={setSelectedStore}
          availableStores={availableStores}
          setAvailableStores={setAvailableStores}
        />
      )
    }

    switch (currentStep) {
      case 2:
        return (
          <SecondPlan
            onNext={approveSecondPlan}
            onPrev={prevStep}
            onMarkUnsaved={() => setHasUnsavedChanges(true)}
            onMarkSaved={() => setHasUnsavedChanges(false)}
            selectedShift={selectedShiftForSecondPlan}
            onHome={goToShiftManagement}
            onShiftManagement={goToShiftManagement}
            onLineMessages={goToLineMessages}
            onMonitoring={goToMonitoring}
            onStaffManagement={goToStaffManagement}
            onStoreManagement={goToStoreManagement}
            onConstraintManagement={goToConstraintManagement}
            onBudgetActualManagement={goToBudgetActualManagement}
          />
        )
      default:
        return (
          <ShiftManagement
            key={shiftManagementKey}
            onPrev={backFromShiftManagement}
            onFirstPlan={goToFirstPlanFromShiftMgmt}
            onCreateShift={goToFirstPlanFromShiftMgmt}
            onCreateSecondPlan={goToCreateSecondPlan}
            shiftStatus={shiftStatus}
            onHome={goToShiftManagement}
            onShiftManagement={goToShiftManagement}
            onLineMessages={goToLineMessages}
            onMonitoring={goToMonitoring}
            onStaffManagement={goToStaffManagement}
            onStoreManagement={goToStoreManagement}
            onConstraintManagement={goToConstraintManagement}
            onBudgetActualManagement={goToBudgetActualManagement}
            selectedStore={selectedStore}
            setSelectedStore={setSelectedStore}
            availableStores={availableStores}
            setAvailableStores={setAvailableStores}
          />
        )
    }
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
        <AppHeader
          onHome={goToShiftManagement}
          onShiftManagement={goToShiftManagement}
          onLineMessages={goToLineMessages}
          onMonitoring={goToMonitoring}
          onStaffManagement={goToStaffManagement}
          onStoreManagement={goToStoreManagement}
          onConstraintManagement={goToConstraintManagement}
          onBudgetActualManagement={goToBudgetActualManagement}
          onMasterDataManagement={goToMasterDataManagement}
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
                        : showShiftCreationMethodSelector
                          ? 'shift-creation-method-selector'
                          : showDraftShiftEditor
                            ? 'draft-shift-editor'
                            : showBudgetActualManagement
                              ? 'budget-actual-management'
                              : showMasterDataManagement
                                ? 'master-data-management'
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
