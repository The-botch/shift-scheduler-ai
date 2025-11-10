import { useState, useEffect } from 'react'
import { MESSAGES } from '../../../constants/messages'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '../../ui/card'
import { Button } from '../../ui/button'
import { ArrowLeft, CheckCircle, Loader2, Save, Trash2, Download } from 'lucide-react'
import MultiStoreShiftTable from '../../shared/MultiStoreShiftTable'
import ShiftTimeline from '../../shared/ShiftTimeline'
import { ShiftRepository } from '../../../infrastructure/repositories/ShiftRepository'
import { MasterRepository } from '../../../infrastructure/repositories/MasterRepository'
import { BACKEND_API_URL } from '../../../config/api'
import { getCurrentTenantId } from '../../../config/tenant'
import { useShiftEditorBase } from '../../../hooks/useShiftEditorBase'
import { exportCSV } from '../../../utils/csvHelper'

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
 * シフト編集・閲覧画面（統合版）
 * - 既存のシフトをカレンダー表示
 * - 日付クリックで詳細表示・編集（editモード時のみ）
 * - 第1案/第2案の承認ボタン（editモード時のみ）
 * - 削除ボタン（editモード時のみ）
 *
 * @param {string} mode - 'view' (閲覧) または 'edit' (編集) デフォルト: 'edit'
 * @param {string} planType - 'FIRST' または 'SECOND'
 * @param {number|null} storeId - 店舗ID（nullの場合は全店舗表示）
 */
