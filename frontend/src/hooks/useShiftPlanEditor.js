/**
 * useShiftPlanEditor.js
 * シフトプランエディタ共通Hook
 *
 * FirstPlanEditorとSecondPlanEditorで共通の状態とハンドラーを提供
 */

import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MESSAGES } from '../constants/messages'
import { getCurrentTenantId } from '../config/tenant'
import { BACKEND_API_URL } from '../config/api'
import { isoToJSTDateString } from '../utils/dateUtils'
import { useShiftEditorBase } from './useShiftEditorBase'
import { useShiftEditing } from './useShiftEditing'

/**
 * シフトプランエディタ共通Hook
 * @param {Object} options
 * @param {'FIRST' | 'SECOND'} options.planType - プランタイプ
 * @param {Object} options.selectedShift - 選択されたシフト情報
 * @param {Function} options.onBack - 戻るコールバック（First用）
 * @param {Function} options.onPrev - 前へコールバック（Second用）
 * @param {Function} options.onNext - 次へコールバック（Second用）
 * @param {Function} options.onApprove - 承認完了コールバック
 * @param {Function} options.onDelete - 削除完了コールバック
 * @param {'view' | 'edit'} options.mode - 表示モード
 */
export const useShiftPlanEditor = ({
  planType = 'FIRST',
  selectedShift,
  onBack,
  onPrev,
  onNext,
  onApprove,
  onDelete,
  mode = 'edit',
}) => {
  const navigate = useNavigate()
  const isViewMode = mode === 'view'
  const isEditMode = mode === 'edit'

  // 戻るコールバック（First: onBack, Second: onPrev）
  const goBack = onBack || onPrev

  // 共通ロジック（マスタデータ取得・店舗選択管理）
  const shiftEditorBase = useShiftEditorBase(selectedShift)
  const { staffMap, storesMap, loadMasterData } = shiftEditorBase

  // 共通ロジック（シフト編集・保存・承認）
  const shiftEditing = useShiftEditing({
    planType,
    onApproveComplete: onApprove || onNext,
  })
  const {
    hasUnsavedChanges,
    planIds: planIdsState,
    modalState,
    setPlanId: setPlanIdsState,
    handleDeleteShift: handleDeleteShiftBase,
    handleAddShift: handleAddShiftBase,
    handleModifyShift,
    saveChanges,
    approve: approveBase,
    openModal,
    closeModal,
    resetChanges,
  } = shiftEditing

  // ========================================
  // 共通の状態
  // ========================================
  const [loading, setLoading] = useState(true)
  const [calendarData, setCalendarData] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedStoreId, setSelectedStoreId] = useState(null)
  const [dayShifts, setDayShifts] = useState([])
  const [hasSavedDraft, setHasSavedDraft] = useState(false)

  // カレンダービューのウィンドウ状態
  const [windowState, setWindowState] = useState({
    width: Math.max(window.innerWidth * 0.9, 1200),
    height: window.innerHeight * 0.6,
    x: 50,
    y: 50,
    isMaximized: false,
  })

  // シフトデータ
  const [shiftData, setShiftData] = useState([])
  const [defaultPatternId, setDefaultPatternId] = useState(null)
  const [preferences, setPreferences] = useState([])
  const [shiftPatterns, setShiftPatterns] = useState([])

  // 計算値
  const year = selectedShift?.year || new Date().getFullYear()
  const month = selectedShift?.month || new Date().getMonth() + 1
  const planId =
    selectedShift?.planId ||
    selectedShift?.plan_id ||
    (planIdsState.length > 0 ? planIdsState[0] : null)

  // パフォーマンス最適化: preferences を Map 化（O(1) lookup）
  const preferencesMap = useMemo(() => {
    const map = new Map()
    preferences.forEach(pref => {
      const prefDate = isoToJSTDateString(pref.preference_date)
      const key = `${pref.staff_id}_${prefDate}`
      map.set(key, pref)
    })
    return map
  }, [preferences])

  // Issue #165: 時間重複チェック（複数店舗横断シフト対応）
  const timeOverlapInfo = useMemo(() => {
    const parseTime = timeStr => {
      if (!timeStr) return 0
      const parts = timeStr.split(':').map(Number)
      return parts[0] * 60 + parts[1]
    }

    const isOverlap = (shift1, shift2) => {
      const s1Start = parseTime(shift1.start_time)
      const s1End = parseTime(shift1.end_time)
      const s2Start = parseTime(shift2.start_time)
      const s2End = parseTime(shift2.end_time)
      return !(s1End <= s2Start || s2End <= s1Start)
    }

    // 同一スタッフ・同一日のシフトをグループ化
    const groupedByStaffDate = {}
    shiftData.forEach(shift => {
      const key = `${shift.staff_id}_${shift.shift_date}`
      if (!groupedByStaffDate[key]) {
        groupedByStaffDate[key] = []
      }
      groupedByStaffDate[key].push(shift)
    })

    // 重複を検出
    const overlaps = new Set()
    Object.values(groupedByStaffDate).forEach(shifts => {
      if (shifts.length > 1) {
        for (let i = 0; i < shifts.length; i++) {
          for (let j = i + 1; j < shifts.length; j++) {
            if (isOverlap(shifts[i], shifts[j])) {
              overlaps.add(shifts[i].shift_id)
              overlaps.add(shifts[j].shift_id)
            }
          }
        }
      }
    })

    return {
      hasOverlap: overlaps.size > 0,
      overlappingShiftIds: overlaps,
    }
  }, [shiftData])

  // ========================================
  // 共通のナビゲーション
  // ========================================
  const navigateToDashboard = useCallback(() => {
    navigate('/', {
      state: {
        year: selectedShift?.year,
        month: selectedShift?.month,
      },
    })
  }, [navigate, selectedShift?.year, selectedShift?.month])

  const handleDashboard = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!window.confirm('変更が保存されていません。ダッシュボードに戻りますか？')) {
        return
      }
    }
    navigateToDashboard()
  }, [hasUnsavedChanges, navigateToDashboard])

  // ========================================
  // 共通のハンドラー
  // ========================================

  // 日付クリック
  const handleDayClick = useCallback(
    (day, storeId = null) => {
      let dayShiftsData = calendarData?.shiftsByDate[day] || []

      if (storeId) {
        dayShiftsData = dayShiftsData.filter(shift => shift.store_id === storeId)
      }

      setSelectedDay(day)
      setSelectedStoreId(storeId)
      setDayShifts(dayShiftsData)
    },
    [calendarData]
  )

  // ウィンドウ最大化
  const handleMaximize = useCallback(() => {
    setWindowState(prev => {
      if (prev.isMaximized) {
        return {
          width: Math.max(window.innerWidth * 0.9, 1200),
          height: window.innerHeight * 0.6,
          x: 50,
          y: 50,
          isMaximized: false,
        }
      }
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        x: 0,
        y: 0,
        isMaximized: true,
      }
    })
  }, [])

  // 下書き保存
  const handleSaveDraft = useCallback(async () => {
    if (!confirm('下書きを保存しますか？')) {
      return
    }

    try {
      if (!hasUnsavedChanges) {
        alert('保存する変更がありません')
        return
      }

      const result = await saveChanges()
      if (result.success) {
        setHasSavedDraft(true)
        alert('下書きを保存しました')
      } else {
        alert(`保存に失敗しました: ${result.message}`)
      }
    } catch (error) {
      console.error('下書き保存エラー:', error)
      alert(`保存中にエラーが発生しました: ${error.message}`)
    }
  }, [hasUnsavedChanges, saveChanges])

  // 承認
  const handleApprove = useCallback(async () => {
    const confirmMessage =
      planType === 'FIRST'
        ? '第1案を承認しますか？承認後は第2案の作成に進めます。'
        : '第2案を承認しますか？'

    const isNewUnsaved = !planId && hasUnsavedChanges
    if (isNewUnsaved) {
      const newConfirmMessage =
        planType === 'FIRST'
          ? '第1案を承認しますか？\n（まだ保存されていないため、保存してから承認します）'
          : '第2案を承認しますか？\n（まだ保存されていないため、保存してから承認します）'
      if (!confirm(newConfirmMessage)) {
        return
      }
    } else if (!confirm(confirmMessage)) {
      return
    }

    try {
      if (hasUnsavedChanges) {
        const saveResult = await saveChanges()
        if (!saveResult.success) {
          alert(`保存に失敗しました: ${saveResult.message}`)
          return
        }
      }

      const result = await approveBase()
      if (result.success) {
        setHasSavedDraft(true)
      } else {
        alert(`承認に失敗しました: ${result.message}`)
      }
    } catch (error) {
      console.error('承認処理エラー:', error)
      alert(`承認処理に失敗しました\n\nエラー: ${error.message}`)
    }
  }, [planType, planId, hasUnsavedChanges, saveChanges, approveBase])

  // プラン削除
  const handleDelete = useCallback(
    async (skipConfirm = false) => {
      let planIdsToDelete = []
      if (planIdsState.length > 0) {
        planIdsToDelete = [...planIdsState]
      } else if (selectedShift?.planIds?.length > 0) {
        planIdsToDelete = [...selectedShift.planIds]
      } else {
        planIdsToDelete = [...new Set(shiftData.map(shift => shift.plan_id).filter(Boolean))]
      }

      if (planIdsToDelete.length === 0) {
        const confirmMsg =
          planType === 'FIRST'
            ? 'このシフト計画を破棄してもよろしいですか？'
            : 'この第2案シフト計画を破棄してもよろしいですか？'
        if (!skipConfirm && !window.confirm(confirmMsg)) {
          return
        }
        if (onDelete) {
          onDelete()
        } else if (goBack) {
          goBack()
        }
        return
      }

      if (!skipConfirm) {
        const confirmMessage =
          planIdsToDelete.length === 1
            ? planType === 'FIRST'
              ? 'このシフト計画を削除してもよろしいですか？'
              : 'この第2案シフト計画を削除してもよろしいですか？'
            : `${planIdsToDelete.length}件のシフト計画を削除してもよろしいですか？`

        if (!confirm(confirmMessage)) {
          return
        }
      }

      try {
        const tenantId = getCurrentTenantId()

        const deletePromises = planIdsToDelete.map(async id => {
          const url = `${BACKEND_API_URL}/api/shifts/plans/${id}?tenant_id=${tenantId}`
          const response = await fetch(url, { method: 'DELETE' })
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || `プラン ${id} の削除に失敗しました`)
          }
          return data
        })

        await Promise.all(deletePromises)

        if (planType === 'SECOND') {
          alert('第2案を削除しました')
        }

        if (onDelete) {
          onDelete()
        } else {
          navigateToDashboard()
        }
      } catch (error) {
        console.error('削除処理エラー:', error)
        alert(`シフト計画の削除中にエラーが発生しました: ${error.message}`)
      }
    },
    [
      planIdsState,
      selectedShift?.planIds,
      shiftData,
      planType,
      onDelete,
      goBack,
      navigateToDashboard,
    ]
  )

  // 戻るボタン
  const handleBack = useCallback(async () => {
    const isDraft = selectedShift?.status === 'draft' || selectedShift?.status === 'DRAFT'

    if (isDraft && !hasSavedDraft) {
      const shouldDelete = confirm(
        '下書きを保存せずに戻ると、このプランとシフトデータが削除されます。\n本当に戻りますか？'
      )
      if (shouldDelete) {
        await handleDelete(true)
      }
      return
    }

    if (hasUnsavedChanges) {
      if (confirm('未保存の変更があります。変更を破棄して戻りますか？')) {
        if (goBack) goBack()
      }
      return
    }

    if (goBack) goBack()
  }, [selectedShift?.status, hasSavedDraft, hasUnsavedChanges, handleDelete, goBack])

  // シフト更新
  const handleUpdateShift = useCallback(
    (shiftId, updates) => {
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
          prev.map(shift => {
            if (shift.shift_id === shiftId) {
              return { ...shift, ...updates, modified_flag: true }
            }
            return shift
          })
        )
      }

      handleModifyShift(shiftId, updates, updateUI)
    },
    [handleModifyShift]
  )

  // シフト削除
  const handleDeleteShift = useCallback(
    shiftId => {
      if (!window.confirm('このシフトを削除しますか？')) return false

      const updateUI = removedShiftId => {
        setCalendarData(prev => {
          if (!prev) return prev
          const updatedShiftsByDate = { ...prev.shiftsByDate }
          Object.keys(updatedShiftsByDate).forEach(day => {
            updatedShiftsByDate[day] = updatedShiftsByDate[day].filter(
              shift => shift.shift_id !== removedShiftId
            )
          })
          return { ...prev, shiftsByDate: updatedShiftsByDate }
        })

        setDayShifts(prev => prev.filter(shift => shift.shift_id !== removedShiftId))
        setShiftData(prev => prev.filter(shift => shift.shift_id !== removedShiftId))
      }

      handleDeleteShiftBase(shiftId, updateUI)
      return true
    },
    [handleDeleteShiftBase]
  )

  // シフト追加
  const handleAddShift = useCallback(
    newShiftData => {
      const updateUI = newShift => {
        const date = new Date(newShift.shift_date)
        const day = date.getDate()

        setCalendarData(prev => {
          if (!prev) return prev
          const updatedShiftsByDate = { ...prev.shiftsByDate }
          if (!updatedShiftsByDate[day]) {
            updatedShiftsByDate[day] = []
          }
          updatedShiftsByDate[day] = [...updatedShiftsByDate[day], newShift]
          return { ...prev, shiftsByDate: updatedShiftsByDate }
        })

        if (selectedDay === day) {
          setDayShifts(prev => [...prev, newShift])
        }
        setShiftData(prev => [...prev, newShift])
      }

      return handleAddShiftBase(newShiftData, updateUI)
    },
    [handleAddShiftBase, selectedDay]
  )

  // シフトクリック
  const handleShiftClick = useCallback(
    ({ mode: clickMode, shift, date, staffId, storeId, event }) => {
      if (isViewMode) return

      const position = event
        ? { x: event.clientX, y: event.clientY }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 }

      if (clickMode === 'add') {
        const shiftDate =
          date instanceof Date
            ? date.toISOString().split('T')[0]
            : typeof date === 'number'
              ? `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
              : date

        openModal('add', { staffId, storeId, shift_date: shiftDate, date }, position)
      } else {
        openModal('edit', shift, position)
      }
    },
    [isViewMode, year, month, openModal]
  )

  // モーダル保存
  const handleModalSave = useCallback(
    timeData => {
      if (modalState.mode === 'add') {
        const shiftDate = modalState.shift?.shift_date || modalState.shift?.date
        if (!shiftDate) {
          console.error('shift_date is required')
          return
        }

        handleAddShift({
          ...timeData,
          shift_date: shiftDate,
          staff_id: modalState.shift?.staffId,
          store_id: modalState.shift?.storeId || selectedStoreId,
          staff_name: staffMap.get(modalState.shift?.staffId)?.name || '不明',
          role: staffMap.get(modalState.shift?.staffId)?.role_name || 'スタッフ',
        })
      } else {
        handleUpdateShift(modalState.shift?.shift_id, timeData)
      }
      closeModal()
    },
    [modalState, handleAddShift, handleUpdateShift, closeModal, staffMap, selectedStoreId]
  )

  // モーダル削除
  const handleModalDelete = useCallback(() => {
    if (modalState.mode === 'edit' && modalState.shift?.shift_id) {
      const deleted = handleDeleteShift(modalState.shift.shift_id)
      if (deleted) {
        closeModal()
      }
    }
  }, [modalState, handleDeleteShift, closeModal])

  // CSVエクスポート
  const handleExportCSV = useCallback(() => {
    if (!shiftData || shiftData.length === 0) {
      alert(MESSAGES.ERROR.NO_EXPORT_DATA)
      return
    }

    const headers = ['日付', 'スタッフ名', '役割', '店舗', '開始時間', '終了時間', '休憩時間']
    const rows = shiftData.map(shift => [
      shift.shift_date,
      shift.staff_name,
      shift.role,
      storesMap.get(shift.store_id)?.store_name || '',
      shift.start_time,
      shift.end_time,
      shift.break_minutes || 0,
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `shift_${planType.toLowerCase()}_${year}_${month}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [shiftData, storesMap, planType, year, month])

  // ========================================
  // データ読み込みヘルパー
  // ========================================
  const updateCalendarData = useCallback((shifts, targetYear, targetMonth) => {
    const shiftsByDate = {}
    shifts.forEach(shift => {
      const date = new Date(shift.shift_date)
      const day = date.getDate()
      if (!shiftsByDate[day]) {
        shiftsByDate[day] = []
      }
      shiftsByDate[day].push(shift)
    })

    const date = new Date(targetYear, targetMonth - 1, 1)
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate()
    const firstDay = date.getDay()

    setCalendarData({
      daysInMonth,
      firstDay,
      shiftsByDate,
      year: targetYear,
      month: targetMonth,
    })
  }, [])

  return {
    // 状態
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

    // 計算値
    year,
    month,
    planId,
    planType,
    isViewMode,
    isEditMode,
    preferencesMap,
    timeOverlapInfo,

    // マスタデータ（useShiftEditorBaseから）
    ...shiftEditorBase,

    // シフト編集（useShiftEditingから）
    ...shiftEditing,

    // ベース関数（ローカルでラップする用）
    handleDeleteShiftBase,
    handleAddShiftBase,

    // ナビゲーション
    navigate,
    navigateToDashboard,
    handleDashboard,
    goBack,

    // ハンドラー
    handleDayClick,
    handleMaximize,
    handleSaveDraft,
    handleApprove,
    handleDelete,
    handleBack,
    handleUpdateShift,
    handleDeleteShift,
    handleAddShift,
    handleShiftClick,
    handleModalSave,
    handleModalDelete,
    handleExportCSV,

    // ヘルパー
    updateCalendarData,
  }
}

export default useShiftPlanEditor
