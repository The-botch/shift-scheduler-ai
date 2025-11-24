import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { MESSAGES } from './constants/messages'
import { getCurrentYear, getCurrentMonth } from './utils/dateUtils'
import './App.css'

// Context Providers
import { TenantProvider, useTenant } from './contexts/TenantContext'

// Screen Components
import Dashboard from './components/screens/Dashboard'
import FirstPlanEditor from './components/screens/shift/FirstPlanEditor'
import ShiftCreationMethodSelector from './components/screens/shift/ShiftCreationMethodSelector'
import LineShiftInput from './components/screens/shift/LineShiftInput'
import Monitoring from './components/screens/shift/Monitoring'
import StaffManagement from './components/screens/StaffManagement'
import StoreManagement from './components/screens/StoreManagement'
import ConstraintManagement from './components/screens/ConstraintManagement'
import History from './components/screens/shift/History'
import ShiftManagement from './components/screens/shift/ShiftManagement'
import BudgetActualManagement from './components/screens/BudgetActualManagement'
import MasterDataManagement from './components/screens/MasterDataManagement'
import DevTools from './dev/DevTools'

// UI Components
import { Button } from './components/ui/button'
import AppHeader from './components/shared/AppHeader'

function AppContent() {
  const { tenantId } = useTenant()
  const navigate = useNavigate()
  const location = useLocation()

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
  const [shiftManagementKey, setShiftManagementKey] = useState(0) // 再マウント用
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [monitoringInitialMonth, setMonitoringInitialMonth] = useState(null) // Monitoring画面に渡す初期月
  const [monitoringInitialStoreId, setMonitoringInitialStoreId] = useState(null) // Monitoring画面に渡す初期店舗ID

  // 店舗フィルター（ShiftManagementとHistoryで共通）
  const [selectedStore, setSelectedStore] = useState('all')
  const [availableStores, setAvailableStores] = useState([])

  // URLからステートを初期化
  useEffect(() => {
    const path = location.pathname
    if (path === '/') {
      // トップページ → ShiftManagement
      setShowShiftManagement(true)
    } else if (path === '/staff') {
      setShowStaffManagement(true)
    } else if (path === '/store') {
      setShowStoreManagement(true)
    } else if (path === '/master') {
      setShowMasterDataManagement(true)
    } else if (path === '/budget-actual') {
      setShowBudgetActualManagement(true)
    } else if (path === '/shift/line') {
      setShowLineMessages(true)
    } else if (path === '/shift/monitoring') {
      setShowMonitoring(true)
    } else if (path === '/constraint') {
      setShowConstraintManagement(true)
    } else if (path === '/shift/history') {
      setShowHistory(true)
    } else if (path === '/shift/draft-editor') {
      setShowDraftShiftEditor(true)
    } else if (path === '/shift/method') {
      setShowShiftCreationMethodSelector(true)
    } else if (path === '/dev-tools') {
      setShowDevTools(true)
    } else if (path === '/tenant-settings') {
      setShowTenantSettings(true)
    }
  }, [])

  // ステートが変更されたらURLを更新
  useEffect(() => {
    if (showStaffManagement) {
      navigate('/staff', { replace: true })
    } else if (showStoreManagement) {
      navigate('/store', { replace: true })
    } else if (showShiftManagement) {
      navigate('/', { replace: true })
    } else if (showMasterDataManagement) {
      navigate('/master', { replace: true })
    } else if (showBudgetActualManagement) {
      navigate('/budget-actual', { replace: true })
    } else if (showLineMessages) {
      navigate('/shift/line', { replace: true })
    } else if (showMonitoring) {
      navigate('/shift/monitoring', { replace: true })
    } else if (showConstraintManagement) {
      navigate('/constraint', { replace: true })
    } else if (showHistory) {
      navigate('/shift/history', { replace: true })
    } else if (showDraftShiftEditor) {
      navigate('/shift/draft-editor', { replace: true })
    } else if (showShiftCreationMethodSelector) {
      navigate('/shift/method', { replace: true })
    } else if (showDevTools) {
      navigate('/dev-tools', { replace: true })
    } else if (showTenantSettings) {
      navigate('/tenant-settings', { replace: true })
    } else if (
      !showStaffManagement &&
      !showStoreManagement &&
      !showShiftManagement &&
      !showMasterDataManagement &&
      !showBudgetActualManagement &&
      !showLineMessages &&
      !showMonitoring &&
      !showConstraintManagement &&
      !showHistory &&
      !showDraftShiftEditor &&
      !showShiftCreationMethodSelector &&
      !showDevTools &&
      !showTenantSettings &&
      currentStep === 1
    ) {
      navigate('/', { replace: true })
    }
  }, [
    showStaffManagement,
    showStoreManagement,
    showShiftManagement,
    showMasterDataManagement,
    showBudgetActualManagement,
    showLineMessages,
    showMonitoring,
    showConstraintManagement,
    showHistory,
    showDraftShiftEditor,
    showShiftCreationMethodSelector,
    showDevTools,
    showTenantSettings,
    currentStep,
    navigate,
  ])

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

  const goToMonitoring = (initialData = null) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。モニタリング画面に移動しますか？')) {
        return
      }
      setHasUnsavedChanges(false)
    }
    // initialDataがオブジェクトの場合、monthとstoreIdを抽出
    if (initialData && typeof initialData === 'object') {
      setMonitoringInitialMonth(initialData)
      setMonitoringInitialStoreId(initialData.storeId || null)
    } else {
      // 後方互換性のため、nullまたは単純な値の場合は初期月のみ設定
      setMonitoringInitialMonth(initialData)
      setMonitoringInitialStoreId(null)
    }
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

  const goToFirstPlanFromShiftMgmt = async shift => {
    // shiftオブジェクトから情報を取得
    const status = shift?.status || 'not_started'
    const year = shift?.year || getCurrentYear()
    const month = shift?.month || getCurrentMonth()

    if (status === 'completed') {
      // 確定済みの場合は閲覧のみ
      alert(MESSAGES.INFO.VIEW_ONLY)
      return
    } else if ((status === 'APPROVED' && shift.planType === 'FIRST') || status === 'DRAFT') {
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

  const handleDeleteShiftPlan = () => {
    // シフト削除後の処理
    setHasUnsavedChanges(false)
    setShowDraftShiftEditor(false)
    setShowShiftManagement(true)
    // データを再読み込みするために再マウント
    setShiftManagementKey(prev => prev + 1)
  }

  const backToShiftManagementFromMethodSelector = () => {
    setShowShiftCreationMethodSelector(false)
    setShowShiftManagement(true)
  }

  const handleSelectCreationMethod = async methodId => {
    // 作成方法選択後の処理
    if (methodId === 'copy') {
      // 前月コピー（曜日ベース）を実行
      try {
        const year = selectedShiftForEdit?.year || getCurrentYear()
        const month = selectedShiftForEdit?.month || getCurrentMonth()
        const storeId = selectedShiftForEdit?.storeId || selectedShiftForEdit?.store_id || 1

        console.log('[前月コピー] 開始:', { year, month, storeId })

        const response = await fetch('http://localhost:3001/api/shifts/plans/copy-from-previous', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            store_id: storeId,
            target_year: year,
            target_month: month,
            created_by: 1,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          console.error('[前月コピー] エラー:', data)
          alert(`前月のシフトコピーに失敗しました: ${data.error || data.message}`)
          return
        }

        console.log('[前月コピー] 成功:', data)

        // バリデーション結果を確認
        const validation = data.data.validation
        const hasErrors = validation && validation.summary && validation.summary.error > 0
        const hasWarnings = validation && validation.summary && validation.summary.warning > 0

        // メッセージを作成
        let message = `前月のシフトをコピーしました！\n\nコピー元: ${data.data.source_year}年${data.data.source_month}月\nコピー先: ${data.data.target_year}年${data.data.target_month}月\n\nシフト数: ${data.data.inserted_count}件`

        if (data.data.fallback_count > 0) {
          message += `\n（うち第1週にフォールバック: ${data.data.fallback_count}件）`
        }

        if (data.data.skipped_count > 0) {
          message += `\nスキップ: ${data.data.skipped_count}件`
        }

        // 労働基準法チェック結果を追加
        if (validation && validation.summary) {
          message += `\n\n【労働基準法チェック結果】`

          if (hasErrors || hasWarnings) {
            message += `\n⚠️ 制約違反が検出されました`
            if (hasErrors) {
              message += `\n・エラー: ${validation.summary.error}件`
            }
            if (hasWarnings) {
              message += `\n・警告: ${validation.summary.warning}件`
            }

            // 主な違反内容を表示
            if (validation.violations && validation.violations.length > 0) {
              message += `\n\n主な違反内容:`
              const errorViolations = validation.violations
                .filter(v => v.level === 'ERROR')
                .slice(0, 3)
              const warningViolations = validation.violations
                .filter(v => v.level === 'WARNING')
                .slice(0, 3)

              errorViolations.forEach(v => {
                message += `\n❌ ${v.message}`
              })
              warningViolations.forEach(v => {
                message += `\n⚠️ ${v.message}`
              })

              if (validation.violations.length > 6) {
                message += `\n...他${validation.violations.length - 6}件`
              }
            }

            message += `\n\n下書き編集画面で詳細を確認し、修正してください。`
          } else {
            message += `\n✅ 問題なし（労働基準法に準拠）`
            message += `\n\n下書き編集画面で確認できます。`
          }
        }

        alert(message)

        // 下書き編集画面に遷移
        setShowShiftCreationMethodSelector(false)
        setShowDraftShiftEditor(true)
        // データを再読み込みするために再マウント
        setShiftManagementKey(prev => prev + 1)
      } catch (error) {
        console.error('[前月コピー] ネットワークエラー:', error)
        alert(`前月コピー中にエラーが発生しました: ${error.message}`)
      }
    } else if (methodId === 'csv') {
      // CSVインポート -> 下書き編集画面に遷移
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
          initialStoreId={monitoringInitialStoreId}
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
      return <MasterDataManagement onPrev={goToShiftManagement} />
    }

    if (showDevTools) {
      return (
        <DevTools
          targetYear={getCurrentYear()}
          targetMonth={getCurrentMonth()}
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
        <FirstPlanEditor
          selectedShift={selectedShiftForEdit}
          onBack={backToShiftManagementFromDraft}
          onApprove={approveFirstPlan}
          onDelete={handleDeleteShiftPlan}
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
      default:
        return (
          <ShiftManagement
            key={shiftManagementKey}
            onPrev={backFromShiftManagement}
            onFirstPlan={goToFirstPlanFromShiftMgmt}
            onCreateShift={goToFirstPlanFromShiftMgmt}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col overflow-x-hidden w-full max-w-full">
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
      <div className="flex-1 overflow-x-hidden w-full max-w-full">
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
