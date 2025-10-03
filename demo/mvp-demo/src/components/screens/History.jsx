import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  ChevronLeft,
  ChevronRight,
  History as HistoryIcon,
  User,
  Calendar,
  Edit3,
  FileText,
  Download,
  Upload,
  ArrowLeft,
  TrendingUp,
  Clock,
  DollarSign,
  Users as UsersIcon,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import Papa from 'papaparse'
import ShiftTimeline from '../shared/ShiftTimeline'
import { exportCSV, generateFilename } from '../../utils/csvHelper'
import AppHeader from '../shared/AppHeader'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
}

// カレンダービューコンポーネント
const CalendarView = ({ selectedMonth, calendarData, onDayClick }) => {
  const { daysInMonth, firstDay, shiftsByDate } = calendarData
  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  // カレンダーグリッド用の配列を作成
  const calendarDays = []
  // 月初の空セル
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  // 日付セル
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div>
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-1 text-center text-xs font-bold bg-blue-50 rounded">
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            // 空セル
            return <div key={`empty-${index}`} className="min-h-[60px]" />
          }

          const dayShifts = shiftsByDate[day] || []
          const dayOfWeek = (firstDay + day - 1) % 7
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
          const hasModified = dayShifts.some(s => s.modified_flag)

          return (
            <motion.div
              key={day}
              className={`p-1 border rounded min-h-[60px] cursor-pointer hover:shadow-md transition-shadow ${
                hasModified ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100' :
                isWeekend ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'border-gray-200 hover:bg-gray-50'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => dayShifts.length > 0 && onDayClick(day)}
            >
              <div className={`text-xs font-bold mb-0.5 ${
                hasModified ? 'text-yellow-700' : 'text-gray-700'
              }`}>
                {day}
              </div>
              {dayShifts.slice(0, 2).map((shift, idx) => (
                <motion.div
                  key={shift.shift_id}
                  className={`text-xs p-0.5 rounded mb-0.5 ${
                    shift.modified_flag
                      ? 'bg-yellow-200 border border-yellow-400'
                      : 'bg-green-100 border border-green-300'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 + idx * 0.05 }}
                >
                  <div className={`font-medium text-xs leading-tight ${
                    shift.modified_flag ? 'text-yellow-900' : 'text-green-800'
                  }`}>
                    {shift.staff_name}
                  </div>
                  <div className={`text-xs ${
                    shift.modified_flag ? 'text-yellow-700' : 'text-green-700'
                  }`}>
                    {shift.start_time}-{shift.end_time}
                  </div>
                </motion.div>
              ))}
              {dayShifts.length > 2 && (
                <div className="text-xs text-gray-500">+{dayShifts.length - 2}</div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 bg-green-100 border border-green-300 rounded mr-1.5"></div>
          <span>配置済み</span>
        </div>
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 bg-yellow-200 border border-yellow-400 rounded mr-1.5"></div>
          <span>修正あり</span>
        </div>
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 bg-blue-50 border border-blue-200 rounded mr-1.5"></div>
          <span>土日</span>
        </div>
      </div>
    </div>
  )
}

