import { useState, useCallback } from 'react'
import { ShiftRepository } from '../infrastructure/repositories/ShiftRepository'
import { MESSAGES } from '../constants/messages'

const shiftRepository = new ShiftRepository()

/**
 * シフト編集の共通ロジックを提供するカスタムhook
 * FirstPlanEditorとSecondPlanEditorで共通のデータ操作を抽出
 *
 * @param {Object} options - オプション
 * @param {string} options.planType - 'FIRST' | 'SECOND'
 * @param {Function} options.onApproveComplete - 承認完了時のコールバック
 * @param {Function} options.updateLocalUI - ローカルUIを更新する関数
 * @returns {Object} 共通の状態と関数
 */
export const useShiftEditing = ({ planType = 'FIRST', onApproveComplete } = {}) => {
  // ローカルで保持する変更
  const [modifiedShifts, setModifiedShifts] = useState({}) // { shiftId: { start_time, end_time, ... } }
  const [deletedShiftIds, setDeletedShiftIds] = useState(new Set())
  const [addedShifts, setAddedShifts] = useState([]) // 新規追加されたシフト

  // 状態管理
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [planIds, setPlanIds] = useState([]) // 全店舗分のplanId配列

  // シフト編集モーダルの状態
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    shift: null,
    selectedPattern: null,
    position: { x: 0, y: 0 },
  })

  /**
   * planIdを設定（単一または配列）
   */
  const setPlanId = useCallback(id => {
    if (Array.isArray(id)) {
      setPlanIds(id)
    } else if (id) {
      setPlanIds([id])
    } else {
      setPlanIds([])
    }
  }, [])

  /**
   * 最初のplanIdを取得（後方互換性）
   */
  const getPlanId = useCallback(() => {
    return planIds.length > 0 ? planIds[0] : null
  }, [planIds])

  /**
   * シフト削除ハンドラー（ローカルステートのみ更新）
   */
  const handleDeleteShift = useCallback((shiftId, updateUICallback) => {
    setHasUnsavedChanges(true)

    // Tempシフト（未保存）かどうかを判定
    if (String(shiftId).startsWith('temp_')) {
      // Tempシフトの場合：addedShiftsから削除
      setAddedShifts(prev => prev.filter(shift => shift.shift_id !== shiftId))
    } else {
      // 既存シフト（DB保存済み）の場合：削除リストに追加
      setDeletedShiftIds(prev => new Set([...prev, shiftId]))
    }

    // UIの更新（呼び出し元で定義）
    if (updateUICallback) {
      updateUICallback(shiftId)
    }
  }, [])

  /**
   * シフト追加ハンドラー（ローカルステートのみ更新）
   */
  const handleAddShift = useCallback((newShiftData, updateUICallback) => {
    setHasUnsavedChanges(true)

    // 一時的なシフトIDを生成
    const tempShiftId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const shiftWithId = {
      ...newShiftData,
      shift_id: tempShiftId,
      is_modified: true,
    }

    setAddedShifts(prev => [...prev, shiftWithId])

    // UIの更新（呼び出し元で定義）
    if (updateUICallback) {
      updateUICallback(shiftWithId)
    }

    return shiftWithId
  }, [])

  /**
   * シフト修正ハンドラー（ローカルステートのみ更新）
   */
  const handleModifyShift = useCallback((shiftId, changes, updateUICallback) => {
    setHasUnsavedChanges(true)

    // Tempシフト（未保存）の場合はaddedShiftsを更新
    if (String(shiftId).startsWith('temp_')) {
      setAddedShifts(prev =>
        prev.map(shift => (shift.shift_id === shiftId ? { ...shift, ...changes } : shift))
      )
    } else {
      // 既存シフトの場合は修正リストに追加
      setModifiedShifts(prev => ({
        ...prev,
        [shiftId]: { ...prev[shiftId], ...changes },
      }))
    }

    // UIの更新（呼び出し元で定義）
    if (updateUICallback) {
      updateUICallback(shiftId, changes)
    }
  }, [])

  /**
   * 変更をバックエンドに保存
   */
  const saveChanges = useCallback(async () => {
    if (!hasUnsavedChanges) {
      return { success: true, message: '保存する変更はありません' }
    }

    try {
      setSaving(true)

      const updatePromises = []

      // 新規追加されたシフトを作成
      for (const newShift of addedShifts) {
        const shiftData = {
          tenant_id: newShift.tenant_id,
          store_id: newShift.store_id,
          plan_id: newShift.plan_id,
          staff_id: newShift.staff_id,
          shift_date: newShift.shift_date,
          pattern_id: newShift.pattern_id,
          start_time: newShift.start_time,
          end_time: newShift.end_time,
          break_minutes: newShift.break_minutes,
          is_preferred: newShift.is_preferred,
          is_modified: newShift.is_modified,
        }
        updatePromises.push(shiftRepository.createShift(shiftData))
      }

      // 修正されたシフトを更新
      for (const [shiftId, updates] of Object.entries(modifiedShifts)) {
        updatePromises.push(shiftRepository.updateShift(Number(shiftId), updates))
      }

      // 削除されたシフトを削除
      for (const shiftId of deletedShiftIds) {
        updatePromises.push(shiftRepository.deleteShift(shiftId))
      }

      // すべての変更を並行実行
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises)
      }

      // 状態をリセット
      setAddedShifts([])
      setModifiedShifts({})
      setDeletedShiftIds(new Set())
      setHasUnsavedChanges(false)

      return { success: true, message: '保存しました' }
    } catch (error) {
      console.error('保存エラー:', error)
      return { success: false, message: error.message }
    } finally {
      setSaving(false)
    }
  }, [hasUnsavedChanges, addedShifts, modifiedShifts, deletedShiftIds])

  /**
   * 下書き保存
   */
  const saveDraft = useCallback(
    async (skipConfirm = false) => {
      if (!skipConfirm && !confirm('下書きを保存しますか？')) {
        return null
      }

      const result = await saveChanges()
      if (result.success) {
        alert(MESSAGES.SUCCESS.DRAFT_SAVED || '下書きを保存しました')
      } else {
        alert(`下書きの保存に失敗しました\n\nエラー: ${result.message}`)
      }
      return result.success ? getPlanId() : null
    },
    [saveChanges, getPlanId]
  )

  /**
   * 承認処理
   */
  const approve = useCallback(async () => {
    try {
      setSaving(true)

      // 未保存の変更があれば先に保存
      if (hasUnsavedChanges) {
        const saveResult = await saveChanges()
        if (!saveResult.success) {
          throw new Error('変更の保存に失敗しました')
        }
      }

      // ステータスをAPPROVEDに更新
      const planId = getPlanId()
      if (planId) {
        await shiftRepository.updatePlanStatus(planId, 'APPROVED')
      }

      // 複数のplanIdがある場合は全て承認
      if (planIds.length > 1) {
        for (const id of planIds) {
          await shiftRepository.updatePlanStatus(id, 'APPROVED')
        }
      }

      const message =
        planType === 'FIRST'
          ? MESSAGES.SUCCESS.APPROVE_FIRST_PLAN
          : MESSAGES.SUCCESS.APPROVE_SECOND_PLAN
      alert(message)

      // コールバック実行
      if (onApproveComplete) {
        onApproveComplete()
      }

      return { success: true }
    } catch (error) {
      console.error('承認処理エラー:', error)
      alert(`承認処理に失敗しました\n\nエラー: ${error.message}`)
      return { success: false, message: error.message }
    } finally {
      setSaving(false)
    }
  }, [hasUnsavedChanges, saveChanges, getPlanId, planIds, planType, onApproveComplete])

  /**
   * プラン削除
   */
  const deletePlan = useCallback(
    async (skipConfirm = false) => {
      if (!skipConfirm && !confirm('シフトプランを削除しますか？この操作は取り消せません。')) {
        return { success: false, cancelled: true }
      }

      try {
        setSaving(true)

        // 全てのplanIdを削除
        const planIdsToDelete = planIds.length > 0 ? planIds : []

        if (planIdsToDelete.length === 0) {
          throw new Error('削除するプランがありません')
        }

        for (const id of planIdsToDelete) {
          await shiftRepository.deletePlan(id)
        }

        // 状態をリセット
        setPlanIds([])
        setAddedShifts([])
        setModifiedShifts({})
        setDeletedShiftIds(new Set())
        setHasUnsavedChanges(false)

        alert('シフトプランを削除しました')
        return { success: true }
      } catch (error) {
        console.error('削除エラー:', error)
        alert(`削除に失敗しました\n\nエラー: ${error.message}`)
        return { success: false, message: error.message }
      } finally {
        setSaving(false)
      }
    },
    [planIds]
  )

  /**
   * モーダルを開く
   */
  const openModal = useCallback((mode, shift = null, position = { x: 0, y: 0 }) => {
    setModalState({
      isOpen: true,
      mode,
      shift,
      selectedPattern: null,
      position,
    })
  }, [])

  /**
   * モーダルを閉じる
   */
  const closeModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
      shift: null,
    }))
  }, [])

  /**
   * 変更状態をリセット
   */
  const resetChanges = useCallback(() => {
    setAddedShifts([])
    setModifiedShifts({})
    setDeletedShiftIds(new Set())
    setHasUnsavedChanges(false)
  }, [])

  /**
   * 変更があるかどうかを確認
   */
  const getChangesSummary = useCallback(() => {
    return {
      added: addedShifts.length,
      modified: Object.keys(modifiedShifts).length,
      deleted: deletedShiftIds.size,
      total: addedShifts.length + Object.keys(modifiedShifts).length + deletedShiftIds.size,
    }
  }, [addedShifts, modifiedShifts, deletedShiftIds])

  return {
    // 状態
    modifiedShifts,
    deletedShiftIds,
    addedShifts,
    hasUnsavedChanges,
    saving,
    planIds,
    modalState,

    // planId管理
    setPlanId,
    getPlanId,

    // シフト操作
    handleDeleteShift,
    handleAddShift,
    handleModifyShift,

    // 保存・承認
    saveChanges,
    saveDraft,
    approve,
    deletePlan,

    // モーダル
    openModal,
    closeModal,
    setModalState,

    // ユーティリティ
    resetChanges,
    getChangesSummary,
    setHasUnsavedChanges,
  }
}