const FirstPlanEditor = ({
  selectedShift,
  onBack,
  onApprove,
  onCreateSecondPlan,
  onDelete,
  mode = 'edit' // 'view' or 'edit'
}) => {
  const isViewMode = mode === 'view'
  const isEditMode = mode === 'edit'

  // 共通ロジック（マスタデータ取得・店舗選択管理）
  const {
    staffMap,
    rolesMap,
    storesMap,
    availableStores,
    selectedStores,
    loading: masterLoading,
    loadMasterData,
    toggleStoreSelection,
    selectAllStores,
    deselectAllStores,
    setSelectedStores,
  } = useShiftEditorBase(selectedShift)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [calendarData, setCalendarData] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayShifts, setDayShifts] = useState([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [hasSavedDraft, setHasSavedDraft] = useState(false) // 下書き保存を押したかどうか

  // ローカルで保持する変更
  const [modifiedShifts, setModifiedShifts] = useState({}) // { shiftId: { start_time, end_time, ... } }
  const [deletedShiftIds, setDeletedShiftIds] = useState(new Set())
  const [addedShifts, setAddedShifts] = useState([]) // 新規追加されたシフト

  // シフトデータ
  const [shiftData, setShiftData] = useState([])
  const [storeId, setStoreId] = useState(null)
  const [defaultPatternId, setDefaultPatternId] = useState(null)

  const year = selectedShift?.year || new Date().getFullYear()
  const month = selectedShift?.month || new Date().getMonth() + 1
  const planId = selectedShift?.planId || selectedShift?.plan_id
  const planType = selectedShift?.planType || 'FIRST'

  // デバッグ用：selectedShiftの内容を確認
  useEffect(() => {
    console.log('DraftShiftEditor - selectedShift:', selectedShift)
    console.log('DraftShiftEditor - planId:', planId)
    console.log('DraftShiftEditor - planType:', planType)
  }, [selectedShift, planId, planType])

  useEffect(() => {
    // initialDataがある場合はそれを使用、ない場合はDBからロード
    if (selectedShift?.initialData) {
      loadInitialData(selectedShift.initialData)
    } else if (planId || (year && month && planType)) {
      loadShiftData()
    }
  }, [planId, year, month, planType, selectedShift?.initialData])

  const loadInitialData = async (initialData) => {
    try {
      setLoading(true)

      // マスタデータを取得
      const { staffMapping } = await loadMasterData()

      console.log('FirstPlanEditor - initialDataから読み込み:', initialData)

      // initialDataからシフトデータを抽出（全店舗分）
      const allShifts = []
      initialData.stores.forEach(store => {
        store.shifts.forEach(shift => {
          const staffInfo = staffMapping[shift.staff_id] || { name: '不明', role_name: 'スタッフ' }
          allShifts.push({
            ...shift,
            staff_name: staffInfo.name,
            role: staffInfo.role_name,
            modified_flag: false,
          })
        })
      })

      // 日付別にグループ化
      const shiftsByDate = {}
      allShifts.forEach(shift => {
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

      setShiftData(allShifts)
      setLoading(false)
    } catch (err) {
      console.error('initialData読み込みエラー:', err)
      setLoading(false)
      alert('初期データの読み込みに失敗しました')
    }
  }

  const loadShiftData = async () => {
    try {
      setLoading(true)

      // まずシフトデータを取得
      // 閲覧モードの場合は全店舗分を取得、編集モードの場合はplanIdで取得
      const shiftsResult = (planId && isEditMode)
        ? await shiftRepository.getShifts({ planId })
        : await shiftRepository.getShifts({ year, month, plan_type: planType })

      // シフトデータから店舗IDとpattern_idを取得（最初のシフトから使用）
      const fetchedStoreId = shiftsResult.length > 0 ? shiftsResult[0].store_id : null
      const fetchedPatternId = shiftsResult.length > 0 ? shiftsResult[0].pattern_id : null

      // ステートに保存
      setStoreId(fetchedStoreId)
      setDefaultPatternId(fetchedPatternId)

      // マスタデータを取得（カスタムhook経由）
      const { staffMapping } = await loadMasterData()

      console.log('FirstPlanEditor - staffMap作成完了:', Object.keys(staffMapping).length, '件')
      console.log('FirstPlanEditor - staffMapサンプル:', staffMapping[Object.keys(staffMapping)[0]])

      // 日付別にグループ化
      const shiftsByDate = {}
      shiftsResult.forEach(shift => {
        const date = new Date(shift.shift_date)
        const day = date.getDate()

        if (!shiftsByDate[day]) {
          shiftsByDate[day] = []
        }

        const staffInfo = staffMapping[shift.staff_id] || { name: '不明', role_name: 'スタッフ' }
        shiftsByDate[day].push({
          ...shift,
          staff_name: staffInfo.name,
          role: staffInfo.role_name,
          modified_flag: false,
        })
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

      // シフトデータを保存（StaffTimeTable用）
      setShiftData(shiftsResult.map(shift => ({
        ...shift,
        staff_name: staffMapping[shift.staff_id]?.name || '不明',
        role: staffMapping[shift.staff_id]?.role_name || 'スタッフ',
      })))

      setLoading(false)
    } catch (err) {
      console.error('データ読み込みエラー:', err)
      setLoading(false)
      alert(MESSAGES.ERROR.SHIFT_DATA_LOAD_FAILED)
    }
  }

  const handleDayClick = day => {
    setSelectedDay(day)
    setDayShifts(calendarData.shiftsByDate[day] || [])
  }

  const closeDayView = () => {
    setSelectedDay(null)
    setDayShifts([])
  }

  // 下書き保存ハンドラー（ステータスを変更せずに保存）
  const handleSaveDraft = async () => {
    if (!confirm('下書きを保存しますか？')) {
      return
    }

    try {
      setSaving(true)
      console.log('下書き保存処理開始')

      // initialDataから作成された未保存データの場合
      if (selectedShift?.status === 'unsaved' && selectedShift?.initialData) {
        console.log('メモリ上のデータをDBに保存')

        // メモリ上のデータをそのままDBに保存
        const result = await shiftRepository.createPlansWithShifts({
          target_year: year,
          target_month: month,
          created_by: 1, // TODO: 実際のユーザーIDに置き換え
          stores: selectedShift.initialData.stores
        })

        if (result.success) {
          console.log('DBへの保存完了')
          setHasSavedDraft(true)
          alert(MESSAGES.SUCCESS.SAVED)

          // データをリロードして最新の状態を表示
          await loadShiftData()
        }
      } else {
        // 既存のプラン編集の場合
        if (!hasUnsavedChanges) {
          alert(MESSAGES.SUCCESS.NO_CHANGES)
          setSaving(false)
          return
        }

        console.log('新規追加:', addedShifts.length, '件')
        console.log('修正:', Object.keys(modifiedShifts).length, '件')
        console.log('削除:', deletedShiftIds.size, '件')

        // すべての変更をバックエンドに送信
        const updatePromises = []

        // 新規追加されたシフトを作成
        for (const newShift of addedShifts) {
          const { shift_id, modified_flag, staff_name, role, ...shiftData } = newShift
          console.log('新規シフト作成:', shiftData)
          updatePromises.push(shiftRepository.createShift(shiftData))
        }

        // 修正されたシフトを更新
        for (const [shiftId, updates] of Object.entries(modifiedShifts)) {
          console.log('シフト更新:', shiftId, updates)
          updatePromises.push(shiftRepository.updateShift(Number(shiftId), updates))
        }

        // 削除されたシフトを削除
        for (const shiftId of deletedShiftIds) {
          console.log('シフト削除:', shiftId)
          updatePromises.push(shiftRepository.deleteShift(shiftId))
        }

        // すべての変更を並行実行
        if (updatePromises.length > 0) {
          console.log('変更をバックエンドに送信中...')
          const results = await Promise.all(updatePromises)
          console.log('保存完了:', results)
        }

        // ローカルステートをリセット
        setModifiedShifts({})
        setDeletedShiftIds(new Set())
        setAddedShifts([])
        setHasUnsavedChanges(false)

        console.log('下書き保存処理完了')

        setHasSavedDraft(true) // 下書き保存済みフラグを立てる
        alert(MESSAGES.SUCCESS.SAVED)
        // データをリロードして最新の状態を表示
        await loadShiftData()
      }

      setSaving(false)
    } catch (error) {
      setSaving(false)
      console.error('下書き保存エラー:', error)
      console.error('エラー詳細:', error.message, error.stack)
      alert(`下書きの保存に失敗しました\n\nエラー: ${error.message}`)
    }
  }

  const handleApprove = async () => {
    // initialDataから作成された未保存データの場合
    if (selectedShift?.status === 'unsaved' && selectedShift?.initialData) {
      if (!confirm('第1案を承認しますか？承認後は第2案の作成に進めます。')) {
        return
      }

      try {
        setSaving(true)
        console.log('メモリ上のデータをDBに保存して承認')

        // メモリ上のデータをDBに保存（DRAFT状態で）
        const createResult = await shiftRepository.createPlansWithShifts({
          target_year: year,
          target_month: month,
          created_by: 1, // TODO: 実際のユーザーIDに置き換え
          stores: selectedShift.initialData.stores
        })

        if (createResult.success) {
          console.log('DB保存完了、ステータスをAPPROVEDに更新')

          // 作成されたプランIDを取得してAPPROVEDに更新
          const planIds = createResult.data.created_plans.map(p => p.plan_id)
          for (const id of planIds) {
            await shiftRepository.updatePlanStatus(id, 'APPROVED')
          }

          console.log('承認処理完了')
          setHasSavedDraft(true)
          setSaving(false)
          alert(MESSAGES.SUCCESS.APPROVE_FIRST_PLAN)
          onApprove()
        }
      } catch (error) {
        setSaving(false)
        console.error('承認処理エラー:', error)
        alert(`承認処理に失敗しました\n\nエラー: ${error.message}`)
      }
      return
    }

    // 既存のプラン編集の場合
    const isAlreadyApproved = selectedShift?.status === 'APPROVED' && selectedShift?.plan_type === 'FIRST'

    if (hasUnsavedChanges) {
      if (!confirm(isAlreadyApproved ? '変更を保存しますか？' : '未保存の変更をバックエンドに保存して承認します。よろしいですか？')) {
        return
      }
    } else if (!isAlreadyApproved) {
      if (!confirm('第1案を承認しますか？承認後は第2案の作成に進めます。')) {
        return
      }
    } else {
      // 承認済みで変更なしの場合は何もしない
      alert(MESSAGES.SUCCESS.NO_CHANGES)
      return
    }

    try {
      setSaving(true)
      console.log('保存処理開始')
      console.log('新規追加:', addedShifts.length, '件')
      console.log('修正:', Object.keys(modifiedShifts).length, '件')
      console.log('削除:', deletedShiftIds.size, '件')

      // 1. すべての変更をバックエンドに送信
      const updatePromises = []

      // 新規追加されたシフトを作成
      for (const newShift of addedShifts) {
        const { shift_id, modified_flag, staff_name, role, ...shiftData } = newShift
        console.log('新規シフト作成:', shiftData)
        updatePromises.push(shiftRepository.createShift(shiftData))
      }

      // 修正されたシフトを更新
      for (const [shiftId, updates] of Object.entries(modifiedShifts)) {
        console.log('シフト更新:', shiftId, updates)
        updatePromises.push(shiftRepository.updateShift(Number(shiftId), updates))
      }

      // 削除されたシフトを削除
      for (const shiftId of deletedShiftIds) {
        console.log('シフト削除:', shiftId)
        updatePromises.push(shiftRepository.deleteShift(shiftId))
      }

      // すべての変更を並行実行
      if (updatePromises.length > 0) {
        console.log('変更をバックエンドに送信中...')
        const results = await Promise.all(updatePromises)
        console.log('保存完了:', results)
      }

      // 2. プランのステータスを更新（承認済みでない場合のみ）
      if (!isAlreadyApproved) {
        // planId がある場合はそれを使用、ない場合は shiftData から plan_id を抽出
        const planIdsToUpdate = planId
          ? [planId]
          : [...new Set(shiftData.map(shift => shift.plan_id).filter(Boolean))]

        console.log('プランステータス更新:', planIdsToUpdate, 'APPROVED')

        // 各プランのステータスを更新
        for (const id of planIdsToUpdate) {
          await shiftRepository.updatePlanStatus(id, 'APPROVED')
        }
      }

      // 3. ローカルステートをリセット
      setModifiedShifts({})
      setDeletedShiftIds(new Set())
      setAddedShifts([])
      setHasUnsavedChanges(false)

      console.log('保存処理完了')

      setHasSavedDraft(true) // 承認済みフラグを立てる（削除されないように）

      // 4. 承認済みの場合はデータをリロードして画面に留まる、承認の場合は戻る
      if (isAlreadyApproved) {
        alert(MESSAGES.SUCCESS.SAVED)
        // データをリロードして最新の状態を表示
        await loadShiftData()
        setSaving(false)
      } else {
        setSaving(false)
        alert(MESSAGES.SUCCESS.APPROVE_FIRST_PLAN)
        onApprove()
      }
    } catch (error) {
      setSaving(false)
      console.error('承認処理エラー:', error)
      console.error('エラー詳細:', error.message, error.stack)
      alert(`${MESSAGES.ERROR.SAVE_APPROVE_FAILED}\n\nエラー: ${error.message}`)
    }
  }

  // シフト更新ハンドラー（ローカルステートのみ更新）
  const handleUpdateShift = (shiftId, updates) => {
    console.log('=== handleUpdateShift START ===')
    console.log('shiftId:', shiftId)
    console.log('updates:', updates)
    console.log('selectedShift status:', selectedShift?.status)
    console.log('current shiftData length:', shiftData.length)
    console.log('current calendarData:', calendarData ? Object.keys(calendarData.shiftsByDate).length + ' days' : 'null')
    setHasUnsavedChanges(true)

    // ローカルの変更を保持
    setModifiedShifts(prev => ({
      ...prev,
      [shiftId]: {
        ...prev[shiftId],
        ...updates,
      },
    }))

    // UIを即座に更新
    setCalendarData(prev => {
      const updatedShiftsByDate = { ...prev.shiftsByDate }

      // すべての日付のシフトを更新
      Object.keys(updatedShiftsByDate).forEach(day => {
        updatedShiftsByDate[day] = updatedShiftsByDate[day].map(shift => {
          if (shift.shift_id === shiftId) {
            return {
              ...shift,
              ...updates,
              modified_flag: true,
            }
          }
          return shift
        })
      })

      return {
        ...prev,
        shiftsByDate: updatedShiftsByDate,
      }
    })

    // shiftDataも更新（StaffTimeTable用）
    setShiftData(prev =>
      prev.map(shift =>
        shift.shift_id === shiftId
          ? { ...shift, ...updates, modified_flag: true }
          : shift
      )
    )

    // 現在表示中の日のシフトも更新
    if (selectedDay) {
      setDayShifts(prev =>
        prev.map(shift =>
          shift.shift_id === shiftId
            ? { ...shift, ...updates, modified_flag: true }
            : shift
        )
      )
    }

    console.log('=== handleUpdateShift END ===')
    console.log('Updated successfully for shiftId:', shiftId)
  }

  // シフト削除ハンドラー（ローカルステートのみ更新）
  const handleDeleteShift = (shiftId) => {
    setHasUnsavedChanges(true)

    // ローカルの削除リストに追加
    setDeletedShiftIds(prev => new Set([...prev, shiftId]))

    // UIから削除
    setCalendarData(prev => {
      const updatedShiftsByDate = { ...prev.shiftsByDate }

      // すべての日付のシフトから削除
      Object.keys(updatedShiftsByDate).forEach(day => {
        updatedShiftsByDate[day] = updatedShiftsByDate[day].filter(
          shift => shift.shift_id !== shiftId
        )
      })

      return {
        ...prev,
        shiftsByDate: updatedShiftsByDate,
      }
    })

    // 現在表示中の日のシフトも削除
    if (selectedDay) {
      const updatedShifts = dayShifts.filter(s => s.shift_id !== shiftId)
      setDayShifts(updatedShifts)

      // その日のシフトがなくなったら閉じる
      if (updatedShifts.length === 0) {
        closeDayView()
      }
    }
  }

  // シフト追加ハンドラー（ローカルステートのみ更新）
  const handleAddShift = (newShiftData) => {
    setHasUnsavedChanges(true)

    // 一時的なシフトIDを生成（負の数を使用）
    const tempShiftId = -Date.now()

    // スタッフ情報を取得
    const staffInfo = staffMap[newShiftData.staff_id] || { name: '不明', role_name: 'スタッフ' }

    // 新しいシフトオブジェクトを作成（バックエンド保存用の必須フィールドを含む）
    const newShift = {
      shift_id: tempShiftId,
      tenant_id: getCurrentTenantId(), // 必須
      store_id: storeId, // 必須
      plan_id: planId, // 必須
      staff_id: newShiftData.staff_id, // 必須
      shift_date: newShiftData.shift_date, // 必須
      pattern_id: defaultPatternId || 1, // 必須（デフォルト値として1を使用）
      start_time: newShiftData.start_time, // 必須
      end_time: newShiftData.end_time, // 必須
      break_minutes: newShiftData.break_minutes || 60, // 必須
      staff_name: staffInfo.name,
      role: staffInfo.role_name,
      modified_flag: true,
    }

    // 追加シフトリストに追加
    setAddedShifts(prev => [...prev, newShift])

    // UIに即座に反映
    const date = new Date(newShiftData.shift_date)
    const day = date.getDate()

    setCalendarData(prev => {
      const updatedShiftsByDate = { ...prev.shiftsByDate }

      if (!updatedShiftsByDate[day]) {
        updatedShiftsByDate[day] = []
      }

      updatedShiftsByDate[day].push(newShift)

      return {
        ...prev,
        shiftsByDate: updatedShiftsByDate,
      }
    })

    // shiftDataにも追加
    setShiftData(prev => [...prev, newShift])

    // 現在表示中の日の場合は dayShifts にも追加
    if (selectedDay === day) {
      setDayShifts(prev => [...prev, newShift])
    }
  }

  // 戻るボタンのハンドラー（未保存の場合はプラン削除）
  const handleBack = async () => {
    // 下書き保存を押していない、かつDRAFTステータスの場合は、プラン削除を確認
    const isDraft = selectedShift?.status === 'draft' || selectedShift?.status === 'DRAFT'

    if (isDraft && !hasSavedDraft) {
      const shouldDelete = confirm(
        '下書きを保存せずに戻ると、このプランとシフトデータが削除されます。\n本当に戻りますか？'
      )
      if (shouldDelete) {
        await handleDelete(true)  // 確認済みフラグを渡す
      }
      return
    }

    // 下書き保存済み、または未保存の変更がある場合は確認
    if (hasUnsavedChanges) {
      if (confirm('未保存の変更があります。変更を破棄して戻りますか？')) {
        onBack()
      }
      return
    }

    // 通常の戻り
    onBack()
  }

  const handleDelete = async (skipConfirm = false) => {
    // planId がある場合はそれを使用、ない場合は shiftData から plan_id を抽出
    const planIdsToDelete = planId
      ? [planId]
      : [...new Set(shiftData.map(shift => shift.plan_id).filter(Boolean))]

    if (planIdsToDelete.length === 0) {
      // 削除するプランがない場合（何も保存していない場合）
      // シフト管理画面に戻る
      if (onDelete) {
        onDelete()
      } else {
        onBack()
      }
      return
    }

    // 確認ダイアログ（skipConfirmがtrueの場合はスキップ）
    if (!skipConfirm) {
      const confirmMessage = planIdsToDelete.length === 1
        ? 'このシフト計画を削除してもよろしいですか？'
        : `${planIdsToDelete.length}件のシフト計画を削除してもよろしいですか？`

      if (!confirm(confirmMessage)) {
        return
      }
    }

    try {
      const tenantId = getCurrentTenantId()

      // 各 planId に対して削除リクエストを送信
      const deletePromises = planIdsToDelete.map(async (id) => {
        const url = `${BACKEND_API_URL}/api/shifts/plans/${id}?tenant_id=${tenantId}`
        console.log('削除リクエスト:', url)

        const response = await fetch(url, {
          method: 'DELETE',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || `プラン ${id} の削除に失敗しました`)
        }

        return data
      })

      await Promise.all(deletePromises)

      console.log('削除成功:', planIdsToDelete.length, '件')

      // 削除成功後、シフト管理画面に戻る
      if (onDelete) {
        onDelete()
      } else {
        onBack()
      }
    } catch (error) {
      console.error('削除処理エラー:', error)
      alert(`シフト計画の削除中にエラーが発生しました: ${error.message}`)
    }
  }

  // CSVエクスポートハンドラー
  const handleExportCSV = () => {
    if (!shiftData || shiftData.length === 0) {
      alert(MESSAGES.ERROR.NO_EXPORT_DATA)
      return
    }

    // エクスポート用データを整形（日付順にソート）
    const exportData = shiftData.map(shift => {
      const date = new Date(shift.shift_date)
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]

      return {
        日付: shift.shift_date,
        曜日: dayOfWeek,
        店舗名: storesMap[shift.store_id]?.store_name || '',
        スタッフ名: shift.staff_name || '',
        役職: shift.role || '',
        開始時刻: shift.start_time || '',
        終了時刻: shift.end_time || '',
        休憩時間: shift.break_minutes || 0,
        勤務時間: shift.total_hours || 0,
      }
    }).sort((a, b) => a.日付.localeCompare(b.日付))

    const filename = `shift_${planType.toLowerCase()}_${year}_${String(month).padStart(2, '0')}.csv`
    const result = exportCSV(exportData, filename)

    if (result.success) {
      alert(MESSAGES.SUCCESS.CSV_EXPORT_SUCCESS(year, month))
    } else {
      alert(MESSAGES.ERROR.EXPORT_ERROR(result.error))
    }
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
      className="fixed inset-0 flex flex-col"
      style={{ top: '64px' }}
    >
      {/* ヘッダー - 固定 */}
      <div className="mb-2 flex items-center justify-between flex-shrink-0 px-8 pt-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            戻る
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {year}年{month}月のシフト（{planType === 'SECOND' ? '第2案' : '第1案'}）
              <span className="text-sm font-normal text-gray-600 ml-3">
                {selectedShift?.store_name ? `${selectedShift.store_name} · ` : ''}
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
        <div className="flex gap-2">
          {/* CSVエクスポートボタン（常に表示） */}
          <Button size="sm" variant="outline" onClick={handleExportCSV}>
            <Download className="h-3 w-3 mr-1" />
            CSVエクスポート
          </Button>

          {/* アクションボタン */}
          {isEditMode && (
            <>
              {selectedShift?.status === 'APPROVED' && selectedShift?.plan_type === 'FIRST' ? (
                <>
                  <Button size="sm" onClick={handleApprove} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    {saving ? '保存中...' : '保存'}
                  </Button>
                  {onCreateSecondPlan && (
                    <Button size="sm" onClick={() => onCreateSecondPlan({ ...selectedShift, storeId, store_id: storeId })} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      第2案作成
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={handleDelete} className="border-red-300 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={handleSaveDraft} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    {saving ? '保存中...' : '下書き保存'}
                  </Button>
                  <Button size="sm" onClick={handleApprove} disabled={saving} className="bg-green-600 hover:bg-green-700">
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    {saving ? '処理中...' : `${planType === 'SECOND' ? '第2案' : '第1案'}承認`}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDelete} className="border-red-300 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* 店舗チェックボックス（表示フィルター） */}
      <div className="px-8 mb-4">
        <div className="flex flex-wrap gap-3">
          {availableStores.map(store => {
            const storeIdNum = parseInt(store.store_id)
            return (
              <label key={store.store_id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStores.has(storeIdNum)}
                  onChange={(e) => {
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

      <div className="flex-1 overflow-hidden mx-8 mb-4">
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
          onDayClick={isEditMode ? handleDayClick : undefined}
        />
      </div>

      {/* タイムライン表示 */}
      <AnimatePresence>
        {selectedDay && (
          <ShiftTimeline
            date={selectedDay}
            year={year}
            month={month}
            shifts={dayShifts}
            onClose={closeDayView}
            editable={true}
            onUpdate={handleUpdateShift}
            onDelete={handleDeleteShift}
            storeName={selectedShift?.store_name}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default FirstPlanEditor
