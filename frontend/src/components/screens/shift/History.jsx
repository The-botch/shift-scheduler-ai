import { useState, useEffect } from 'react'
import { MESSAGES } from '../../../constants/messages'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Upload,
  ArrowLeft,
  TrendingUp,
  Clock,
  DollarSign,
  Users as UsersIcon,
  Loader2,
  AlertTriangle,
  Store,
} from 'lucide-react'
import ShiftTimeline from '../../shared/ShiftTimeline'
import MultiStoreShiftTable from '../../shared/MultiStoreShiftTable'
import { exportCSV, generateFilename } from '../../../utils/csvHelper'
import { ShiftRepository } from '../../../infrastructure/repositories/ShiftRepository'
import { MasterRepository } from '../../../infrastructure/repositories/MasterRepository'
import { isHoliday, getHolidayName, loadHolidays } from '../../../utils/holidays'

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

const History = ({
  onPrev,
  initialMonth,
  onHome,
  onShiftManagement,
  onLineMessages,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onBudgetActualManagement,
  onFirstPlan,
  selectedStore: externalSelectedStore,
  setSelectedStore: externalSetSelectedStore,
  onStoreChange: externalOnStoreChange,
  availableStores: externalAvailableStores,
  hideStoreSelector = false,
}) => {
  const [loading, setLoading] = useState(true)
  const [monthlySummary, setMonthlySummary] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || null)
  const [detailShifts, setDetailShifts] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayShifts, setDayShifts] = useState([])
  const [staffMap, setStaffMap] = useState({}) // スタッフID -> スタッフ情報
  const [shiftData, setShiftData] = useState([]) // シフトデータ
  const [rolesMap, setRolesMap] = useState({}) // 役職ID -> 役職名
  const [storesMap, setStoresMap] = useState({}) // 店舗ID -> 店舗情報（store_code, store_name等）
  const [monthStatus, setMonthStatus] = useState({}) // 月別ステータス管理
  const [selectedYear, setSelectedYear] = useState(2025) // 選択中の年（実データは2025年）
  const [availableStores, setAvailableStores] = useState([]) // 利用可能な店舗リスト
  const [selectedStores, setSelectedStores] = useState(new Set()) // チェックボックスで選択された店舗IDのSet

  useEffect(() => {
    loadHistoryData()
    loadMonthStatus()
  }, [])

  // initialMonthが設定されている場合、データ読み込み完了後に自動的に開く
  useEffect(() => {
    if (!loading && initialMonth && staffMap && Object.keys(staffMap).length > 0) {
      handleMonthClick(initialMonth.year, initialMonth.month, initialMonth.storeId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, initialMonth])

  // 月別ステータスの読み込み
  const loadMonthStatus = () => {
    const statusData = localStorage.getItem('month_status') || '{}'
    setMonthStatus(JSON.parse(statusData))
  }

  // 月別ステータスの保存
  const saveMonthStatus = (year, month, status) => {
    const key = `${year}_${month}`
    const newStatus = {
      ...monthStatus,
      [key]: {
        ...monthStatus[key],
        ...status,
        updated_at: new Date().toISOString(),
      },
    }
    setMonthStatus(newStatus)
    localStorage.setItem('month_status', JSON.stringify(newStatus))
  }

  // 月のステータス取得
  const getMonthStatus = (year, month) => {
    const key = `${year}_${month}`
    return (
      monthStatus[key] || {
        shift_status: 'draft', // 'draft' | 'approved' | 'completed'
        actual_imported: false,
        actual_import_date: null,
      }
    )
  }

  const loadHistoryData = async () => {
    try {
      setLoading(true)

      // APIを使用してマスターデータとシフトサマリーを読み込み
      const [staffData, rolesData, storesData, summaryData] = await Promise.all([
        masterRepository.getStaff(),
        masterRepository.getRoles(),
        masterRepository.getStores(),
        shiftRepository.getSummary({ year: 2025 }) // 実データは2025年
      ])

      // 役職IDから役職名へのマッピング
      const rolesMapping = {}
      rolesData.forEach(role => {
        rolesMapping[role.role_id] = role.role_name
      })
      setRolesMap(rolesMapping)

      // 店舗IDから店舗情報へのマッピング
      const storesMapping = {}
      storesData.forEach(store => {
        storesMapping[store.store_id] = {
          store_code: store.store_code,
          store_name: store.store_name,
          address: store.address,
        }
      })
      setStoresMap(storesMapping)

      // スタッフマップを作成（StaffTimeTable用のフォーマット）
      const staffMapping = {}
      staffData.forEach(staff => {
        staffMapping[staff.staff_id] = {
          name: staff.name,
          role_id: staff.role_id,
          role_name: rolesMapping[staff.role_id] || 'スタッフ',
          store_id: staff.store_id,
          is_active: staff.is_active,
        }
      })
      setStaffMap(staffMapping)

      // APIから取得したサマリーデータを数値に変換
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1 // 1-12

      const summaryDataProcessed = summaryData
        .map(s => ({
          ...s,
          year: parseInt(s.year),
          month: parseInt(s.month),
          shift_count: parseInt(s.shift_count || 0),
          staff_count: parseInt(s.staff_count || 0),
          total_hours: parseFloat(s.total_hours || 0),
          total_labor_cost: parseFloat(s.total_labor_cost || 0),
          status: s.status || 'completed',
        }))
        .filter(s => {
          // 過去の月のみ表示（現在月と未来月を除外）
          const targetDate = new Date(s.year, s.month - 1, 1)
          const currentDate = new Date(currentYear, currentMonth - 1, 1)
          return targetDate < currentDate
        })

      setMonthlySummary(summaryDataProcessed)

      // 利用可能な店舗リストを抽出（重複除外）
      const stores = Array.from(
        new Map(
          summaryDataProcessed
            .filter(s => s.store_id && s.store_name)
            .map(s => [s.store_id, { store_id: s.store_id, store_name: s.store_name }])
        ).values()
      ).sort((a, b) => a.store_name.localeCompare(b.store_name))
      setAvailableStores(stores)

      // 初期状態で全店舗を選択（数値型に統一）
      setSelectedStores(new Set(stores.map(s => parseInt(s.store_id))))

      // 過去のシフト履歴をAPIから読み込み
      const allShifts = await shiftRepository.getShifts({ year: 2025 })

      // APIデータをCSV互換フォーマットに変換（年月を数値に変換）
      // タイムゾーンの影響を避けるため、日付文字列を直接パース
      const formattedShifts = allShifts.map(shift => {
        const dateStr = shift.shift_date.split('T')[0] // "2025-07-03"
        const [yearStr, monthStr, dateStr2] = dateStr.split('-')
        const year = parseInt(yearStr)
        const month = parseInt(monthStr)
        const date = parseInt(dateStr2)

        // 曜日計算（タイムゾーン非依存）
        const shiftDate = new Date(year, month - 1, date)
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][shiftDate.getDay()]

        return {
          shift_id: shift.shift_id,
          store_id: shift.store_id,
          year,
          month,
          date,
          day_of_week: dayOfWeek,
          staff_id: parseInt(shift.staff_id),
          staff_name: shift.staff_name,
          start_time: shift.start_time,
          end_time: shift.end_time,
          break_minutes: parseInt(shift.break_minutes || 60),
          planned_hours: parseFloat(shift.total_hours || shift.planned_hours || 0),
          role: shift.role_name,
          modified_flag: shift.is_modified || false,
        }
      })

      // formattedShiftsは使用しないので削除
    } catch (err) {
      console.error('履歴データ読み込みエラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthClick = async (year, month, storeId) => {
    try {
      // 最新のシフトデータをAPIから取得（全店舗のシフトを取得）
      const allShifts = await shiftRepository.getShifts({ year, month })

      // データをフォーマット（タイムゾーンの影響を避けるため日付文字列を直接パース）
      const formattedShifts = allShifts.map(shift => {
        const dateStr = shift.shift_date.split('T')[0] // "2025-07-03"
        const [yearStr, monthStr, dateStr2] = dateStr.split('-')
        const yearNum = parseInt(yearStr)
        const monthNum = parseInt(monthStr)
        const dateNum = parseInt(dateStr2)

        // 曜日計算（タイムゾーン非依存）
        const shiftDate = new Date(yearNum, monthNum - 1, dateNum)
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][shiftDate.getDay()]

        return {
          shift_id: shift.shift_id,
          year: yearNum,
          month: monthNum,
          date: dateNum,
          day_of_week: dayOfWeek,
          staff_id: parseInt(shift.staff_id),
          staff_name: shift.staff_name,
          start_time: shift.start_time,
          end_time: shift.end_time,
          break_minutes: parseInt(shift.break_minutes || 60),
          planned_hours: parseFloat(shift.total_hours || shift.planned_hours || 0),
          role: shift.role_name,
          modified_flag: shift.is_modified || false,
          store_id: shift.store_id,
        }
      })

      const filtered = formattedShifts

      console.log(`=== handleMonthClick: ${year}年${month}月, store_id=${storeId} ===`)
      console.log('filtered総数:', filtered.length)
      const day1Shifts = filtered.filter(s => s.date === 1)
      console.log('1日のシフト数:', day1Shifts.length)
      console.log('1日のシフト:', day1Shifts.map(s => `${s.shift_id}:${s.staff_name}`))

      // 履歴データを表示用にフォーマット
      const transformedHistory = filtered.map(shift => {
        const staff = staffMap[shift.staff_id]
        const roleName = staff ? staff.role_name : shift.role || '一般スタッフ'
        return {
          ...shift,
          role: roleName,
        }
      })

      // StaffTimeTable用のフォーマットでシフトデータを準備
      const shiftDataForTable = transformedHistory.map(shift => {
        const shiftDate = new Date(year, month - 1, shift.date)
        return {
          shift_id: shift.shift_id,
          shift_date: shiftDate.toISOString().split('T')[0],
          staff_id: shift.staff_id,
          staff_name: shift.staff_name,
          start_time: shift.start_time,
          end_time: shift.end_time,
          break_minutes: shift.break_minutes || 60,
          role: shift.role,
          modified_flag: shift.modified_flag || false,
          store_id: shift.store_id,
        }
      })

      // シフトに存在するスタッフIDを収集
      const staffIdsInShifts = new Set(transformedHistory.map(s => s.staff_id))

      // シフトに存在するスタッフのみをマップに含める
      const filteredStaffMap = {}
      Object.entries(staffMap).forEach(([staffId, staffInfo]) => {
        const numericStaffId = parseInt(staffId)
        if (staffIdsInShifts.has(numericStaffId)) {
          filteredStaffMap[staffId] = staffInfo
        }
      })

      // 店舗名を取得
      const storeName = monthlySummary.find(m => m.store_id === storeId)?.store_name

      setDetailShifts(transformedHistory)
      setShiftData(shiftDataForTable)
      setSelectedMonth({ year, month, storeId, storeName, staffMap: filteredStaffMap })

      // デフォルトの選択状態を設定（数値型に統一）
      if (storeId) {
        // 特定の店舗から来た場合は、その店舗のみを選択
        setSelectedStores(new Set([parseInt(storeId)]))
      } else {
        // 店舗指定なしの場合は全店舗を選択
        setSelectedStores(new Set(availableStores.map(s => parseInt(s.store_id))))
      }
      console.log('handleMonthClick - selectedStores set to:', storeId ? [parseInt(storeId)] : availableStores.map(s => parseInt(s.store_id)))
    } catch (err) {
      console.error('月別シフト読み込みエラー:', err)
    }
  }


  const backToSummary = () => {
    setSelectedMonth(null)
    setDetailShifts([])
  }

  const handleExportCSV = () => {
    if (!selectedMonth || detailShifts.length === 0) {
      alert(MESSAGES.ERROR.NO_EXPORT_DATA)
      return
    }

    const filename = `shift_history_${selectedMonth.year}_${String(selectedMonth.month).padStart(2, '0')}.csv`
    const result = exportCSV(detailShifts, filename)

    if (result.success) {
      alert(MESSAGES.SUCCESS.CSV_EXPORT_SUCCESS(selectedMonth.year, selectedMonth.month))
    } else {
      alert(MESSAGES.ERROR.EXPORT_ERROR(result.error))
    }
  }

  // 実績CSVインポート
  const handleImportActual = event => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      Papa.parse(e.target.result, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: results => {
          if (results.data && results.data.length > 0) {
            // 実績データを保存
            setActualData(results.data)

            // 予定データと比較して差分分析
            analyzeDifference(results.data)

            // ステータスを更新
            if (selectedMonth) {
              saveMonthStatus(selectedMonth.year, selectedMonth.month, {
                actual_imported: true,
                actual_import_date: new Date().toISOString(),
              })
            }

            alert(MESSAGES.SUCCESS.ACTUAL_DATA_IMPORT(results.data.length))
          } else {
            alert(MESSAGES.ERROR.NO_VALID_DATA)
          }
        },
        error: error => {
          alert(MESSAGES.ERROR.IMPORT_ERROR_SHORT(error.message))
        },
      })
    }
    reader.readAsText(file)
    // リセット（同じファイルを再度選択できるように）
    event.target.value = ''
  }

  // 予定vs実績の差分分析
  const analyzeDifference = actualShifts => {
    if (!selectedMonth || !detailShifts || detailShifts.length === 0) {
      alert(MESSAGES.ERROR.PLANNED_SHIFT_NOT_FOUND)
      return
    }

    const analysis = {
      totalDiff: {
        plannedShifts: detailShifts.length,
        actualShifts: actualShifts.length,
        shiftCountDiff: actualShifts.length - detailShifts.length,
        plannedHours: 0,
        actualHours: 0,
        hoursDiff: 0,
        plannedCost: 0,
        actualCost: 0,
        costDiff: 0,
      },
      staffDiff: {},
      dateDiff: {},
    }

    // 予定データを日付×スタッフでマッピング
    const plannedMap = {}
    detailShifts.forEach(shift => {
      const key = `${shift.date}_${shift.staff_id}`
      plannedMap[key] = shift
      analysis.totalDiff.plannedHours += parseFloat(shift.planned_hours || shift.actual_hours || 0)
      analysis.totalDiff.plannedCost += parseFloat(shift.estimated_wage || shift.daily_wage || 0)
    })

    // 実績データを分析
    actualShifts.forEach(shift => {
      const key = `${shift.date}_${shift.staff_id}`
      const planned = plannedMap[key]

      const actualHours = parseFloat(shift.actual_hours || 0)
      const actualCost = parseFloat(shift.actual_wage || shift.daily_wage || 0)

      analysis.totalDiff.actualHours += actualHours
      analysis.totalDiff.actualCost += actualCost

      // スタッフ別差分
      if (!analysis.staffDiff[shift.staff_id]) {
        analysis.staffDiff[shift.staff_id] = {
          staff_name: shift.staff_name,
          plannedDays: 0,
          actualDays: 0,
          plannedHours: 0,
          actualHours: 0,
          hoursDiff: 0,
          differences: [],
        }
      }
      const staffData = analysis.staffDiff[shift.staff_id]
      staffData.actualDays += 1
      staffData.actualHours += actualHours

      if (planned) {
        const plannedHours = parseFloat(planned.planned_hours || planned.actual_hours || 0)
        staffData.plannedDays += 1
        staffData.plannedHours += plannedHours

        const hoursDiff = actualHours - plannedHours
        if (Math.abs(hoursDiff) > 0.1) {
          staffData.differences.push({
            date: shift.date,
            plannedHours,
            actualHours,
            diff: hoursDiff,
          })
        }
        delete plannedMap[key] // 処理済みをマーク
      } else {
        // 予定になかったシフト
        staffData.differences.push({
          date: shift.date,
          plannedHours: 0,
          actualHours,
          diff: actualHours,
          type: 'added',
        })
      }
    })

    // 予定にあって実績になかったシフト
    Object.values(plannedMap).forEach(planned => {
      if (!analysis.staffDiff[planned.staff_id]) {
        analysis.staffDiff[planned.staff_id] = {
          staff_name: planned.staff_name,
          plannedDays: 0,
          actualDays: 0,
          plannedHours: 0,
          actualHours: 0,
          hoursDiff: 0,
          differences: [],
        }
      }
      const staffData = analysis.staffDiff[planned.staff_id]
      const plannedHours = parseFloat(planned.planned_hours || planned.actual_hours || 0)
      staffData.plannedDays += 1
      staffData.plannedHours += plannedHours
      staffData.differences.push({
        date: planned.date,
        plannedHours,
        actualHours: 0,
        diff: -plannedHours,
        type: 'removed',
      })
    })

    // スタッフ別差分を計算
    Object.values(analysis.staffDiff).forEach(staff => {
      staff.hoursDiff = staff.actualHours - staff.plannedHours
    })

    analysis.totalDiff.hoursDiff = analysis.totalDiff.actualHours - analysis.totalDiff.plannedHours
    analysis.totalDiff.costDiff = analysis.totalDiff.actualCost - analysis.totalDiff.plannedCost

    setDiffAnalysis(analysis)
    setShowDiff(true)
  }

  const handleDayClick = day => {
    const shifts = detailShifts.filter(s => s.date === day)
    console.log(`=== handleDayClick: ${day}日 ===`)
    console.log('detailShifts総数:', detailShifts.length)
    console.log(`${day}日のシフト数:`, shifts.length)
    console.log(`${day}日のシフト詳細:`, shifts)
    console.log('shiftData総数:', shiftData.length)
    // shiftDataからも同じ日付のデータを確認
    const shiftDataForDay = shiftData.filter(s => {
      const shiftDate = new Date(s.shift_date)
      return shiftDate.getDate() === day
    })
    console.log(`${day}日のshiftData:`, shiftDataForDay.length, shiftDataForDay)

    // 差分があるか確認
    if (shifts.length !== shiftDataForDay.length) {
      console.warn('⚠️ データ不整合検出！')
      console.log('detailShiftsのスタッフID:', shifts.map(s => `${s.staff_id}:${s.staff_name}`))
      console.log('shiftDataのスタッフID:', shiftDataForDay.map(s => `${s.staff_id}:${s.staff_name}`))

      // detailShiftsにあってshiftDataにないもの
      const missingInShiftData = shifts.filter(ds =>
        !shiftDataForDay.some(sd => sd.shift_id === ds.shift_id)
      )
      console.log('shiftDataに欠けているシフト:', missingInShiftData)

      // shiftDataにあってdetailShiftsにないもの
      const missingInDetailShifts = shiftDataForDay.filter(sd =>
        !shifts.some(ds => ds.shift_id === sd.shift_id)
      )
      console.log('detailShiftsに欠けているシフト:', missingInDetailShifts)
    }

    // シフトがない場合は何もしない
    if (shifts.length === 0) return
    setDayShifts(shifts)
    setSelectedDay(day)
  }

  const closeDayView = () => {
    setSelectedDay(null)
    setDayShifts([])
  }

  // カレンダー表示用のデータ整形
  const getCalendarData = () => {
    if (!selectedMonth) return []

    const year = selectedMonth.year
    const month = selectedMonth.month
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDay = new Date(year, month - 1, 1).getDay()

    // 日付ごとにシフトをグループ化
    const shiftsByDate = {}
    detailShifts.forEach(shift => {
      if (!shiftsByDate[shift.date]) {
        shiftsByDate[shift.date] = []
      }
      shiftsByDate[shift.date].push(shift)
    })

    return { daysInMonth, firstDay, shiftsByDate }
  }

  // スタッフ別実績を集計
  const getStaffPerformance = () => {
    if (!detailShifts || detailShifts.length === 0) return []

    // スタッフごとに集計
    const staffMap = {}
    detailShifts.forEach(shift => {
      if (!staffMap[shift.staff_name]) {
        staffMap[shift.staff_name] = {
          name: shift.staff_name,
          role: shift.role,
          totalDays: 0,
          totalHours: 0,
          weekdayDays: 0,
          weekendDays: 0,
          modifiedCount: 0,
        }
      }

      const staff = staffMap[shift.staff_name]
      staff.totalDays += 1
      staff.totalHours += parseFloat(shift.actual_hours || shift.planned_hours || 0)

      // 曜日判定
      const date = new Date(selectedMonth.year, selectedMonth.month - 1, shift.date)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        staff.weekendDays += 1
      } else {
        staff.weekdayDays += 1
      }

      if (shift.modified_flag) {
        staff.modifiedCount += 1
      }
    })

    return Object.values(staffMap).sort((a, b) => b.totalHours - a.totalHours)
  }

  if (loading) {
    return (
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="h-screen overflow-hidden flex flex-col pt-8 px-8"
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">シフト履歴データを読み込んでいます...</p>
        </div>
      </motion.div>
    )
  }

  // デモ用の履歴データ（変更ログ用に残す）
  const changeHistory = [
    {
      id: 1,
      timestamp: '2024-09-28 14:35:22',
      user: '管理者（山田）',
      action: 'シフト変更',
      target: '10月3日 田中さん',
      detail: '9:00-13:00 → 13:00-17:00',
      reason: 'スタッフ希望による変更',
    },
    {
      id: 2,
      timestamp: '2024-09-28 14:20:15',
      user: 'AI自動調整',
      action: 'シフト生成',
      target: '10月全体',
      detail: '第2案生成完了（希望反映率92%）',
      reason: 'スタッフ希望を反映',
    },
    {
      id: 3,
      timestamp: '2024-09-27 16:45:30',
      user: '管理者（山田）',
      action: 'シフト変更',
      target: '10月15日 佐藤さん',
      detail: '休み → 9:00-17:00',
      reason: '人員不足の補充',
    },
    {
      id: 4,
      timestamp: '2024-09-26 10:00:00',
      user: 'AI自動生成',
      action: 'シフト生成',
      target: '10月全体',
      detail: '第1案生成完了',
      reason: '初期案の自動生成',
    },
    {
      id: 5,
      timestamp: '2024-09-25 18:30:45',
      user: '管理者（山田）',
      action: 'マスターデータ更新',
      target: 'スタッフ情報',
      detail: '新規スタッフ「高橋」追加',
      reason: '新規採用',
    },
  ]

  const auditLog = [
    {
      id: 1,
      timestamp: '2024-09-28 14:35:22',
      user: '管理者（山田）',
      ip: '192.168.1.100',
      action: 'UPDATE_SHIFT',
      resource: 'shift_2024_10',
      status: 'success',
    },
    {
      id: 2,
      timestamp: '2024-09-28 14:20:15',
      user: 'SYSTEM',
      ip: 'localhost',
      action: 'GENERATE_SHIFT',
      resource: 'shift_2024_10',
      status: 'success',
    },
    {
      id: 3,
      timestamp: '2024-09-28 09:15:30',
      user: '管理者（山田）',
      ip: '192.168.1.100',
      action: 'LOGIN',
      resource: 'auth',
      status: 'success',
    },
    {
      id: 4,
      timestamp: '2024-09-27 16:50:12',
      user: '管理者（山田）',
      ip: '192.168.1.100',
      action: 'EXPORT_CSV',
      resource: 'shift_2024_10',
      status: 'success',
    },
    {
      id: 5,
      timestamp: '2024-09-27 16:45:30',
      user: '管理者（山田）',
      ip: '192.168.1.100',
      action: 'UPDATE_SHIFT',
      resource: 'shift_2024_10',
      status: 'success',
    },
  ]

  // 詳細表示の場合
  if (selectedMonth) {
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
        <div className="mb-4 flex items-center justify-between flex-shrink-0 px-8 pt-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {selectedMonth.year}年{selectedMonth.month}月のシフト詳細
              <span className="text-sm font-normal text-gray-600 ml-3">
                全{detailShifts.length}件
              </span>
            </h1>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportCSV}>
              <Download className="h-3 w-3 mr-1" />
              CSVエクスポート
            </Button>
            <Button size="sm" variant="outline" onClick={backToSummary}>
              <ArrowLeft className="h-3 w-3 mr-1" />
              戻る
            </Button>
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
                      console.log('Store checkbox changed:', store.store_name, e.target.checked, 'selectedStores:', Array.from(newSelected))
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{store.store_name}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* マルチストアシフトテーブル */}
        <div className="flex-1 overflow-hidden px-8 mb-4">
          <MultiStoreShiftTable
            year={selectedMonth.year}
            month={selectedMonth.month}
            shiftData={shiftData}
            staffMap={staffMap}
            storesMap={storesMap}
            selectedStores={selectedStores}
            onDayClick={handleDayClick}
          />
        </div>

          {/* タイムライン表示 */}
          <AnimatePresence>
            {selectedDay && (
              <ShiftTimeline
                date={selectedDay}
                year={selectedMonth.year}
                month={selectedMonth.month}
                shifts={dayShifts}
                onClose={closeDayView}
                storeName={selectedMonth.storeName}
              />
            )}
          </AnimatePresence>
      </motion.div>
    )
  }

  // 月次サマリー表示
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="h-screen overflow-hidden flex flex-col pt-8 px-8"
    >
        {/* 年・店舗選択 */}
        <div className="flex items-center justify-center gap-6 mb-8">
          {/* 年選択 */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedYear(selectedYear - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-2xl font-bold">{selectedYear}年</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(selectedYear + 1)}
              disabled={selectedYear >= new Date().getFullYear()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 店舗選択 */}
          {!hideStoreSelector && availableStores.length > 1 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <Store className="h-4 w-4 text-slate-600" />
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="text-sm font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer"
              >
                <option value="all">全店舗</option>
                {availableStores.map(store => (
                  <option key={store.store_id} value={store.store_id}>
                    {store.store_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 月別カード表示 */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
              // 選択された店舗のサマリーを取得（複数店舗の場合は合算）
              const summaries = selectedStore === 'all'
                ? monthlySummary.filter(m => parseInt(m.month) === month)
                : monthlySummary.filter(m =>
                    parseInt(m.month) === month &&
                    parseInt(m.store_id) === parseInt(selectedStore)
                  )

              const hasSummary = summaries.length > 0
              const totalShiftCount = summaries.reduce((sum, s) => sum + (s.shift_count || 0), 0)
              const totalHours = summaries.reduce((sum, s) => sum + (s.total_hours || 0), 0)
              const totalStaffCount = summaries.reduce((sum, s) => sum + (s.staff_count || 0), 0)

              return (
                <Card key={month} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{month}月</span>
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasSummary ? (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>勤務スタッフ: {totalStaffCount}名</div>
                          <div>シフト数: {totalShiftCount}件</div>
                          <div>総労働時間: {totalHours.toFixed(1)}h</div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleMonthClick(selectedYear, month, null)}
                        >
                          閲覧
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">データなし</div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
    </motion.div>
  )
}

export default History
