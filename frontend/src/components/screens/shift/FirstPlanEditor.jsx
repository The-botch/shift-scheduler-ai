import { useState, useEffect } from 'react'
import { MESSAGES } from '../../../constants/messages'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '../../ui/card'
import { Button } from '../../ui/button'
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Save,
  Trash2,
  Download,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react'
import { Rnd } from 'react-rnd'
import MultiStoreShiftTable from '../../shared/MultiStoreShiftTable'
import ShiftTimeline from '../../shared/ShiftTimeline'
import ShiftTableView from '../../shared/ShiftTableView'
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
  onDelete,
  mode = 'edit', // 'view' or 'edit'
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
  const [selectedStoreId, setSelectedStoreId] = useState(null) // クリックされた店舗ID（nullは全店舗）
  const [dayShifts, setDayShifts] = useState([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [hasSavedDraft, setHasSavedDraft] = useState(false) // 下書き保存を押したかどうか

  // カレンダービューのウィンドウ状態
  const [windowState, setWindowState] = useState({
    width: Math.max(window.innerWidth * 0.9, 1200),
    height: window.innerHeight * 0.6,
    x: 50,
    y: 50,
    isMaximized: false,
  })

  // ローカルで保持する変更
  const [modifiedShifts, setModifiedShifts] = useState({}) // { shiftId: { start_time, end_time, ... } }
  const [deletedShiftIds, setDeletedShiftIds] = useState(new Set())
  const [addedShifts, setAddedShifts] = useState([]) // 新規追加されたシフト

  // シフトデータ
  const [shiftData, setShiftData] = useState([])
  const [planIdState, setPlanIdState] = useState(null) // 状態として保持するplanId
  const [defaultPatternId, setDefaultPatternId] = useState(null)
  const [preferences, setPreferences] = useState([]) // 希望シフト
  const [shiftPatterns, setShiftPatterns] = useState([]) // シフトパターンマスタ

  // シフト編集ポップアップの状態
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'add', // 'add' | 'edit'
    shift: null,
    selectedPattern: null, // 選択されたシフトパターン
    position: { x: 0, y: 0 }, // ポップアップ表示位置
  })

  const year = selectedShift?.year || new Date().getFullYear()
  const month = selectedShift?.month || new Date().getMonth() + 1
  const planId = selectedShift?.planId || selectedShift?.plan_id || planIdState
  const planType = selectedShift?.planType || 'FIRST'

  useEffect(() => {
    // initialDataがある場合はそれを使用、ない場合はDBからロード
    if (selectedShift?.initialData) {
      loadInitialData(selectedShift.initialData)
    } else if (planId || (year && month && planType)) {
      loadShiftData()
    }
  }, [planId, year, month, planType, selectedShift?.initialData])

  const loadInitialData = async initialData => {
    try {
      setLoading(true)

      // マスタデータを取得
      const { staffMapping } = await loadMasterData()

      console.log('FirstPlanEditor - initialDataから読み込み:', initialData)

      // initialDataからシフトデータを抽出（全店舗分）
      const allShifts = []
      let extractedPlanId = null
      initialData.stores.forEach(store => {
        store.shifts.forEach(shift => {
          // 最初のシフトからplan_idを抽出
          if (!extractedPlanId && shift.plan_id) {
            extractedPlanId = shift.plan_id
          }
          const staffInfo = staffMapping[shift.staff_id] || { name: '不明', role_name: 'スタッフ' }
          allShifts.push({
            ...shift,
            staff_name: staffInfo.name,
            role: staffInfo.role_name,
            modified_flag: false,
          })
        })
      })

      // plan_idを状態に保存
      if (extractedPlanId) {
        setPlanIdState(extractedPlanId)
      }

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

      // 希望シフトは取得しない（第一案は前月コピーなので不要）

      // シフトパターンマスタを取得
      try {
        const patterns = await masterRepository.getShiftPatterns()
        setShiftPatterns(patterns)
        console.log('シフトパターン取得完了:', patterns.length, '件')
      } catch (error) {
        console.error('シフトパターン取得エラー:', error)
      }

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
      // マルチストア環境では、常に全店舗のシフトを取得
      const shiftsResult = await shiftRepository.getShifts({ year, month, plan_type: planType })

      // シフトデータからpattern_id、plan_idを取得（最初のシフトから使用）
      const fetchedPatternId = shiftsResult.length > 0 ? shiftsResult[0].pattern_id : null
      const fetchedPlanId = shiftsResult.length > 0 ? shiftsResult[0].plan_id : null

      // ステートに保存
      setDefaultPatternId(fetchedPatternId)
      setPlanIdState(fetchedPlanId)

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
      setShiftData(
        shiftsResult.map(shift => ({
          ...shift,
          staff_name: staffMapping[shift.staff_id]?.name || '不明',
          role: staffMapping[shift.staff_id]?.role_name || 'スタッフ',
        }))
      )

      // 希望シフトは取得しない（第一案は前月コピーなので不要）

      // シフトパターンマスタを取得
      try {
        const patterns = await masterRepository.getShiftPatterns()
        setShiftPatterns(patterns)
        console.log('シフトパターン取得完了:', patterns.length, '件')
      } catch (error) {
        console.error('シフトパターン取得エラー:', error)
      }

      setLoading(false)
    } catch (err) {
      console.error('データ読み込みエラー:', err)
      setLoading(false)
      alert(MESSAGES.ERROR.SHIFT_DATA_LOAD_FAILED)
    }
  }

  const handleDayClick = (day, storeId = null) => {
    let dayShiftsData = calendarData.shiftsByDate[day] || []

    // storeIdが指定されている場合は、その店舗のシフトのみをフィルタリング
    if (storeId !== null) {
      dayShiftsData = dayShiftsData.filter(shift => shift.store_id === storeId)
    }

    console.log('🔍 handleDayClick called:', { day, storeId, shiftsCount: dayShiftsData.length })
    setSelectedDay(day)
    setSelectedStoreId(storeId)
    setDayShifts(dayShiftsData)
  }

  const closeDayView = () => {
    setSelectedDay(null)
    setSelectedStoreId(null)
    setDayShifts([])
  }

  // ウィンドウ操作ハンドラー
  const handleMaximize = () => {
    if (windowState.isMaximized) {
      // 元のサイズに戻す
      setWindowState(prev => ({
        ...prev,
        width: Math.max(window.innerWidth * 0.9, 1200),
        height: window.innerHeight * 0.6,
        isMaximized: false,
      }))
    } else {
      // 最大化
      setWindowState(prev => ({
        ...prev,
        width: window.innerWidth * 0.95,
        height: window.innerHeight * 0.95,
        isMaximized: true,
      }))
    }
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
          stores: selectedShift.initialData.stores,
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
          // バックエンドAPIに必要なフィールドのみを抽出
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
          stores: selectedShift.initialData.stores,
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
    const isAlreadyApproved =
      selectedShift?.status === 'APPROVED' && selectedShift?.planType === 'FIRST'

    if (hasUnsavedChanges) {
      if (
        !confirm(
          isAlreadyApproved
            ? '変更を保存しますか？'
            : '未保存の変更をバックエンドに保存して承認します。よろしいですか？'
        )
      ) {
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
        // バックエンドAPIに必要なフィールドのみを抽出
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
        shift.shift_id === shiftId ? { ...shift, ...updates, modified_flag: true } : shift
      )
    )

    // 現在表示中の日のシフトも更新
    if (selectedDay) {
      setDayShifts(prev =>
        prev.map(shift =>
          shift.shift_id === shiftId ? { ...shift, ...updates, modified_flag: true } : shift
        )
      )
    }
  }

  // シフト削除ハンドラー（ローカルステートのみ更新）
  const handleDeleteShift = shiftId => {
    setHasUnsavedChanges(true)

    // Tempシフト（未保存）かどうかを判定
    if (String(shiftId).startsWith('temp_')) {
      // Tempシフトの場合：addedShiftsから削除（バックエンドへの削除リクエストは不要）
      setAddedShifts(prev => prev.filter(shift => shift.shift_id !== shiftId))
    } else {
      // 既存シフト（DB保存済み）の場合：削除リストに追加（バックエンドで削除）
      setDeletedShiftIds(prev => new Set([...prev, shiftId]))
    }

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
  const handleAddShift = newShiftData => {
    setHasUnsavedChanges(true)

    // 一時的なシフトIDを生成
    const tempShiftId = `temp_${Date.now()}_${Math.random()}`

    // スタッフ情報を取得
    const staffInfo = staffMap[newShiftData.staff_id] || { name: '不明', role_name: 'スタッフ' }

    // pattern_id を動的に取得（マルチテナント対応）
    // 優先順位: 選択されたパターン > 既存シフトの最初のパターン > デフォルト
    const dynamicPatternId =
      modalState.selectedPattern?.pattern_id ||
      defaultPatternId ||
      (shiftData.length > 0 ? shiftData[0].pattern_id : null) ||
      (shiftPatterns.length > 0 ? shiftPatterns[0].pattern_id : 1)

    // 新しいシフトオブジェクトを作成（バックエンド保存用の必須フィールドを含む）
    const newShift = {
      shift_id: tempShiftId,
      tenant_id: getCurrentTenantId(), // 必須
      store_id: newShiftData.store_id, // 必須（ポップアップから渡される）
      plan_id: planId, // 必須
      staff_id: newShiftData.staff_id, // 必須
      shift_date: newShiftData.date || newShiftData.shift_date, // 必須
      pattern_id: dynamicPatternId, // 動的に取得（マルチテナント対応）
      start_time: newShiftData.start_time, // 必須
      end_time: newShiftData.end_time, // 必須
      break_minutes: newShiftData.break_minutes || 0, // 必須
      is_preferred: false,
      is_modified: true,
      staff_name: staffInfo.name,
      role: staffInfo.role_name,
      modified_flag: true,
    }

    // 追加シフトリストに追加
    setAddedShifts(prev => [...prev, newShift])

    // UIに即座に反映
    const date = new Date(newShift.shift_date)
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

  // セルクリック時のハンドラー
  const handleShiftClick = ({ mode, shift, date, staffId, storeId, event }) => {
    // クリック位置を取得
    const rect = event?.target.getBoundingClientRect()
    const position = rect
      ? {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        }
      : {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        }

    // 日付フォーマットを統一（"2024-11-29" 形式）
    const formattedDate =
      typeof date === 'string' && date.includes('-')
        ? date
        : `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`

    if (mode === 'add') {
      // 新規追加モード - スタッフの所属店舗をデフォルトに設定
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
          store_id: staffStoreId, // スタッフの所属店舗ID
          staff_name: staffMap[staffId]?.name || '不明',
          store_name: storeData?.store_name || '不明',
        },
        position,
      })
    } else {
      // 編集モード
      setModalState({
        isOpen: true,
        mode: 'edit',
        shift: {
          ...shift,
          date: shift.date || formattedDate,
        },
        position,
      })
    }
  }

  // モーダルからの保存処理
  const handleModalSave = timeData => {
    if (modalState.mode === 'add') {
      handleAddShift({
        ...modalState.shift,
        ...timeData,
      })
    } else {
      handleUpdateShift(modalState.shift.shift_id, timeData)
    }

    setModalState({ isOpen: false, mode: 'add', shift: null, position: { x: 0, y: 0 } })
  }

  // モーダルからの削除処理
  const handleModalDelete = () => {
    if (!confirm('このシフトを削除しますか？')) return

    handleDeleteShift(modalState.shift.shift_id)
    setModalState({ isOpen: false, mode: 'add', shift: null, position: { x: 0, y: 0 } })
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
        await handleDelete(true) // 確認済みフラグを渡す
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
      const confirmMessage =
        planIdsToDelete.length === 1
          ? 'このシフト計画を削除してもよろしいですか？'
          : `${planIdsToDelete.length}件のシフト計画を削除してもよろしいですか？`

      if (!confirm(confirmMessage)) {
        return
      }
    }

    try {
      const tenantId = getCurrentTenantId()

      // 各 planId に対して削除リクエストを送信
      const deletePromises = planIdsToDelete.map(async id => {
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
    const exportData = shiftData
      .map(shift => {
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
      })
      .sort((a, b) => a.日付.localeCompare(b.日付))

    const filename = `shift_${planType.toLowerCase()}_${year}_${String(month).padStart(2, '0')}.csv`
    const result = exportCSV(exportData, filename)

    if (result.success) {
      alert(MESSAGES.SUCCESS.CSV_EXPORT_SUCCESS(year, month))
    } else {
      alert(MESSAGES.ERROR.EXPORT_ERROR(result.error))
    }
  }

  // シフト編集ポップアップコンポーネント
  const ShiftEditModal = ({
    isOpen,
    onClose,
    mode,
    shift,
    preferences,
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

    // shift が変更されたときにフォームの値をリセット
    useEffect(() => {
      if (shift) {
        setStartTime(shift.start_time || '')
        setEndTime(shift.end_time || '')
        setBreakMinutes(shift.break_minutes || 0)
        setStoreId(shift.store_id || '')
        setSelectedPatternId('')
      }
    }, [shift])

    // パターン選択ハンドラー（時刻を自動入力）
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

    // ドラッグハンドラー
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

    // ドラッグイベントリスナー
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

    // ポップアップの位置を計算（画面端で見切れないように調整）
    useEffect(() => {
      if (isOpen && position) {
        const popupWidth = 320
        const popupHeight = mode === 'edit' ? 320 : 300
        const margin = 20

        let x = position.x
        let y = position.y

        // 右端チェック
        if (x + popupWidth / 2 > window.innerWidth - margin) {
          x = window.innerWidth - popupWidth - margin
        } else if (x - popupWidth / 2 < margin) {
          // 左端チェック
          x = margin
        } else {
          // 中央配置
          x = x - popupWidth / 2
        }

        // 下端チェック
        if (y + popupHeight > window.innerHeight - margin) {
          // 上に表示
          y = position.y - popupHeight - 20
          if (y < margin) {
            y = margin
          }
        } else {
          // 上寄りに表示（クリック位置から少し上）
          y = position.y - 30
        }

        // 初期位置を設定
        setPopupPosition({ x, y })
      }
    }, [isOpen, position, mode])

    // スタイルを更新
    useEffect(() => {
      setPopupStyle({
        position: 'fixed',
        left: `${popupPosition.x}px`,
        top: `${popupPosition.y}px`,
        zIndex: 10000,
        cursor: isDragging ? 'move' : 'default',
      })
    }, [popupPosition, isDragging])

    // 希望シフトのチェック
    const checkPreference = () => {
      if (!shift || !preferences) return null

      const pref = preferences.find(p => parseInt(p.staff_id) === parseInt(shift.staff_id))
      if (!pref) return null

      const dateStr = shift.date

      // NG日チェック
      if (pref.ng_days) {
        const ngDays = pref.ng_days.split(',').map(d => d.trim())
        if (ngDays.includes(dateStr)) {
          return 'ng'
        }
      }

      // 希望日チェック
      if (pref.preferred_days) {
        const preferredDays = pref.preferred_days.split(',').map(d => d.trim())
        if (preferredDays.includes(dateStr)) {
          return 'preferred'
        }
      }

      return null
    }

    const handleSave = () => {
      // 必須項目チェック
      if (!startTime || !endTime) {
        alert('開始時刻と終了時刻を入力してください')
        return
      }

      if (!storeId) {
        alert('勤務店舗を選択してください')
        return
      }

      // 時刻の妥当性チェック
      if (startTime >= endTime) {
        alert('終了時刻は開始時刻より後にしてください')
        return
      }

      // 休憩時間の妥当性チェック
      const breakMins = parseInt(breakMinutes) || 0
      if (breakMins < 0) {
        alert('休憩時間は0以上の値を入力してください')
        return
      }

      // 希望シフトチェック
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
        {/* 背景オーバーレイ（薄く半透明） */}
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

        {/* ポップアップ本体 */}
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
              {/* ヘッダー */}
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

              {/* スタッフ・日付情報の表示 */}
              <div className="bg-blue-50 border border-blue-200 p-2 rounded mb-2 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">スタッフ</span>
                  <span className="font-semibold">{shift.staff_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">日付</span>
                  <span className="font-semibold">{shift.date}</span>
                </div>
              </div>

              {/* フォーム入力 */}
              <div className="space-y-2">
                {/* 店舗選択 */}
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

                {/* シフトパターン選択（店舗選択後に表示） */}
                {storeId &&
                  shiftPatterns &&
                  shiftPatterns.length > 0 &&
                  (() => {
                    // 選択された店舗のパターン、またはテナント共通パターン（store_id=null）をフィルタリング
                    const filteredPatterns = shiftPatterns.filter(
                      pattern => pattern.store_id === null || pattern.store_id === Number(storeId)
                    )

                    if (filteredPatterns.length === 0) return null

                    return (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          シフトパターン
                        </label>
                        <select
                          value={selectedPatternId}
                          onChange={e => handlePatternSelect(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- パターンを選択 --</option>
                          {filteredPatterns.map(pattern => (
                            <option key={pattern.pattern_id} value={pattern.pattern_id}>
                              {pattern.pattern_name} ({pattern.start_time}-{pattern.end_time})
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })()}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    開始時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    終了時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    休憩時間（分）
                  </label>
                  <input
                    type="number"
                    value={breakMinutes}
                    onChange={e => setBreakMinutes(e.target.value)}
                    min="0"
                    step="15"
                    placeholder="例: 60"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* ボタン群 */}
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
      className="min-h-screen flex flex-col pt-16"
    >
      {/* ヘッダー */}
      <div className="mb-2 flex items-center justify-between flex-shrink-0 px-8 py-4 bg-white border-b border-gray-200">
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
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    {saving ? '保存中...' : '保存'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
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
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    {saving ? '処理中...' : `${planType === 'SECOND' ? '第2案' : '第1案'}承認`}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
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
          onDayClick={handleDayClick}
          onShiftClick={isEditMode ? handleShiftClick : undefined}
          preferences={preferences}
          showPreferenceColoring={false}
        />
      </div>

      {/* タイムライン表示（ドラッグ・リサイズ可能なウィンドウ） */}
      {selectedDay &&
        (() => {
          console.log('📅 Rendering Rnd window:', { selectedDay, windowState })
          return (
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
                {/* ウィンドウヘッダー */}
                <div className="window-header bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 flex justify-between items-center cursor-move select-none">
                  <div className="font-semibold text-sm">
                    📅 {month}月{selectedDay}日 -{' '}
                    {selectedStoreId === null
                      ? '全店舗'
                      : storesMap[selectedStoreId]?.store_name || ''}
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

                {/* ウィンドウコンテンツ */}
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
          )
        })()}

      {/* シフト編集ポップアップ */}
      <ShiftEditModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        shift={modalState.shift}
        preferences={preferences}
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

export default FirstPlanEditor
