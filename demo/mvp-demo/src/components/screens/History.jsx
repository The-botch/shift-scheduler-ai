import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  ChevronLeft,
  History as HistoryIcon,
  User,
  Calendar,
  Edit3,
  FileText,
  Download,
  ArrowLeft,
  TrendingUp,
  Clock,
  DollarSign,
  Users as UsersIcon,
  Loader2
} from 'lucide-react'
import Papa from 'papaparse'
import ShiftTimeline from '../shared/ShiftTimeline'

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

const History = ({ onPrev }) => {
  const [loading, setLoading] = useState(true)
  const [monthlySummary, setMonthlySummary] = useState([])
  const [shiftHistory, setShiftHistory] = useState([])
  const [octoberShifts, setOctoberShifts] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [detailShifts, setDetailShifts] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayShifts, setDayShifts] = useState([])

  useEffect(() => {
    loadHistoryData()
  }, [])

  const loadHistoryData = async () => {
    try {
      setLoading(true)

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
      setMonthlySummary(summaryResult.data)

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
    // 10月2024の場合は承認済みデータを表示
    if (year === 2024 && month === 10) {
      setDetailShifts(octoberShifts)
    } else {
      // それ以外は履歴データから該当月を抽出
      const filtered = shiftHistory.filter(s => s.year === year && s.month === month)
      setDetailShifts(filtered)
    }
    setSelectedMonth({ year, month })
  }

  const backToSummary = () => {
    setSelectedMonth(null)
    setDetailShifts([])
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

  if (loading) {
    return (
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="container mx-auto px-4 py-8"
      >
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">履歴データを読み込んでいます...</p>
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
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="container mx-auto px-4 py-8"
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
            {selectedMonth.year === 2024 && selectedMonth.month === 10 ? '承認済み' : '実績'} · 全{detailShifts.length}件
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              シフト詳細
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarView
              selectedMonth={selectedMonth}
              calendarData={getCalendarData()}
              onDayClick={handleDayClick}
            />
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
      className="container mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          シフト履歴
        </h1>
        <p className="text-lg text-gray-600">過去1年分のシフト実績と10月の承認済みシフト</p>
      </div>

      {/* 月次サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthlySummary.map((summary, index) => (
          <motion.div
            key={`${summary.year}-${summary.month}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`shadow-lg border-2 hover:shadow-xl transition-all cursor-pointer ${
                summary.year === 2024 && summary.month === 10
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
                  {summary.year === 2024 && summary.month === 10 && (
                    <span className="px-2 py-1 text-xs font-bold bg-green-600 text-white rounded">
                      承認済
                    </span>
                  )}
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
    </motion.div>
  )
}

export default History
