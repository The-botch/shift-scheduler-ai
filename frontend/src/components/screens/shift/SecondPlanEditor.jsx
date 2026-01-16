import { useState, useEffect, useRef, useMemo } from 'react'
import { MESSAGES } from '../../../constants/messages'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../ui/button'
import {
  CheckCircle,
  Loader2,
  Save,
  Trash2,
  Download,
  Maximize2,
  Minimize2,
  X,
  MessageSquare,
  Send,
  Users,
  AlertTriangle,
  Zap,
  GripVertical,
  Home,
  Wand2,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { generateMultipleStorePDFs } from '../../../utils/pdfGenerator'
import { Rnd } from 'react-rnd'
import MultiStoreShiftTable from '../../shared/MultiStoreShiftTable'
import ShiftTableView from '../../shared/ShiftTableView'
import TimeInput from '../../shared/TimeInput'
import { ShiftRepository } from '../../../infrastructure/repositories/ShiftRepository'
import { MasterRepository } from '../../../infrastructure/repositories/MasterRepository'
import { getCurrentTenantId } from '../../../config/tenant'
import { isoToJSTDateString } from '../../../utils/dateUtils'
import { useShiftPlanEditor } from '../../../hooks/useShiftPlanEditor'

const shiftRepository = new ShiftRepository()
const masterRepository = new MasterRepository()

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
}

/**
 * 第2案シフト編集画面
 * FirstPlanEditorをベースに、SECOND plan用に特化
 *
 * 主な違い:
 * - planType: 'SECOND'
 * - 第2案がない場合は第1案をコピーして表示（temp_idを付与）
 * - 希望シフトとの突合表示
 * - 比較モード（第1案と第2案の並列表示）
 */
