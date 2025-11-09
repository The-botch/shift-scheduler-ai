import { useState, useEffect } from 'react'
import { MESSAGES } from '../../../constants/messages'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '../../ui/card'
import { Button } from '../../ui/button'
import { ArrowLeft, CheckCircle, Loader2, Save, Trash2 } from 'lucide-react'
import MultiStoreShiftTable from '../../shared/MultiStoreShiftTable'
import ShiftTimeline from '../../shared/ShiftTimeline'
import { ShiftRepository } from '../../../infrastructure/repositories/ShiftRepository'
import { MasterRepository } from '../../../infrastructure/repositories/MasterRepository'
import { BACKEND_API_URL } from '../../../config/api'
import { getCurrentTenantId } from '../../../config/tenant'

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
 * 下書きシフト編集画面
 * - 既存の下書きシフトをカレンダー表示
 * - 日付クリックで詳細表示・編集
 * - 第1案承認ボタン
 * - 第2案作成ボタン（第1案承認済みの場合のみ）
 * - 削除ボタン（第2承認前のみ）
 */
const DraftShiftEditor = ({ selectedShift, onBack, onApprove, onCreateSecondPlan, onDelete }) => {
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

  // スタッフ情報とシフトデータ
  const [staffMap, setStaffMap] = useState({})
  const [shiftData, setShiftData] = useState([])
  const [storeId, setStoreId] = useState(null)
  const [defaultPatternId, setDefaultPatternId] = useState(null)
  const [storesMap, setStoresMap] = useState({}) // 店舗ID -> 店舗情報
  const [selectedStores, setSelectedStores] = useState(new Set()) // 選択された店舗IDのSet
  const [availableStores, setAvailableStores] = useState([]) // 利用可能な店舗リスト

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
    // planId がある場合、または year/month/planType がある場合にデータをロード
    if (planId || (year && month && planType)) {
      loadShiftData()
    }
  }, [planId, year, month, planType])

  const loadShiftData = async () => {
    try {
      setLoading(true)

      // まずシフトデータを取得
      // planId がある場合はそれを使用、ない場合は year/month/planType を使用
      const shiftsResult = planId
        ? await shiftRepository.getShifts({ planId })
        : await shiftRepository.getShifts({ year, month, plan_type: planType })

      // シフトデータから店舗IDとpattern_idを取得（最初のシフトから使用）
      const fetchedStoreId = shiftsResult.length > 0 ? shiftsResult[0].store_id : null
      const fetchedPatternId = shiftsResult.length > 0 ? shiftsResult[0].pattern_id : null

      // ステートに保存
      setStoreId(fetchedStoreId)
      setDefaultPatternId(fetchedPatternId)

      // APIから並行読み込み（全店舗のスタッフを取得）
      const [staffResult, rolesResult, storesResult] = await Promise.all([
        masterRepository.getStaff(),
        masterRepository.getRoles(),
        masterRepository.getStores(),
      ])

      // 役職IDから役職名へのマッピング
      const rolesMap = {}
      rolesResult.forEach(role => {
        rolesMap[role.role_id] = role.role_name
      })

      // 店舗IDから店舗情報へのマッピング
      const storesMapping = {}
      storesResult.forEach(store => {
        storesMapping[store.store_id] = {
          store_code: store.store_code,
          store_name: store.store_name,
          address: store.address,
        }
      })
      setStoresMap(storesMapping)

      // 利用可能な店舗リストを設定
      const stores = storesResult.map(store => ({
        store_id: store.store_id,
        store_name: store.store_name,
      })).sort((a, b) => a.store_name.localeCompare(b.store_name))
      setAvailableStores(stores)

      // 初期状態で選択された店舗を設定
      // selectedShiftにstoreIdが明示的に指定されている場合のみ、その店舗だけを選択
      // それ以外（一括作成など）は全店舗を選択
      const initialStoreId = selectedShift?.storeId || selectedShift?.store_id
      if (initialStoreId) {
        // 個別店舗指定の場合
        setSelectedStores(new Set([parseInt(initialStoreId)]))
      } else {
        // 一括作成などで店舗指定がない場合は全店舗を選択
        setSelectedStores(new Set(stores.map(s => parseInt(s.store_id))))
      }

      // スタッフIDから名前・役職へのマッピング
      console.log('DraftShiftEditor - staffResult件数:', staffResult.length)
      console.log('DraftShiftEditor - staffResultサンプル:', staffResult.slice(0, 2))

      const staffMap = {}
      staffResult.forEach(staff => {
        staffMap[staff.staff_id] = {
          name: staff.name,
          role_id: staff.role_id,
          role_name: rolesMap[staff.role_id] || 'スタッフ',
          is_active: staff.is_active,
          store_id: staff.store_id,
        }
      })

      console.log('DraftShiftEditor - staffMap作成完了:', Object.keys(staffMap).length, '件')
      console.log('DraftShiftEditor - staffMapサンプル:', staffMap[Object.keys(staffMap)[0]])

      // 日付別にグループ化
      const shiftsByDate = {}
      shiftsResult.forEach(shift => {
        const date = new Date(shift.shift_date)
        const day = date.getDate()

        if (!shiftsByDate[day]) {
          shiftsByDate[day] = []
        }

        const staffInfo = staffMap[shift.staff_id] || { name: '不明', role_name: 'スタッフ' }
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

      // スタッフマップとシフトデータを保存（StaffTimeTable用）
      setStaffMap(staffMap)
      setShiftData(shiftsResult.map(shift => ({
        ...shift,
        staff_name: staffMap[shift.staff_id]?.name || '不明',
        role: staffMap[shift.staff_id]?.role_name || 'スタッフ',
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
    if (!hasUnsavedChanges) {
      alert(MESSAGES.SUCCESS.NO_CHANGES)
      return
    }

    if (!confirm('下書きを保存しますか？')) {
      return
    }

    try {
      setSaving(true)
      console.log('下書き保存処理開始')
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
      setSaving(false)
    } catch (error) {
      setSaving(false)
      console.error('下書き保存エラー:', error)
      console.error('エラー詳細:', error.message, error.stack)
      alert(`下書きの保存に失敗しました\n\nエラー: ${error.message}`)
    }
  }

  const handleApprove = async () => {
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
        await handleDelete()
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

  const handleDelete = async () => {
    // planId がある場合はそれを使用、ない場合は shiftData から plan_id を抽出
    const planIdsToDelete = planId
      ? [planId]
      : [...new Set(shiftData.map(shift => shift.plan_id).filter(Boolean))]

    if (planIdsToDelete.length === 0) {
      alert('削除するシフト計画が見つかりません')
      return
    }

    // 確認ダイアログ
    const confirmMessage = planIdsToDelete.length === 1
      ? 'このシフト計画を削除してもよろしいですか？'
      : `${planIdsToDelete.length}件のシフト計画を削除してもよろしいですか？`

    if (!confirm(confirmMessage)) {
      return
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
              {year}年{month}月のシフト（{selectedShift?.status === 'APPROVED' && selectedShift?.plan_type === 'FIRST' ? '承認済み' : 'シフト下書き'}）
              <span className="text-sm font-normal text-gray-600 ml-3">
                {selectedShift?.store_name ? `${selectedShift.store_name} · ` : ''}
                編集可能
              </span>
              {hasUnsavedChanges && (
                <span className="text-sm font-semibold text-orange-600 ml-3 animate-pulse">
                  ● 未保存の変更があります
                </span>
              )}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          {/* アクションボタン */}
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
                {saving ? '処理中...' : '第1案承認'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleDelete} className="border-red-300 text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-1" />
                削除
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
          readonly={false}
          onAddShift={handleAddShift}
          onUpdateShift={handleUpdateShift}
          onDeleteShift={handleDeleteShift}
          onDayClick={handleDayClick}
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

export default DraftShiftEditor