const History = ({ onPrev, initialMonth }) => {
  const [loading, setLoading] = useState(true)
  const [monthlySummary, setMonthlySummary] = useState([])
  const [shiftHistory, setShiftHistory] = useState([])
  const [octoberShifts, setOctoberShifts] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || null)
  const [detailShifts, setDetailShifts] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayShifts, setDayShifts] = useState([])
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' or 'staff'
  const [staffMap, setStaffMap] = useState({}) // スタッフID -> スタッフ情報
  const [rolesMap, setRolesMap] = useState({}) // 役職ID -> 役職名
  const [actualData, setActualData] = useState(null) // インポートした実績データ
  const [showDiff, setShowDiff] = useState(false) // 差分表示モード
  const [diffAnalysis, setDiffAnalysis] = useState(null) // 差分分析結果
  const [monthStatus, setMonthStatus] = useState({}) // 月別ステータス管理
  const [selectedYear, setSelectedYear] = useState(2024) // 選択中の年

  useEffect(() => {
    loadHistoryData()
    loadMonthStatus()
  }, [])

  // initialMonthが設定されている場合、データ読み込み完了後に自動的に開く
  useEffect(() => {
    if (!loading && initialMonth && staffMap && Object.keys(staffMap).length > 0) {
      handleMonthClick(initialMonth.year, initialMonth.month)
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
        updated_at: new Date().toISOString()
      }
    }
    setMonthStatus(newStatus)
    localStorage.setItem('month_status', JSON.stringify(newStatus))
  }

  // 月のステータス取得
  const getMonthStatus = (year, month) => {
    const key = `${year}_${month}`
    return monthStatus[key] || {
      shift_status: 'draft', // 'draft' | 'approved' | 'completed'
      actual_imported: false,
      actual_import_date: null
    }
  }

  const loadHistoryData = async () => {
    try {
      setLoading(true)

      // スタッフマスターデータを読み込み
      const staffResponse = await fetch('/data/master/staff.csv')
      const staffText = await staffResponse.text()
      const staffResult = await new Promise((resolve) => {
        Papa.parse(staffText, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: resolve
        })
      })

      // 役職マスターデータを読み込み
      const rolesResponse = await fetch('/data/master/roles.csv')
      const rolesText = await rolesResponse.text()
      const rolesResult = await new Promise((resolve) => {
        Papa.parse(rolesText, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: resolve
        })
      })

      // スタッフマップと役職マップを作成
      const staffMapping = {}
      staffResult.data.forEach(staff => {
        staffMapping[staff.staff_id] = staff
      })
      setStaffMap(staffMapping)

      const rolesMapping = {}
      rolesResult.data.forEach(role => {
        rolesMapping[role.role_id] = role.role_name
      })
      setRolesMap(rolesMapping)

      // 月次サマリーを読み込み
      const summaryResponse = await fetch('/data/history/shift_monthly_summary.csv')
      const summaryText = await summaryResponse.text()
      const summaryResult = await new Promise((resolve) => {
        Papa.parse(summaryText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve
        })
      })

      // LocalStorageから承認されたシフトを読み込み
      const approvedFirstPlan = localStorage.getItem('approved_first_plan_2024_10')
      const approvedSecondPlan = localStorage.getItem('approved_second_plan_2024_10')
      let summaryData = summaryResult.data

      // 全ての月に確定済みステータスを設定
      summaryData = summaryData.map(s => ({
        ...s,
        status: 'completed'
      }))

      // 2024年10月を除外（承認がない限り表示しない）
      summaryData = summaryData.filter(s => !(s.year === 2024 && s.month === 10))

      // 第2案承認が優先（第1案より後に承認されるため）
      if (approvedSecondPlan) {
        const approvedData = JSON.parse(approvedSecondPlan)
        const approvedSummary = {
          year: approvedData.year,
          month: approvedData.month,
          total_hours: approvedData.stats.totalHours || 0,
          total_wage: 0,
          total_shifts: approvedData.stats.totalShifts || 0,
          fill_rate: 97,
          notes: `第2案確定済み (${new Date(approvedData.approvedAt).toLocaleDateString('ja-JP')}) - ${approvedData.stats.resolvedIssues}/${approvedData.stats.totalIssues}問題解決済み`,
          status: 'second_plan_approved'
        }
        summaryData.push(approvedSummary)
      } else if (approvedFirstPlan) {
        const approvedData = JSON.parse(approvedFirstPlan)
        // 仮承認データを追加
        const approvedSummary = {
          year: approvedData.year,
          month: approvedData.month,
          total_hours: approvedData.stats.totalHours || 0,
          total_wage: 0, // 仮承認時は未計算
          total_shifts: approvedData.stats.totalShifts || 0,
          fill_rate: 95, // 仮の充足率
          notes: `第1案仮承認 (${new Date(approvedData.approvedAt).toLocaleDateString('ja-JP')})`,
          status: 'first_plan_approved'
        }

        summaryData.push(approvedSummary)
      }

      setMonthlySummary(summaryData)

      // 過去のシフト履歴を読み込み
      const historyResponse = await fetch('/data/history/shift_history_2023-2024.csv')
      const historyText = await historyResponse.text()
      const historyResult = await new Promise((resolve) => {
        Papa.parse(historyText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve
        })
      })
      setShiftHistory(historyResult.data)

      // 10月のシフトデータを読み込み
      const octoberResponse = await fetch('/data/history/shift_october_2024.csv')
      const octoberText = await octoberResponse.text()
      const octoberResult = await new Promise((resolve) => {
        Papa.parse(octoberText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve
        })
      })
      setOctoberShifts(octoberResult.data)
    } catch (err) {
      console.error('履歴データ読み込みエラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthClick = (year, month) => {
    // LocalStorageから承認データを確認
    const approvedFirstPlan = localStorage.getItem('approved_first_plan_2024_10')
    const approvedSecondPlan = localStorage.getItem('approved_second_plan_2024_10')

    if (year === 2024 && month === 10 && approvedSecondPlan) {
      // 第2案確定データをHistory画面用フォーマットに変換
      const approvedData = JSON.parse(approvedSecondPlan)
      const transformedShifts = approvedData.csvShifts.map(shift => {
        // スタッフIDから役職を取得
        const staff = staffMap[shift.staff_id]
        const roleName = staff ? rolesMap[staff.role_id] : '一般スタッフ'

        return {
          shift_id: shift.shift_id,
          date: shift.date,
          day_of_week: shift.day_of_week,
          staff_name: shift.staff_name,
          role: roleName,
          start_time: shift.start_time,
          end_time: shift.end_time,
          skill_level: shift.skill_level,
          planned_hours: shift.total_hours,
          actual_hours: shift.total_hours,
          modified_flag: shift.is_modified || false
        }
      })

      setDetailShifts(transformedShifts)
    } else if (year === 2024 && month === 10 && approvedFirstPlan) {
      // 第1案仮承認データをHistory画面用フォーマットに変換
      const approvedData = JSON.parse(approvedFirstPlan)
      const transformedShifts = []

      approvedData.shifts.forEach(dayData => {
        dayData.shifts.forEach((shift, index) => {
          // 時間を分割
          const [startTime, endTime] = shift.time.split('-')

          // スタッフ名から役職を取得
          const staff = Object.values(staffMap).find(s => s.name === shift.name)
          const roleName = staff ? rolesMap[staff.role_id] : shift.role || '一般スタッフ'

          transformedShifts.push({
            shift_id: `FP_${dayData.date}_${index}`,
            date: dayData.date,
            day_of_week: dayData.day,
            staff_name: shift.name,
            role: roleName,
            start_time: startTime,
            end_time: endTime,
            skill_level: shift.skill,
            planned_hours: shift.hours,
            actual_hours: shift.hours,
            modified_flag: false
          })
        })
      })

      setDetailShifts(transformedShifts)
    } else if (year === 2024 && month === 10) {
      // 承認がない場合は承認済みCSVデータを表示（役職をマスターから取得）
      const transformedOctober = octoberShifts.map(shift => {
        const staff = staffMap[shift.staff_id]
        const roleName = staff ? rolesMap[staff.role_id] : shift.role || '一般スタッフ'
        return {
          ...shift,
          role: roleName
        }
      })
      setDetailShifts(transformedOctober)
    } else {
      // それ以外は履歴データから該当月を抽出（役職をマスターから取得）
      const filtered = shiftHistory.filter(s => s.year === year && s.month === month)
      const transformedHistory = filtered.map(shift => {
        const staff = staffMap[shift.staff_id]
        const roleName = staff ? rolesMap[staff.role_id] : shift.role || '一般スタッフ'
        return {
          ...shift,
          role: roleName
        }
      })
      setDetailShifts(transformedHistory)
    }
    setSelectedMonth({ year, month })
  }

  const backToSummary = () => {
    setSelectedMonth(null)
    setDetailShifts([])
  }

  const handleExportCSV = () => {
    if (!selectedMonth || detailShifts.length === 0) {
      alert('エクスポートするデータがありません')
      return
    }

    const filename = `shift_history_${selectedMonth.year}_${String(selectedMonth.month).padStart(2, '0')}.csv`
    const result = exportCSV(detailShifts, filename)

    if (result.success) {
      alert(`✅ ${selectedMonth.year}年${selectedMonth.month}月のシフトデータをエクスポートしました`)
    } else {
      alert(`❌ エクスポートに失敗しました: ${result.error}`)
    }
  }

  // 実績CSVインポート
  const handleImportActual = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      Papa.parse(e.target.result, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            // 実績データを保存
            setActualData(results.data)

            // 予定データと比較して差分分析
            analyzeDifference(results.data)

            // ステータスを更新
            if (selectedMonth) {
              saveMonthStatus(selectedMonth.year, selectedMonth.month, {
                actual_imported: true,
                actual_import_date: new Date().toISOString()
              })
            }

            alert(`✅ 実績データ ${results.data.length}件をインポートしました`)
          } else {
            alert('❌ 有効なデータが見つかりませんでした')
          }
        },
        error: (error) => {
          alert(`❌ インポートエラー: ${error.message}`)
        }
      })
    }
    reader.readAsText(file)
    // リセット（同じファイルを再度選択できるように）
    event.target.value = ''
  }

  // 予定vs実績の差分分析
  const analyzeDifference = (actualShifts) => {
    if (!selectedMonth || !detailShifts || detailShifts.length === 0) {
      alert('予定データが見つかりません')
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
        costDiff: 0
      },
      staffDiff: {},
      dateDiff: {}
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
          differences: []
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
            diff: hoursDiff
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
          type: 'added'
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
          differences: []
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
        type: 'removed'
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

  const handleDayClick = (day) => {
    const shifts = detailShifts.filter(s => s.date === day)
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
          modifiedCount: 0
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
      <div className="min-h-screen bg-slate-50">
        <AppHeader onHome={onPrev} />

        <motion.div
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="app-container"
        >
          <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">履歴データを読み込んでいます...</p>
          </div>
        </motion.div>
      </div>
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
      reason: 'スタッフ希望による変更'
    },
    {
      id: 2,
      timestamp: '2024-09-28 14:20:15',
      user: 'AI自動調整',
      action: 'シフト生成',
      target: '10月全体',
      detail: '第2案生成完了（希望反映率92%）',
      reason: 'スタッフ希望を反映'
    },
    {
      id: 3,
      timestamp: '2024-09-27 16:45:30',
      user: '管理者（山田）',
      action: 'シフト変更',
      target: '10月15日 佐藤さん',
      detail: '休み → 9:00-17:00',
      reason: '人員不足の補充'
    },
    {
      id: 4,
      timestamp: '2024-09-26 10:00:00',
      user: 'AI自動生成',
      action: 'シフト生成',
      target: '10月全体',
      detail: '第1案生成完了',
      reason: '初期案の自動生成'
    },
    {
      id: 5,
      timestamp: '2024-09-25 18:30:45',
      user: '管理者（山田）',
      action: 'マスターデータ更新',
      target: 'スタッフ情報',
      detail: '新規スタッフ「高橋」追加',
      reason: '新規採用'
    }
  ]

  const auditLog = [
    {
      id: 1,
      timestamp: '2024-09-28 14:35:22',
      user: '管理者（山田）',
      ip: '192.168.1.100',
      action: 'UPDATE_SHIFT',
      resource: 'shift_2024_10',
      status: 'success'
    },
    {
      id: 2,
      timestamp: '2024-09-28 14:20:15',
      user: 'SYSTEM',
      ip: 'localhost',
      action: 'GENERATE_SHIFT',
      resource: 'shift_2024_10',
      status: 'success'
    },
    {
      id: 3,
      timestamp: '2024-09-28 09:15:30',
      user: '管理者（山田）',
      ip: '192.168.1.100',
      action: 'LOGIN',
      resource: 'auth',
      status: 'success'
    },
    {
      id: 4,
      timestamp: '2024-09-27 16:50:12',
      user: '管理者（山田）',
      ip: '192.168.1.100',
      action: 'EXPORT_CSV',
      resource: 'shift_2024_10',
      status: 'success'
    },
    {
      id: 5,
      timestamp: '2024-09-27 16:45:30',
      user: '管理者（山田）',
      ip: '192.168.1.100',
      action: 'UPDATE_SHIFT',
      resource: 'shift_2024_10',
      status: 'success'
    }
  ]

  // 詳細表示の場合
  if (selectedMonth) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader onHome={onPrev} />

        <motion.div
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="app-container"
        >
          <div className="mb-8">
          <Button
            variant="outline"
            onClick={backToSummary}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            サマリーに戻る
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            {selectedMonth.year}年{selectedMonth.month}月のシフト詳細
          </h1>
          <p className="text-lg text-gray-600">
            {(() => {
              const approvedFirstPlan = localStorage.getItem('approved_first_plan_2024_10')
              const approvedSecondPlan = localStorage.getItem('approved_second_plan_2024_10')
              if (selectedMonth.year === 2024 && selectedMonth.month === 10 && approvedSecondPlan) {
                return '確定済み (第2案)'
              } else if (selectedMonth.year === 2024 && selectedMonth.month === 10 && approvedFirstPlan) {
                return '仮承認 (第1案)'
              } else if (selectedMonth.year === 2024 && selectedMonth.month === 10) {
                return '承認済み'
              } else {
                return '実績'
              }
            })()} · 全{detailShifts.length}件
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                シフト詳細
              </div>
              <div className="flex gap-2">
                {showDiff && diffAnalysis && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setViewMode('diff')}
                    className="text-sm bg-orange-600 hover:bg-orange-700"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    予実差分
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportCSV}
                  className="text-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSVエクスポート
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {viewMode === 'diff' && diffAnalysis ? (
              <div className="space-y-6">
                {/* サマリー */}
                <Card className="border-2 border-orange-300 bg-orange-50">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                      予実差分サマリー
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">シフト数</p>
                        <p className="text-sm">
                          予定: <span className="font-bold">{diffAnalysis.totalDiff.plannedShifts}</span>
                        </p>
                        <p className="text-sm">
                          実績: <span className="font-bold">{diffAnalysis.totalDiff.actualShifts}</span>
                        </p>
                        <p className={`text-sm font-bold ${diffAnalysis.totalDiff.shiftCountDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          差分: {diffAnalysis.totalDiff.shiftCountDiff > 0 ? '+' : ''}{diffAnalysis.totalDiff.shiftCountDiff}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">総労働時間</p>
                        <p className="text-sm">
                          予定: <span className="font-bold">{diffAnalysis.totalDiff.plannedHours.toFixed(1)}h</span>
                        </p>
                        <p className="text-sm">
                          実績: <span className="font-bold">{diffAnalysis.totalDiff.actualHours.toFixed(1)}h</span>
                        </p>
                        <p className={`text-sm font-bold ${diffAnalysis.totalDiff.hoursDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          差分: {diffAnalysis.totalDiff.hoursDiff > 0 ? '+' : ''}{diffAnalysis.totalDiff.hoursDiff.toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">人件費</p>
                        <p className="text-sm">
                          予定: <span className="font-bold">¥{diffAnalysis.totalDiff.plannedCost.toLocaleString()}</span>
                        </p>
                        <p className="text-sm">
                          実績: <span className="font-bold">¥{diffAnalysis.totalDiff.actualCost.toLocaleString()}</span>
                        </p>
                        <p className={`text-sm font-bold ${diffAnalysis.totalDiff.costDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          差分: {diffAnalysis.totalDiff.costDiff > 0 ? '+' : ''}¥{diffAnalysis.totalDiff.costDiff.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* スタッフ別差分 */}
                <div>
                  <h3 className="font-bold text-lg mb-3">スタッフ別差分</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.values(diffAnalysis.staffDiff).map((staff, index) => (
                      <motion.div
                        key={staff.staff_name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`border-2 ${Math.abs(staff.hoursDiff) > 3 ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                          <CardContent className="p-4">
                            <h4 className="font-bold text-md mb-2">{staff.staff_name}</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">予定勤務:</span>
                                <span className="font-medium">{staff.plannedDays}日 / {staff.plannedHours.toFixed(1)}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">実績勤務:</span>
                                <span className="font-medium">{staff.actualDays}日 / {staff.actualHours.toFixed(1)}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">時間差分:</span>
                                <span className={`font-bold ${staff.hoursDiff > 0 ? 'text-green-600' : staff.hoursDiff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {staff.hoursDiff > 0 ? '+' : ''}{staff.hoursDiff.toFixed(1)}h
                                </span>
                              </div>
                              {staff.differences.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs text-gray-500 mb-1">差分詳細:</p>
                                  <div className="space-y-0.5 max-h-32 overflow-y-auto">
                                    {staff.differences.map((diff, idx) => (
                                      <div key={idx} className="text-xs flex justify-between">
                                        <span>{diff.date}日:</span>
                                        <span className={diff.type === 'added' ? 'text-green-600' : diff.type === 'removed' ? 'text-red-600' : 'text-orange-600'}>
                                          {diff.type === 'added' ? '追加' : diff.type === 'removed' ? '削除' : `${diff.plannedHours}h → ${diff.actualHours}h`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <CalendarView
                selectedMonth={selectedMonth}
                calendarData={getCalendarData()}
                onDayClick={handleDayClick}
              />
            )}
          </CardContent>
        </Card>

        {/* タイムライン表示 */}
        <AnimatePresence>
          {selectedDay && (
            <ShiftTimeline
              date={selectedDay}
              year={selectedMonth.year}
              month={selectedMonth.month}
              shifts={dayShifts}
              onClose={closeDayView}
            />
          )}
        </AnimatePresence>
        </motion.div>
      </div>
    )
  }

  // 月次サマリー表示
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader onHome={onPrev} />

      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="app-container"
      >
        <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          シフト履歴
        </h1>
        <p className="text-lg text-gray-600">月別のシフト実績</p>
      </div>

      {/* 年選択 */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedYear(selectedYear - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-2xl font-bold">{selectedYear}年</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedYear(selectedYear + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 月次サマリーカード */}
      {monthlySummary.filter(summary => summary.year === selectedYear).length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            {selectedYear}年のシフトデータはありません
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthlySummary
          .filter(summary => summary.year === selectedYear)
          .map((summary, index) => (
          <motion.div
            key={`${summary.year}-${summary.month}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`shadow-lg border-2 hover:shadow-xl transition-all cursor-pointer ${
                summary.status === 'second_plan_approved'
                  ? 'border-blue-500 bg-blue-50'
                  : summary.status === 'first_plan_approved'
                  ? 'border-yellow-500 bg-yellow-50'
                  : summary.status === 'completed'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-blue-400'
              }`}
              onClick={() => handleMonthClick(summary.year, summary.month)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {summary.year}年{summary.month}月
                  </CardTitle>
                  {summary.status === 'second_plan_approved' ? (
                    <span className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded">
                      確定済
                    </span>
                  ) : summary.status === 'first_plan_approved' ? (
                    <span className="px-2 py-1 text-xs font-bold bg-yellow-600 text-white rounded">
                      仮承認
                    </span>
                  ) : summary.status === 'completed' ? (
                    <span className="px-2 py-1 text-xs font-bold bg-green-600 text-white rounded">
                      確定済
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Clock className="h-4 w-4 text-blue-600 mr-1" />
                      <span className="text-xs text-blue-600">総労働時間</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900">{summary.total_hours}h</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center mb-1">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-xs text-green-600">総賃金</span>
                    </div>
                    <p className="text-lg font-bold text-green-900">¥{(summary.total_wage / 10000).toFixed(0)}万</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center mb-1">
                      <UsersIcon className="h-4 w-4 text-purple-600 mr-1" />
                      <span className="text-xs text-purple-600">総シフト数</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900">{summary.total_shifts}件</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center mb-1">
                      <TrendingUp className="h-4 w-4 text-orange-600 mr-1" />
                      <span className="text-xs text-orange-600">充足率</span>
                    </div>
                    <p className="text-lg font-bold text-orange-900">{summary.fill_rate}%</p>
                  </div>
                </div>
                {summary.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{summary.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      )}
      </motion.div>
    </div>
  )
}

export default History