const SecondPlanEditor = ({ selectedShift, onNext, onPrev, mode = 'edit' }) => {
  // 共通フックを使用
  const editor = useShiftPlanEditor({
    planType: 'SECOND',
    selectedShift,
    onPrev,
    onNext,
    mode,
  })

  // 共通フックから取得（状態）
  const {
    loading,
    setLoading,
    calendarData,
    setCalendarData,
    selectedDay,
    setSelectedDay,
    selectedStoreId,
    setSelectedStoreId,
    dayShifts,
    setDayShifts,
    hasSavedDraft,
    setHasSavedDraft,
    windowState,
    setWindowState,
    shiftData,
    setShiftData,
    defaultPatternId,
    setDefaultPatternId,
    preferences,
    setPreferences,
    shiftPatterns,
    setShiftPatterns,
    year,
    month,
    planId,
    planType,
    isViewMode,
    isEditMode,
    preferencesMap,
    timeOverlapInfo,
    // マスタデータ
    staffMap,
    storesMap,
    availableStores,
    selectedStores,
    loadMasterData,
    setSelectedStores,
    // シフト編集
    addedShifts,
    hasUnsavedChanges,
    saving,
    planIds: planIdsState,
    modalState,
    setPlanId: setPlanIdsState,
    handleModifyShift,
    saveChanges,
    setModalState,
    resetChanges,
    setHasUnsavedChanges,
    // ベース関数（ローカルでラップする用）
    handleDeleteShiftBase,
    handleAddShiftBase,
    // ナビゲーション
    navigate,
    navigateToDashboard,
    handleDashboard,
    // ハンドラー（共通）- ローカルで上書きしないものはここから使用
    handleDayClick,
    handleMaximize,
    handleBack,
    handleDelete,
    handleExportCSV,
    // ヘルパー
    updateCalendarData,
  } = editor

  // SecondPlanEditor特有のstate
  const [firstPlanShifts, setFirstPlanShifts] = useState([]) // 第1案（比較表示用）
  const [monthlyComments, setMonthlyComments] = useState([]) // 月次コメント

  // コメントをMapに変換（O(1)検索用）
  const commentsMap = useMemo(() => {
    const map = new Map()
    monthlyComments.forEach(item => {
      map.set(item.staff_id, item.comment)
    })
    return map
  }, [monthlyComments])

  // 表示モード: 'second', 'first', 'compare'
  const [viewMode, setViewMode] = useState('second')

  // 希望シフトとの不一致情報
  const [conflicts, setConflicts] = useState([])
  const [selectedConflict, setSelectedConflict] = useState(null)

  // チャットボット関連
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: '第2案が生成されました。自然言語で修正指示をお聞かせください。',
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)
  const tableContainerRef = useRef(null)
  const [isGeneratingPNG, setIsGeneratingPNG] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const actionsMenuRef = useRef(null)
  const [chatPosition, setChatPosition] = useState({
    x: window.innerWidth - 336,
    y: window.innerHeight - 520,
  })
  const [chatSize, setChatSize] = useState({ width: 320, height: 500 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const chatRef = useRef(null)

  useEffect(() => {
    loadShiftData()
  }, [year, month])

  // アクションメニューを外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setShowActionsMenu(false)
      }
    }
    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showActionsMenu])

  const loadShiftData = async () => {
    try {
      setLoading(true)

      // マスタデータを取得
      const { staffMapping } = await loadMasterData()

      // シフトパターンマスタを取得
      try {
        const patterns = await masterRepository.getShiftPatterns()
        setShiftPatterns(patterns)
      } catch (error) {
        console.error('シフトパターン取得エラー:', error)
      }

      // ========================================
      // ステップ1: 第2案の存在確認
      // ========================================
      const secondPlanShiftsData = await shiftRepository.getShifts({
        year,
        month,
        plan_type: 'SECOND',
      })

      let secondPlanWithStaffInfo
      let firstPlanWithStaffInfo

      if (secondPlanShiftsData.length > 0) {
        // ========================================
        // 第2案が存在する → 編集モード
        // ========================================
        const allPlanIds = [...new Set(secondPlanShiftsData.map(s => s.plan_id).filter(Boolean))]
        if (allPlanIds.length > 0) {
          setPlanIdsState(allPlanIds)
        }

        // pattern_idを取得
        const fetchedPatternId =
          secondPlanShiftsData.length > 0 ? secondPlanShiftsData[0].pattern_id : null
        setDefaultPatternId(fetchedPatternId)

        secondPlanWithStaffInfo = secondPlanShiftsData.map(shift => ({
          ...shift,
          staff_name: staffMapping[shift.staff_id]?.name || '不明',
          role: staffMapping[shift.staff_id]?.role_name || 'スタッフ',
          modified_flag: false,
        }))

        // 第1案は比較表示用に取得
        const firstPlanShiftsData = await shiftRepository.getShifts({
          year,
          month,
          plan_type: 'FIRST',
        })
        firstPlanWithStaffInfo = firstPlanShiftsData.map(shift => ({
          ...shift,
          staff_name: staffMapping[shift.staff_id]?.name || '不明',
          role: staffMapping[shift.staff_id]?.role_name || 'スタッフ',
          modified_flag: false,
        }))
      } else {
        // ========================================
        // 第2案が存在しない → 新規作成モード
        // 第1案をコピーして第2案の初期データとする
        // ========================================

        // ★重要: planIdsStateをクリア（第1案のplan_idを使わない）
        setPlanIdsState([])

        // 第1案を取得
        const firstPlanShiftsData = await shiftRepository.getShifts({
          year,
          month,
          plan_type: 'FIRST',
        })

        // pattern_idを取得
        const fetchedPatternId =
          firstPlanShiftsData.length > 0 ? firstPlanShiftsData[0].pattern_id : null
        setDefaultPatternId(fetchedPatternId)

        firstPlanWithStaffInfo = firstPlanShiftsData.map(shift => ({
          ...shift,
          staff_name: staffMapping[shift.staff_id]?.name || '不明',
          role: staffMapping[shift.staff_id]?.role_name || 'スタッフ',
          modified_flag: false,
        }))

        // ★重要: 第1案をコピーする際、plan_idとshift_idを新しいものに変更
        // これにより、saveChanges()が呼ばれても第1案のシフトは更新されない
        secondPlanWithStaffInfo = firstPlanWithStaffInfo.map((shift, index) => ({
          ...shift,
          plan_id: null, // 第2案用のplan_idはまだ存在しない
          shift_id: `temp_second_${index}_${Date.now()}`, // temp_で始まるIDを付与
          modified_flag: false,
        }))
      }

      // 日付別にグループ化
      const shiftsByDate = {}
      secondPlanWithStaffInfo.forEach(shift => {
        const date = new Date(shift.shift_date)
        const day = date.getDate()
        if (!shiftsByDate[day]) {
          shiftsByDate[day] = []
        }
        shiftsByDate[day].push(shift)
      })

      // 月の情報を計算
      const date = new Date(year, month - 1, 1)
      const daysInMonth = new Date(year, month, 0).getDate()
      const firstDay = date.getDay()

      setCalendarData({
        daysInMonth,
        firstDay,
        shiftsByDate,
        year,
        month,
      })

      setShiftData(secondPlanWithStaffInfo)
      setFirstPlanShifts(firstPlanWithStaffInfo)

      // 希望シフトを取得
      const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      const preferencesData = await shiftRepository.getPreferences({
        dateFrom,
        dateTo,
      })
      setPreferences(preferencesData)

      // 月次コメント取得
      try {
        const comments = await shiftRepository.getMonthlyComments({
          year,
          month,
        })
        setMonthlyComments(comments)
      } catch (error) {
        console.error('月次コメント取得エラー:', error)
        setMonthlyComments([])
      }

      // 希望シフトとの突合チェック
      checkPreferenceConflicts(secondPlanWithStaffInfo, preferencesData, staffMapping)

      // DB読み込み完了後は未保存変更なし状態にリセット
      resetChanges()

      setLoading(false)
    } catch (err) {
      console.error('データ読み込みエラー:', err)
      setLoading(false)
      alert(MESSAGES.ERROR.SHIFT_DATA_LOAD_FAILED)
    }
  }

  // 希望シフトとの突合チェック
  const checkPreferenceConflicts = (shifts, prefs, staffMapping) => {
    const newConflicts = []
    const daysInMonth = new Date(year, month, 0).getDate()

    // スタッフごとの希望日をマップに変換
    const staffPreferencesMap = {}
    prefs.forEach(pref => {
      if (!staffPreferencesMap[pref.staff_id]) {
        staffPreferencesMap[pref.staff_id] = {
          preferredDays: new Set(),
          ngDays: new Set(),
        }
      }
      const dateStr = isoToJSTDateString(pref.preference_date)
      if (pref.is_ng) {
        staffPreferencesMap[pref.staff_id].ngDays.add(dateStr)
      } else {
        staffPreferencesMap[pref.staff_id].preferredDays.add(dateStr)
      }
    })

    // 日付ごとにチェック
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayShifts = shifts.filter(s => s.shift_date && s.shift_date.startsWith(dateStr))

      dayShifts.forEach(shift => {
        const staffPref = staffPreferencesMap[shift.staff_id]
        const staffName = staffMapping[shift.staff_id]?.name || `スタッフID: ${shift.staff_id}`

        if (!staffPref) {
          newConflicts.push({
            date: day,
            staffId: shift.staff_id,
            staffName: staffName,
            type: 'NO_PREFERENCE',
            message: '希望シフト未登録',
          })
        } else {
          if (staffPref.ngDays.has(dateStr)) {
            newConflicts.push({
              date: day,
              staffId: shift.staff_id,
              staffName: staffName,
              type: 'NG_DAY',
              message: 'NG希望の日に配置',
            })
          } else if (staffPref.preferredDays.size > 0 && !staffPref.preferredDays.has(dateStr)) {
            newConflicts.push({
              date: day,
              staffId: shift.staff_id,
              staffName: staffName,
              type: 'NOT_PREFERRED',
              message: '希望日以外に配置',
            })
          }
        }
      })
    }

    setConflicts(newConflicts)

    // メッセージに追加
    if (newConflicts.length > 0) {
      const ngCount = newConflicts.filter(c => c.type === 'NG_DAY').length
      const notPreferredCount = newConflicts.filter(c => c.type === 'NOT_PREFERRED').length
      const noPreferenceCount = newConflicts.filter(c => c.type === 'NO_PREFERENCE').length
      const problemDatesSet = new Set(newConflicts.map(c => c.date))

      const warningContent = `⚠️ 希望との不一致が${newConflicts.length}件あります\n・NG日に配置: ${ngCount}件\n・希望日以外に配置: ${notPreferredCount}件\n・希望シフト未登録: ${noPreferenceCount}件`
      setMessages(prev => {
        const isDuplicate = prev.some(msg => msg.content === warningContent)
        if (isDuplicate) return prev
        return [
          ...prev,
          {
            id: prev.length + 1,
            type: 'system',
            content: warningContent,
            time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          },
        ]
      })
    }
  }

  // 日表示を閉じる（ローカルヘルパー）
  const closeDayView = () => {
    setSelectedDay(null)
    setSelectedStoreId(null)
    setDayShifts([])
  }

  // 下書き保存ハンドラー - FirstPlanEditorと同じ構造
  const handleSaveDraft = async () => {
    if (!confirm('下書きを保存しますか？')) {
      return
    }

    try {
      // 第2案がまだ保存されていない場合（planIdsStateが空）
      if (planIdsState.length === 0) {
        // shiftDataを店舗ごとにグループ化
        const storeShiftsMap = {}
        shiftData.forEach(shift => {
          const storeId = shift.store_id
          if (!storeShiftsMap[storeId]) {
            storeShiftsMap[storeId] = []
          }
          storeShiftsMap[storeId].push({
            staff_id: shift.staff_id,
            shift_date: shift.shift_date,
            pattern_id: shift.pattern_id || defaultPatternId,
            start_time: shift.start_time,
            end_time: shift.end_time,
            break_minutes: shift.break_minutes || 0,
          })
        })

        const stores = Object.entries(storeShiftsMap).map(([storeId, shifts]) => ({
          store_id: parseInt(storeId),
          shifts,
        }))

        // SECONDプランを一括作成
        const result = await shiftRepository.createPlansWithShifts({
          target_year: year,
          target_month: month,
          created_by: 1,
          stores,
          plan_type: 'SECOND',
        })

        if (result.data?.errors?.length > 0) {
          console.error('プラン作成でエラーが発生しました:', result.data.errors)
          const errorMessages = result.data.errors
            .map(e => `店舗${e.store_id}: ${e.error}`)
            .join('\n')
          throw new Error(`プラン作成でエラーが発生しました:\n${errorMessages}`)
        }

        if (!result.success || !result.data?.created_plans?.length) {
          throw new Error('プランの作成に失敗しました。作成されたプランがありません。')
        }

        setHasSavedDraft(true)
        setHasUnsavedChanges(false)
        alert(MESSAGES.SUCCESS.SAVED)

        // 新規プラン作成後はトップ画面に戻る
        navigateToDashboard()
      } else {
        // 既存のプラン編集の場合
        if (!hasUnsavedChanges) {
          alert(MESSAGES.SUCCESS.NO_CHANGES)
          return
        }

        const result = await saveChanges()
        if (result.success) {
          setHasSavedDraft(true)
          alert(MESSAGES.SUCCESS.SAVED)
          await loadShiftData()
        } else {
          throw new Error(result.message)
        }
      }
    } catch (error) {
      console.error('下書き保存エラー:', error)
      alert(`下書きの保存に失敗しました\n\nエラー: ${error.message}`)
    }
  }

  // 承認ハンドラー
  const handleApprove = async () => {
    // 第2案がまだ保存されていない場合
    if (planIdsState.length === 0) {
      if (!confirm('第2案を承認しますか？\n（まだ保存されていないため、保存してから承認します）')) {
        return
      }

      try {
        // shiftDataを店舗ごとにグループ化
        const storeShiftsMap = {}
        shiftData.forEach(shift => {
          const storeId = shift.store_id
          if (!storeShiftsMap[storeId]) {
            storeShiftsMap[storeId] = []
          }
          storeShiftsMap[storeId].push({
            staff_id: shift.staff_id,
            shift_date: shift.shift_date,
            pattern_id: shift.pattern_id || defaultPatternId,
            start_time: shift.start_time,
            end_time: shift.end_time,
            break_minutes: shift.break_minutes || 0,
          })
        })

        const stores = Object.entries(storeShiftsMap).map(([storeId, shifts]) => ({
          store_id: parseInt(storeId),
          shifts,
        }))

        const result = await shiftRepository.createPlansWithShifts({
          target_year: year,
          target_month: month,
          created_by: 1,
          stores,
          plan_type: 'SECOND',
        })

        if (!result.success || !result.data?.created_plans?.length) {
          throw new Error('プランの作成に失敗しました')
        }

        const createdPlanIds = result.data.created_plans.map(p => p.plan_id)

        for (const id of createdPlanIds) {
          await shiftRepository.updatePlanStatus(id, 'APPROVED')
        }

        setHasSavedDraft(true)
        alert(MESSAGES.SUCCESS.APPROVE_SECOND_PLAN)
        if (onNext) {
          onNext()
        }
      } catch (error) {
        console.error('承認処理エラー:', error)
        alert(`承認処理に失敗しました\n\nエラー: ${error.message}`)
      }
      return
    }

    // 既存プランの場合
    const confirmMessage = hasUnsavedChanges
      ? '未保存の変更を保存して承認します。よろしいですか？'
      : '第2案を承認しますか？'

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      if (hasUnsavedChanges) {
        const saveResult = await saveChanges()
        if (!saveResult.success) {
          throw new Error(saveResult.message)
        }
      }

      for (const id of planIdsState) {
        await shiftRepository.updatePlanStatus(id, 'APPROVED')
      }

      setHasSavedDraft(true)
      alert(MESSAGES.SUCCESS.APPROVE_SECOND_PLAN)
      if (onNext) {
        onNext()
      }
    } catch (error) {
      console.error('承認処理エラー:', error)
      alert(`承認処理に失敗しました\n\nエラー: ${error.message}`)
    }
  }

  // シフト更新ハンドラー
  const handleUpdateShift = (shiftId, updates) => {
    const updateUI = () => {
      setCalendarData(prev => {
        if (!prev) return prev
        const updatedShiftsByDate = { ...prev.shiftsByDate }
        Object.keys(updatedShiftsByDate).forEach(day => {
          updatedShiftsByDate[day] = updatedShiftsByDate[day].map(shift => {
            if (shift.shift_id === shiftId) {
              return { ...shift, ...updates, modified_flag: true }
            }
            return shift
          })
        })
        return { ...prev, shiftsByDate: updatedShiftsByDate }
      })

      setShiftData(prev =>
        prev.map(shift =>
          shift.shift_id === shiftId ? { ...shift, ...updates, modified_flag: true } : shift
        )
      )

      if (selectedDay) {
        setDayShifts(prev =>
          prev.map(shift =>
            shift.shift_id === shiftId ? { ...shift, ...updates, modified_flag: true } : shift
          )
        )
      }
    }

    handleModifyShift(shiftId, updates, updateUI)
  }

  // シフト削除ハンドラー
  // 削除成功時はtrue、キャンセル時はfalseを返す
  const handleDeleteShift = shiftId => {
    // 削除確認
    if (!window.confirm('このシフトを削除しますか？')) return false

    const updateUI = () => {
      setCalendarData(prev => {
        if (!prev) return prev
        const updatedShiftsByDate = { ...prev.shiftsByDate }
        Object.keys(updatedShiftsByDate).forEach(day => {
          updatedShiftsByDate[day] = updatedShiftsByDate[day].filter(
            shift => shift.shift_id !== shiftId
          )
        })
        return { ...prev, shiftsByDate: updatedShiftsByDate }
      })

      setShiftData(prev => prev.filter(shift => shift.shift_id !== shiftId))

      if (selectedDay) {
        const updatedShifts = dayShifts.filter(s => s.shift_id !== shiftId)
        setDayShifts(updatedShifts)
        if (updatedShifts.length === 0) {
          closeDayView()
        }
      }
    }

    handleDeleteShiftBase(shiftId, updateUI)
    return true
  }

  // シフト追加ハンドラー - FirstPlanEditorと同じ構造
  const handleAddShift = newShiftData => {
    const staffInfo = staffMap[newShiftData.staff_id] || { name: '不明', role_name: 'スタッフ' }

    const dynamicPatternId =
      modalState.selectedPattern?.pattern_id ||
      defaultPatternId ||
      (shiftData.length > 0 ? shiftData[0].pattern_id : null) ||
      (shiftPatterns.length > 0 ? shiftPatterns[0].pattern_id : 1)

    // ★重要: planIdは現在の第2案のplanId（存在しない場合はnull）
    // getCurrentTenantId()でテナントIDを取得
    const currentPlanId = planIdsState.length > 0 ? planIdsState[0] : null

    const shiftDataToAdd = {
      tenant_id: getCurrentTenantId(),
      store_id: newShiftData.store_id,
      plan_id: currentPlanId,
      staff_id: newShiftData.staff_id,
      shift_date: newShiftData.date || newShiftData.shift_date,
      pattern_id: dynamicPatternId,
      start_time: newShiftData.start_time,
      end_time: newShiftData.end_time,
      break_minutes: newShiftData.break_minutes || 0,
      is_preferred: false,
      staff_name: staffInfo.name,
      role: staffInfo.role_name,
      modified_flag: true,
    }

    const updateUI = newShift => {
      const date = new Date(newShift.shift_date)
      const day = date.getDate()

      setCalendarData(prev => {
        if (!prev) return prev
        const updatedShiftsByDate = { ...prev.shiftsByDate }
        if (!updatedShiftsByDate[day]) {
          updatedShiftsByDate[day] = []
        }
        updatedShiftsByDate[day].push(newShift)
        return { ...prev, shiftsByDate: updatedShiftsByDate }
      })

      setShiftData(prev => [...prev, newShift])

      if (selectedDay === day) {
        setDayShifts(prev => [...prev, newShift])
      }
    }

    handleAddShiftBase(shiftDataToAdd, updateUI)
  }

  // セルクリック時のハンドラー
  const handleShiftClick = ({ mode, shift, date, staffId, storeId, event }) => {
    const rect = event?.target.getBoundingClientRect()
    const position = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    const formattedDate =
      typeof date === 'string' && date.includes('-')
        ? date
        : `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`

    if (mode === 'add') {
      const staffStoreId = staffMap[staffId]?.store_id
      const storeData =
        storesMap instanceof Map
          ? storesMap.get(parseInt(staffStoreId))
          : storesMap[parseInt(staffStoreId)]

      setModalState({
        isOpen: true,
        mode: 'add',
        shift: {
          date: formattedDate,
          staff_id: staffId,
          store_id: staffStoreId,
          staff_name: staffMap[staffId]?.name || '不明',
          store_name: storeData?.store_name || '不明',
        },
        position,
      })
    } else {
      setModalState({
        isOpen: true,
        mode: 'edit',
        shift: { ...shift, date: shift.date || formattedDate },
        position,
      })
    }
  }

  const handleModalSave = timeData => {
    if (modalState.mode === 'add') {
      handleAddShift({ ...modalState.shift, ...timeData })
    } else {
      handleUpdateShift(modalState.shift.shift_id, timeData)
    }
    setModalState({ isOpen: false, mode: 'add', shift: null, position: { x: 0, y: 0 } })
  }

  const handleModalDelete = () => {
    const deleted = handleDeleteShift(modalState.shift.shift_id)
    if (deleted) {
      setModalState({ isOpen: false, mode: 'add', shift: null, position: { x: 0, y: 0 } })
    }
  }

  // 店舗ごとのシフト画像出力機能
  const handlePNGExport = async () => {
    if (selectedStores.size === 0) {
      alert('画像出力する店舗を選択してください')
      return
    }

    setIsGeneratingPNG(true)

    try {
      const count = await generateMultipleStorePDFs({
        year,
        month,
        shiftData,
        staffMap,
        storesMap,
        selectedStores,
        deadlineText: '', // 必要に応じて締切テキストを設定
      })
      alert(`${count}件のシフト画像を保存しました`)
    } catch (error) {
      console.error('シフト画像生成エラー:', error)
      alert(`シフト画像の生成に失敗しました: ${error.message}`)
    } finally {
      setIsGeneratingPNG(false)
    }
  }

  // アルバイト希望シフト一括反映
  const handleBulkApplyPreferences = () => {
    // アルバイトかどうかを判定
    const isPartTimeStaff = staffId => {
      const staff = staffMap[staffId]
      return staff && (staff.employment_type === 'PART_TIME' || staff.employment_type === 'PART')
    }

    // アルバイトスタッフのIDリスト
    const partTimeStaffIds = Object.keys(staffMap)
      .filter(id => isPartTimeStaff(parseInt(id)))
      .map(id => parseInt(id))

    if (partTimeStaffIds.length === 0) {
      alert('アルバイトスタッフが見つかりません')
      return
    }

    // 希望シフト（NG以外）を持つアルバイト
    const partTimePreferences = preferences.filter(
      pref => partTimeStaffIds.includes(pref.staff_id) && !pref.is_ng
    )

    const staffWithPreferences = new Set(partTimePreferences.map(p => p.staff_id))

    if (!window.confirm(`アルバイトの希望シフトを一括反映しますか？\n\n・希望シフトがある ${staffWithPreferences.size}名分を更新\n\n※保存するまでDBには反映されません`)) {
      return
    }

    const currentPlanId = planIdsState.length > 0 ? planIdsState[0] : null

    // 1. 削除対象のアルバイトシフト
    const partTimeShiftsToDelete = shiftData.filter(shift => isPartTimeStaff(shift.staff_id))

    // 2. 追加する新規シフトを生成
    const newShifts = []
    partTimePreferences.forEach((pref, index) => {
      const staffInfo = staffMap[pref.staff_id]
      if (!staffInfo) return

      const prefDate = new Date(pref.preference_date)
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(prefDate.getDate()).padStart(2, '0')}`

      const newShift = {
        shift_id: `temp_bulk_${pref.staff_id}_${dateStr}_${index}_${Date.now()}`,
        tenant_id: getCurrentTenantId(),
        store_id: staffInfo.store_id,
        plan_id: currentPlanId,
        staff_id: pref.staff_id,
        shift_date: dateStr,
        pattern_id: defaultPatternId || (shiftPatterns.length > 0 ? shiftPatterns[0].pattern_id : 1),
        start_time: pref.start_time || '09:00',
        end_time: pref.end_time || '17:00',
        break_minutes: pref.break_minutes || 0,
        staff_name: staffInfo.name || '不明',
        role: staffInfo.role_name || 'スタッフ',
        modified_flag: true,
      }
      newShifts.push(newShift)
    })

    // 3. トラッキング機構に登録（保存時にAPIに反映）
    partTimeShiftsToDelete.forEach(shift => {
      handleDeleteShiftBase(shift.shift_id, null)
    })
    newShifts.forEach(shift => {
      handleAddShiftBase(shift, null)
    })

    // 4. UI状態を更新
    const nonPartTimeShifts = shiftData.filter(shift => !isPartTimeStaff(shift.staff_id))
    const updatedShiftData = [...nonPartTimeShifts, ...newShifts]

    // shiftData更新
    setShiftData(updatedShiftData)

    // calendarData更新
    const shiftsByDate = {}
    updatedShiftData.forEach(shift => {
      const date = new Date(shift.shift_date)
      const day = date.getDate()
      if (!shiftsByDate[day]) {
        shiftsByDate[day] = []
      }
      shiftsByDate[day].push(shift)
    })
    setCalendarData(prev => ({ ...prev, shiftsByDate }))

    alert(`一括反映しました（${newShifts.length}件）`)
  }

  // チャット関連ハンドラー
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  const handleChatDragStart = e => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y,
    })
  }

  const handleChatDrag = e => {
    if (isDragging) {
      setChatPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleChatDragEnd = () => {
    setIsDragging(false)
  }

  const handleResizeStart = e => {
    e.stopPropagation()
    setIsResizing(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleResize = e => {
    if (isResizing) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      setChatSize({
        width: Math.max(280, chatSize.width + deltaX),
        height: Math.max(300, chatSize.height + deltaY),
      })
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleChatDrag)
      window.addEventListener('mouseup', handleChatDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleChatDrag)
        window.removeEventListener('mouseup', handleChatDragEnd)
      }
    }
  }, [isDragging, dragStart, chatPosition])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize)
      window.addEventListener('mouseup', handleResizeEnd)
      return () => {
        window.removeEventListener('mousemove', handleResize)
        window.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizing, dragStart, chatSize])

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || inputValue
    if (!textToSend.trim()) return

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      content: textToSend,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setIsTyping(true)
    scrollToBottom()

    try {
      const systemPrompt = `あなたはシフト管理アシスタントです。現在、第2案を作成中です。
年月: ${year}年${month}月
ユーザーの質問に答え、必要に応じてシフトの修正を提案してください。`

      const response = await fetch('http://localhost:3001/api/openai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-5).map(m => ({
              role: m.type === 'user' ? 'user' : 'assistant',
              content: m.content,
            })),
            { role: 'user', content: textToSend },
          ],
          temperature: 0.7,
        }),
      })

      const data = await response.json()
      const aiContent = data.choices[0].message.content

      const aiResponse = {
        id: messages.length + 2,
        type: 'assistant',
        content: aiContent,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
      scrollToBottom()
    } catch (error) {
      console.error('ChatGPT API呼び出しエラー:', error)
      const aiResponse = {
        id: messages.length + 2,
        type: 'assistant',
        content: `エラーが発生しました: ${error.message}`,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
      scrollToBottom()
    }
  }

  // シフト編集ポップアップコンポーネント
  const ShiftEditModal = ({
    isOpen,
    onClose,
    mode,
    shift,
    preferencesMap,
    onSave,
    onDelete,
    position,
    availableStores,
    shiftPatterns,
  }) => {
    const [startTime, setStartTime] = useState(shift?.start_time || '')
    const [endTime, setEndTime] = useState(shift?.end_time || '')
    const [breakMinutes, setBreakMinutes] = useState(shift?.break_minutes || 0)
    const [storeId, setStoreId] = useState(shift?.store_id || '')
    const [selectedPatternId, setSelectedPatternId] = useState('')
    const [popupStyle, setPopupStyle] = useState({})
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
      if (shift) {
        setStartTime(shift.start_time || '')
        setEndTime(shift.end_time || '')
        setBreakMinutes(shift.break_minutes || 0)
        setStoreId(shift.store_id || '')
        setSelectedPatternId('')
      }
    }, [shift])

    const handlePatternSelect = patternId => {
      setSelectedPatternId(patternId)
      if (patternId && shiftPatterns) {
        const pattern = shiftPatterns.find(p => p.pattern_id === Number(patternId))
        if (pattern) {
          setStartTime(pattern.start_time)
          setEndTime(pattern.end_time)
          setBreakMinutes(pattern.break_minutes || 0)
        }
      }
    }

    const handleDragStart = e => {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - popupPosition.x,
        y: e.clientY - popupPosition.y,
      })
    }

    const handleDrag = e => {
      if (isDragging) {
        setPopupPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    }

    const handleDragEnd = () => {
      setIsDragging(false)
    }

    useEffect(() => {
      if (isDragging) {
        window.addEventListener('mousemove', handleDrag)
        window.addEventListener('mouseup', handleDragEnd)
        return () => {
          window.removeEventListener('mousemove', handleDrag)
          window.removeEventListener('mouseup', handleDragEnd)
        }
      }
    }, [isDragging, dragStart, popupPosition])

    useEffect(() => {
      if (isOpen && position) {
        const popupWidth = 320
        const popupHeight = mode === 'edit' ? 320 : 300
        const margin = 20

        let x = position.x
        let y = position.y

        if (x + popupWidth / 2 > window.innerWidth - margin) {
          x = window.innerWidth - popupWidth - margin
        } else if (x - popupWidth / 2 < margin) {
          x = margin
        } else {
          x = x - popupWidth / 2
        }

        if (y + popupHeight > window.innerHeight - margin) {
          y = position.y - popupHeight - 20
          if (y < margin) {
            y = margin
          }
        } else {
          y = position.y - 30
        }

        setPopupPosition({ x, y })
      }
    }, [isOpen, position, mode])

    useEffect(() => {
      setPopupStyle({
        position: 'fixed',
        left: `${popupPosition.x}px`,
        top: `${popupPosition.y}px`,
        zIndex: 10000,
        cursor: isDragging ? 'move' : 'default',
      })
    }, [popupPosition, isDragging])

    // 希望シフトチェック（O(1) Map lookup）
    const checkPreference = () => {
      if (!shift || !preferencesMap || preferencesMap.size === 0) return null
      const dateStr = shift.date
      const key = `${shift.staff_id}_${dateStr}`
      const pref = preferencesMap.get(key)
      if (!pref) return null
      if (pref.is_ng) {
        return 'ng'
      } else {
        return 'preferred'
      }
    }

    // 希望シフト情報を取得（時間帯含む）
    const getPreferenceInfo = () => {
      if (!shift || !preferencesMap || preferencesMap.size === 0) return null
      const dateStr = shift.date
      const key = `${shift.staff_id}_${dateStr}`
      return preferencesMap.get(key)
    }

    const preferenceInfo = getPreferenceInfo()

    const handleSave = () => {
      if (!startTime || !endTime) {
        alert('開始時刻と終了時刻を入力してください')
        return
      }
      if (!storeId) {
        alert('勤務店舗を選択してください')
        return
      }
      if (startTime >= endTime) {
        alert('終了時刻は開始時刻より後にしてください')
        return
      }
      const breakMins = parseInt(breakMinutes) || 0
      if (breakMins < 0) {
        alert('休憩時間は0以上の値を入力してください')
        return
      }

      const prefStatus = checkPreference()
      if (prefStatus === 'ng') {
        const confirmMsg =
          mode === 'add'
            ? 'この日はスタッフのNG日として登録されています。\n本当にシフトを追加しますか？'
            : 'この日はスタッフのNG日として登録されています。\n本当に更新しますか？'
        if (!confirm(confirmMsg)) {
          return
        }
      }

      onSave({
        start_time: startTime,
        end_time: endTime,
        break_minutes: breakMins,
        store_id: parseInt(storeId),
      })
    }

    if (!isOpen || !shift) return null

    return (
      <>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999]"
              onClick={onClose}
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-lg shadow-2xl p-4 w-[320px]"
              style={popupStyle}
              onClick={e => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-between mb-2 cursor-move select-none"
                onMouseDown={handleDragStart}
              >
                <h3 className="text-base font-bold text-gray-800">
                  {mode === 'add' ? 'シフト追加' : 'シフト編集'}
                </h3>
                <button
                  onClick={onClose}
                  onMouseDown={e => e.stopPropagation()}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-2 rounded mb-2 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">スタッフ</span>
                  <span className="font-semibold">{shift.staff_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">日付</span>
                  <span className="font-semibold">{shift.date}</span>
                </div>
                {/* 希望シフト情報表示 */}
                {preferenceInfo && (
                  <div
                    className={`flex justify-between mt-1 pt-1 border-t ${preferenceInfo.is_ng ? 'border-red-200' : 'border-green-200'}`}
                  >
                    <span className="text-gray-600">希望</span>
                    <span
                      className={`font-semibold ${preferenceInfo.is_ng ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {preferenceInfo.is_ng
                        ? 'NG'
                        : preferenceInfo.start_time && preferenceInfo.end_time
                          ? `${preferenceInfo.start_time.slice(0, 5)}-${preferenceInfo.end_time.slice(0, 5)}`
                          : '出勤可'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    勤務店舗 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={storeId}
                    onChange={e => setStoreId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- 店舗を選択 --</option>
                    {availableStores &&
                      availableStores.map(store => (
                        <option key={store.store_id} value={store.store_id}>
                          {store.store_name}
                        </option>
                      ))}
                  </select>
                </div>

                <TimeInput
                  value={startTime}
                  onChange={setStartTime}
                  label="開始時刻"
                  required
                  minHour={5}
                  maxHour={28}
                  minuteStep={15}
                />

                <TimeInput
                  value={endTime}
                  onChange={setEndTime}
                  label="終了時刻"
                  required
                  minHour={5}
                  maxHour={28}
                  minuteStep={15}
                />
              </div>

              <div className="flex gap-2 mt-3">
                {mode === 'edit' && (
                  <Button
                    onClick={onDelete}
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    削除
                  </Button>
                )}
                <div className="flex-1"></div>
                <Button
                  onClick={onClose}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-xs"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  {mode === 'add' ? '追加' : '更新'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  if (loading) {
    return (
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="h-screen overflow-hidden flex flex-col px-4 py-8"
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">データを読み込んでいます...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="h-screen flex flex-col pt-16 overflow-hidden"
    >
      {/* ヘッダー */}
      <div className="mb-2 flex items-center justify-between flex-shrink-0 px-8 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleDashboard}>
            <Home className="h-4 w-4 mr-1" />
            ダッシュボード
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {year}年{month}月のシフト（第2案）
              <span className="text-sm font-normal text-gray-600 ml-3">
                {isViewMode ? '閲覧モード' : '編集可能'}
              </span>
              {isEditMode && hasUnsavedChanges && (
                <span className="text-sm font-semibold text-orange-600 ml-3 animate-pulse">
                  ● 未保存の変更があります
                </span>
              )}
            </h1>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {/* 色分け凡例 */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-200">
            <span className="text-[0.65rem] font-semibold text-gray-600">セル:</span>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 bg-green-50 border border-green-300 rounded"></div>
              <span className="text-[0.65rem] text-gray-700">希望日</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 bg-gray-100 border border-gray-400 rounded"></div>
              <span className="text-[0.65rem] text-gray-700">NG日</span>
            </div>
          </div>

          {/* アクションメニュー（ドロップダウン） */}
          <div className="relative" ref={actionsMenuRef}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="border-gray-300"
            >
              <Settings className="h-4 w-4 mr-1" />
              操作
              <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showActionsMenu ? 'rotate-180' : ''}`} />
            </Button>
            {showActionsMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => { handleExportCSV(); setShowActionsMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2 text-gray-500" />
                  CSVエクスポート
                </button>
                <button
                  onClick={() => { handlePNGExport(); setShowActionsMenu(false); }}
                  disabled={isGeneratingPNG || selectedStores.size === 0}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPNG ? (
                    <Loader2 className="h-4 w-4 mr-2 text-purple-500 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2 text-purple-500" />
                  )}
                  {isGeneratingPNG ? '生成中...' : '店舗別シフト画像DL'}
                </button>
                {isEditMode && (
                  <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => { handleBulkApplyPreferences(); setShowActionsMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 flex items-center"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      アルバイト希望一括反映
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => { handleDelete(); setShowActionsMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {isEditMode && (
            <>
              {/* Issue #165: 時間重複エラー表示 */}
              {timeOverlapInfo.hasOverlap && (
                <div className="relative group flex items-center text-red-600 text-sm mr-2 cursor-help">
                  <span className="mr-1">⚠</span>
                  時間重複あり（{timeOverlapInfo.overlaps.length}件）
                  {/* ホバーで詳細表示 */}
                  <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white border border-red-300 rounded-lg shadow-lg p-3 min-w-[300px] max-w-[400px] z-50">
                    <div className="text-xs text-gray-700 font-medium mb-2 border-b pb-1">
                      重複シフト詳細:
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {timeOverlapInfo.overlaps.map((overlap, idx) => (
                        <div key={idx} className="text-xs bg-red-50 rounded p-2">
                          <div className="font-medium text-gray-800">
                            {overlap.staffName} - {overlap.date}
                          </div>
                          <div className="text-red-600 mt-1">
                            <div>
                              ・{overlap.shift1.store_name}:{' '}
                              {overlap.shift1.start_time?.slice(0, 5)}-
                              {overlap.shift1.end_time?.slice(0, 5)}
                            </div>
                            <div>
                              ・{overlap.shift2.store_name}:{' '}
                              {overlap.shift2.start_time?.slice(0, 5)}-
                              {overlap.shift2.end_time?.slice(0, 5)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <Button
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving || timeOverlapInfo.hasOverlap}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                title={timeOverlapInfo.hasOverlap ? '時間重複があるため保存できません' : ''}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                {saving ? '保存中...' : '下書き保存'}
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={saving || timeOverlapInfo.hasOverlap}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                title={timeOverlapInfo.hasOverlap ? '時間重複があるため承認できません' : ''}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                {saving ? '処理中...' : '第2案承認'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 店舗チェックボックス */}
      <div className="px-8 mb-4">
        <div className="flex flex-wrap gap-3">
          {availableStores.map(store => {
            const storeIdNum = parseInt(store.store_id)
            return (
              <label key={store.store_id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStores.has(storeIdNum)}
                  onChange={e => {
                    const newSelected = new Set(selectedStores)
                    if (e.target.checked) {
                      newSelected.add(storeIdNum)
                    } else {
                      newSelected.delete(storeIdNum)
                    }
                    setSelectedStores(newSelected)
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">{store.store_name}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div ref={tableContainerRef} className="flex-1 overflow-hidden mx-8 mb-4">
        <MultiStoreShiftTable
          year={year}
          month={month}
          shiftData={shiftData}
          staffMap={staffMap}
          storesMap={storesMap}
          selectedStores={selectedStores}
          readonly={isViewMode}
          onAddShift={isEditMode ? handleAddShift : undefined}
          onUpdateShift={isEditMode ? handleUpdateShift : undefined}
          onDeleteShift={isEditMode ? handleDeleteShift : undefined}
          onDayClick={handleDayClick}
          onShiftClick={isEditMode ? handleShiftClick : undefined}
          preferences={preferences}
          conflicts={conflicts}
          onConflictClick={setSelectedConflict}
          showPreferenceColoring={true}
          commentsMap={commentsMap}
        />
      </div>

      {/* タイムライン表示ウィンドウ */}
      {selectedDay && (
        <Rnd
          size={{ width: windowState.width, height: windowState.height }}
          position={{ x: windowState.x, y: windowState.y }}
          onDragStop={(e, d) => {
            setWindowState(prev => ({ ...prev, x: d.x, y: d.y }))
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            setWindowState(prev => ({
              ...prev,
              width: parseInt(ref.style.width),
              height: parseInt(ref.style.height),
              ...position,
            }))
          }}
          minWidth={1000}
          minHeight={400}
          dragHandleClassName="window-header"
          style={{ zIndex: 9999 }}
          resizeHandleStyles={{
            bottom: { cursor: 'ns-resize', height: '8px' },
            right: { cursor: 'ew-resize', width: '8px' },
            bottomRight: { cursor: 'nwse-resize', width: '16px', height: '16px' },
            bottomLeft: { cursor: 'nesw-resize', width: '16px', height: '16px' },
            topRight: { cursor: 'nesw-resize', width: '16px', height: '16px' },
            topLeft: { cursor: 'nwse-resize', width: '16px', height: '16px' },
          }}
        >
          <div className="flex flex-col h-full bg-white rounded-lg shadow-2xl border border-gray-300 overflow-hidden">
            <div className="window-header bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 flex justify-between items-center cursor-move select-none">
              <div className="font-semibold text-sm">
                📅 {month}月{selectedDay}日 -{' '}
                {selectedStoreId === null ? '全店舗' : storesMap[selectedStoreId]?.store_name || ''}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleMaximize}
                  className="hover:bg-blue-700 p-1 rounded transition-colors"
                  title={windowState.isMaximized ? '元のサイズに戻す' : '最大化'}
                >
                  {windowState.isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                  onClick={closeDayView}
                  className="hover:bg-red-600 p-1 rounded transition-colors"
                  title="閉じる"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <ShiftTableView
                date={selectedDay}
                year={year}
                month={month}
                shifts={dayShifts}
                onClose={closeDayView}
                editable={isEditMode}
                onUpdate={isEditMode ? handleUpdateShift : undefined}
                onDelete={isEditMode ? handleDeleteShift : undefined}
                onShiftClick={isEditMode ? handleShiftClick : undefined}
                storesMap={storesMap}
                storeName={
                  selectedStoreId === null ? undefined : storesMap[selectedStoreId]?.store_name
                }
              />
            </div>
          </div>
        </Rnd>
      )}

      {/* チャットボット - 一時的に非表示 */}
      {/* {isChatMinimized ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Button
            onClick={() => setIsChatMinimized(false)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 shadow-2xl flex items-center justify-center"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          ref={chatRef}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200"
          style={{
            left: `${chatPosition.x}px`,
            top: `${chatPosition.y}px`,
            width: `${chatSize.width}px`,
            height: `${chatSize.height}px`,
            cursor: isDragging ? 'move' : 'default',
          }}
        >
          <div
            className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg cursor-move"
            onMouseDown={handleChatDragStart}
          >
            <div className="flex items-center">
              <GripVertical className="h-4 w-4 mr-2 opacity-70" />
              <MessageSquare className="h-5 w-5 mr-2" />
              <span className="font-medium">AI修正アシスタント</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatMinimized(true)}
              className="text-white hover:bg-blue-700 h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col" style={{ height: `${chatSize.height - 60}px` }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(message => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div>{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {message.time}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="修正指示を入力..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                />
                <Button
                  onClick={() => sendMessage()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
            onMouseDown={handleResizeStart}
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #cbd5e1 50%)',
              borderBottomRightRadius: '0.5rem',
            }}
          />
        </motion.div>
      )} */}

      {/* Conflict解消モーダル */}
      <AnimatePresence>
        {selectedConflict && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setSelectedConflict(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl p-6 max-w-lg w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedConflict.date}日 {selectedConflict.staffName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">配置の問題</p>
                </div>
                <button
                  onClick={() => setSelectedConflict(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">
                      {selectedConflict.type === 'NG_DAY' && 'NG日に配置'}
                      {selectedConflict.type === 'NOT_PREFERRED' && '希望日以外に配置'}
                      {selectedConflict.type === 'NO_PREFERENCE' && '希望シフト未登録'}
                    </p>
                    <p className="text-sm text-red-800 mt-1">{selectedConflict.message}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">解決策を選択</h4>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => alert('別のスタッフに変更（実装予定）')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  別のスタッフに変更
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => alert('スタッフに確認（実装予定）')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  スタッフに確認
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300"
                  onClick={() => alert('AIで解消（実装予定）')}
                >
                  <Zap className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="font-semibold text-blue-900">AIで解消</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => {
                    alert('問題を承認しました')
                    setSelectedConflict(null)
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  承知の上で配置
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setSelectedConflict(null)}
                >
                  キャンセル
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* シフト編集ポップアップ */}
      <ShiftEditModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        shift={modalState.shift}
        preferencesMap={preferencesMap}
        position={modalState.position}
        availableStores={availableStores}
        shiftPatterns={shiftPatterns}
        onClose={() =>
          setModalState({ isOpen: false, mode: 'add', shift: null, position: { x: 0, y: 0 } })
        }
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />
    </motion.div>
  )
}

export default SecondPlanEditor
