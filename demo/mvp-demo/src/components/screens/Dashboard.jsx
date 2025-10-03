import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
  Users,
  FolderOpen,
  ClipboardList,
  Store,
  Shield,
  MessageSquare,
  Database,
  Clock,
  BarChart3
} from 'lucide-react'
import Papa from 'papaparse'
import { getAllData } from '../../utils/indexedDB'
import { INDEXED_DB } from '../../config/constants'

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

const Dashboard = ({ onNext, onHistory, onShiftManagement, onMonitoring, onStaffManagement, onStoreManagement, onConstraintManagement, onLineMessages, onActualDataImport }) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [annualSummary, setAnnualSummary] = useState(null)
  const [loadingAnnualSummary, setLoadingAnnualSummary] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadAnnualSummary()
  }, [])

  const loadAnnualSummary = async () => {
    try {
      setLoadingAnnualSummary(true)

      // Load all actual data from IndexedDB
      const actualShifts = await getAllData(INDEXED_DB.STORES.ACTUAL_SHIFTS)
      const actualPayroll = await getAllData(INDEXED_DB.STORES.PAYROLL)

      // Filter to only include 2024 data
      const actualShifts2024 = actualShifts.filter(shift => shift.year === 2024)
      const actualPayroll2024 = actualPayroll.filter(payroll => payroll.year === 2024)

      // If no actual data exists, don't show the summary
      if (actualShifts2024.length === 0 || actualPayroll2024.length === 0) {
        setAnnualSummary(null)
        return
      }

      // Load planned shifts from CSV
      const response = await fetch('/data/history/shift_history_2023-2024.csv')
      const text = await response.text()

      const result = await new Promise((resolve) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve
        })
      })

      // Filter to only include 2024 data
      const plannedShifts2024 = result.data.filter(shift => shift.year === 2024)

      // Calculate annual summary
      const summary = calculateAnnualSummary(plannedShifts2024, actualShifts2024, actualPayroll2024)
      setAnnualSummary(summary)
    } catch (err) {
      console.error('年次サマリー読み込みエラー:', err)
      setAnnualSummary(null)
    } finally {
      setLoadingAnnualSummary(false)
    }
  }

  const calculateAnnualSummary = (plannedShifts, actualShifts, actualPayroll) => {
    const summary = {
      year: 2024,
      plannedShifts: plannedShifts.length,
      actualShifts: actualShifts.length,
      shiftCountDiff: 0,
      plannedHours: 0,
      actualHours: 0,
      hoursDiff: 0,
      plannedCost: 0,
      actualCost: 0,
      costDiff: 0,
      costDiffPercent: 0,
      monthsWithData: new Set()
    }

    // Calculate planned totals
    plannedShifts.forEach(shift => {
      summary.plannedHours += parseFloat(shift.actual_hours || 0)
      summary.plannedCost += parseFloat(shift.daily_wage || 0)
    })

    // Calculate actual totals
    actualShifts.forEach(shift => {
      summary.actualHours += parseFloat(shift.actual_hours || 0)
      summary.monthsWithData.add(`${shift.year}-${shift.month}`)
    })

    actualPayroll.forEach(payroll => {
      summary.actualCost += parseInt(payroll.gross_salary || 0)
    })

    // Calculate differences
    summary.shiftCountDiff = summary.actualShifts - summary.plannedShifts
    summary.hoursDiff = summary.actualHours - summary.plannedHours
    summary.costDiff = summary.actualCost - summary.plannedCost
    summary.costDiffPercent = summary.plannedCost > 0
      ? ((summary.costDiff / summary.plannedCost) * 100).toFixed(1)
      : 0
    summary.monthsCount = summary.monthsWithData.size

    return summary
  }

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const weekday = weekdays[date.getDay()]
    return `${year}年${month}月${day}日（${weekday}）`
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="container mx-auto px-4 py-8"
    >
      {/* ヘッダー */}
      <div className="mb-8">
        {/* 日付と時刻 */}
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <span>{formatDate(currentTime)}</span>
        </div>

        {/* トップバー：右上にナビゲーション */}
        <div className="flex justify-end items-center mb-4">
          <div className="flex space-x-3">
            <Button variant="outline" size="sm" onClick={onShiftManagement}>
              <FolderOpen className="h-4 w-4 mr-2" />
              シフト管理
            </Button>
            <Button variant="outline" size="sm" onClick={onLineMessages} className="bg-blue-50 border-blue-300">
              <MessageSquare className="h-4 w-4 mr-2" />
              メッセージ管理
            </Button>
            <Button variant="outline" size="sm" onClick={onMonitoring} className="bg-blue-50 border-blue-300">
              <ClipboardList className="h-4 w-4 mr-2" />
              シフト希望管理
            </Button>
            <Button variant="outline" size="sm" onClick={onStaffManagement} className="bg-blue-50 border-blue-300">
              <Users className="h-4 w-4 mr-2" />
              スタッフ管理
            </Button>
            <Button variant="outline" size="sm" onClick={onStoreManagement} className="bg-green-50 border-green-300">
              <Store className="h-4 w-4 mr-2" />
              店舗管理
            </Button>
            <Button variant="outline" size="sm" onClick={onConstraintManagement} className="bg-purple-50 border-purple-300">
              <Shield className="h-4 w-4 mr-2" />
              制約管理
            </Button>
            <Button variant="outline" size="sm" onClick={onActualDataImport} className="bg-orange-50 border-orange-300">
              <Database className="h-4 w-4 mr-2" />
              実績管理
            </Button>
          </div>
        </div>

        {/* タイトル */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            KPIダッシュボード
          </h1>
        </div>
      </div>

      {/* 年次予実差分サマリー */}
      {!loadingAnnualSummary && annualSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="shadow-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8" />
                  <CardTitle className="text-2xl">2024年 予実差分サマリー</CardTitle>
                </div>
                <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  {annualSummary.monthsCount}ヶ月分のデータ
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* シフト数 */}
                <div className="bg-white p-5 rounded-lg shadow-sm border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-600">シフト数</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">予定: <span className="font-bold text-gray-700">{annualSummary.plannedShifts.toLocaleString()}</span></p>
                    <p className="text-xs text-gray-500">実績: <span className="font-bold text-gray-700">{annualSummary.actualShifts.toLocaleString()}</span></p>
                    <p className={`text-lg font-bold mt-2 ${annualSummary.shiftCountDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {annualSummary.shiftCountDiff > 0 ? '+' : ''}{annualSummary.shiftCountDiff.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 労働時間 */}
                <div className="bg-white p-5 rounded-lg shadow-sm border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <p className="text-sm font-semibold text-gray-600">総労働時間</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">予定: <span className="font-bold text-gray-700">{annualSummary.plannedHours.toLocaleString()}h</span></p>
                    <p className="text-xs text-gray-500">実績: <span className="font-bold text-gray-700">{annualSummary.actualHours.toLocaleString()}h</span></p>
                    <p className={`text-lg font-bold mt-2 ${annualSummary.hoursDiff > 0 ? 'text-red-600' : annualSummary.hoursDiff < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {annualSummary.hoursDiff > 0 ? '+' : ''}{annualSummary.hoursDiff.toFixed(1)}h
                    </p>
                  </div>
                </div>

                {/* 人件費 */}
                <div className="bg-white p-5 rounded-lg shadow-sm border-2 border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-red-600" />
                    <p className="text-sm font-semibold text-gray-600">人件費</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">予定: <span className="font-bold text-gray-700">¥{annualSummary.plannedCost.toLocaleString()}</span></p>
                    <p className="text-xs text-gray-500">実績: <span className="font-bold text-gray-700">¥{annualSummary.actualCost.toLocaleString()}</span></p>
                    <p className={`text-lg font-bold mt-2 ${annualSummary.costDiff > 0 ? 'text-red-600' : annualSummary.costDiff < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {annualSummary.costDiff > 0 ? '+' : ''}¥{annualSummary.costDiff.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 人件費乖離率 */}
                <div className="bg-white p-5 rounded-lg shadow-sm border-2 border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-semibold text-gray-600">人件費乖離率</p>
                  </div>
                  <div className="flex items-center justify-center h-16">
                    <p className={`text-3xl font-bold ${Math.abs(parseFloat(annualSummary.costDiffPercent)) > 5 ? 'text-red-600' : Math.abs(parseFloat(annualSummary.costDiffPercent)) > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {annualSummary.costDiffPercent > 0 ? '+' : ''}{annualSummary.costDiffPercent}%
                    </p>
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    {Math.abs(parseFloat(annualSummary.costDiffPercent)) <= 2 && '目標範囲内'}
                    {Math.abs(parseFloat(annualSummary.costDiffPercent)) > 2 && Math.abs(parseFloat(annualSummary.costDiffPercent)) <= 5 && '注意が必要'}
                    {Math.abs(parseFloat(annualSummary.costDiffPercent)) > 5 && '要対策'}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">分析期間:</span> 2024年1月〜{annualSummary.monthsCount}月 ({annualSummary.monthsCount}ヶ月分のデータ)
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  ※ 実績データが登録されている月のみを集計しています。詳細な月別分析は「実績管理」画面から確認できます。
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 2024年着地見込み */}
      {!loadingAnnualSummary && annualSummary && annualSummary.monthsCount < 12 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="shadow-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8" />
                  <CardTitle className="text-2xl">2024年 着地見込み</CardTitle>
                </div>
                <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  実績{annualSummary.monthsCount}ヶ月 + 予測{12 - annualSummary.monthsCount}ヶ月
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {(() => {
                const remainingMonths = 12 - annualSummary.monthsCount
                const avgShiftsPerMonth = annualSummary.actualShifts / annualSummary.monthsCount
                const avgHoursPerMonth = annualSummary.actualHours / annualSummary.monthsCount
                const avgCostPerMonth = annualSummary.actualCost / annualSummary.monthsCount

                const predictedShifts = Math.round(avgShiftsPerMonth * remainingMonths)
                const predictedHours = avgHoursPerMonth * remainingMonths
                const predictedCost = Math.round(avgCostPerMonth * remainingMonths)

                const totalShifts = annualSummary.actualShifts + predictedShifts
                const totalHours = annualSummary.actualHours + predictedHours
                const totalCost = annualSummary.actualCost + predictedCost

                // 予定との比較
                const plannedAnnualShifts = Math.round((annualSummary.plannedShifts / annualSummary.monthsCount) * 12)
                const plannedAnnualHours = (annualSummary.plannedHours / annualSummary.monthsCount) * 12
                const plannedAnnualCost = Math.round((annualSummary.plannedCost / annualSummary.monthsCount) * 12)

                const shiftDiff = totalShifts - plannedAnnualShifts
                const hoursDiff = totalHours - plannedAnnualHours
                const costDiff = totalCost - plannedAnnualCost
                const costDiffPercent = ((costDiff / plannedAnnualCost) * 100).toFixed(1)

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {/* シフト数 */}
                      <div className="bg-white p-5 rounded-lg shadow-md border-2 border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <CalendarIcon className="h-5 w-5 text-blue-600" />
                          <p className="text-sm font-semibold text-gray-600">シフト数（年間）</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>実績（{annualSummary.monthsCount}ヶ月）:</span>
                            <span className="font-bold">{annualSummary.actualShifts.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>予測（{remainingMonths}ヶ月）:</span>
                            <span className="font-bold">{predictedShifts.toLocaleString()}</span>
                          </div>
                          <div className="h-px bg-gray-300 my-2"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">着地見込み:</span>
                            <span className="text-2xl font-bold text-blue-600">{totalShifts.toLocaleString()}</span>
                          </div>
                          <div className={`text-xs text-right ${shiftDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            予定比 {shiftDiff > 0 ? '+' : ''}{shiftDiff.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* 労働時間 */}
                      <div className="bg-white p-5 rounded-lg shadow-md border-2 border-purple-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-5 w-5 text-purple-600" />
                          <p className="text-sm font-semibold text-gray-600">総労働時間（年間）</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>実績（{annualSummary.monthsCount}ヶ月）:</span>
                            <span className="font-bold">{annualSummary.actualHours.toLocaleString()}h</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>予測（{remainingMonths}ヶ月）:</span>
                            <span className="font-bold">{predictedHours.toFixed(1)}h</span>
                          </div>
                          <div className="h-px bg-gray-300 my-2"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">着地見込み:</span>
                            <span className="text-2xl font-bold text-purple-600">{totalHours.toFixed(1)}h</span>
                          </div>
                          <div className={`text-xs text-right ${hoursDiff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            予定比 {hoursDiff > 0 ? '+' : ''}{hoursDiff.toFixed(1)}h
                          </div>
                        </div>
                      </div>

                      {/* 人件費 */}
                      <div className="bg-white p-5 rounded-lg shadow-md border-2 border-red-200">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="h-5 w-5 text-red-600" />
                          <p className="text-sm font-semibold text-gray-600">人件費（年間）</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>実績（{annualSummary.monthsCount}ヶ月）:</span>
                            <span className="font-bold">¥{annualSummary.actualCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>予測（{remainingMonths}ヶ月）:</span>
                            <span className="font-bold">¥{predictedCost.toLocaleString()}</span>
                          </div>
                          <div className="h-px bg-gray-300 my-2"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">着地見込み:</span>
                            <span className="text-2xl font-bold text-red-600">¥{totalCost.toLocaleString()}</span>
                          </div>
                          <div className={`text-xs text-right ${costDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            予定比 {costDiff > 0 ? '+' : ''}¥{costDiff.toLocaleString()} ({costDiffPercent > 0 ? '+' : ''}{costDiffPercent}%)
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <span className="font-bold">予測方法:</span> {annualSummary.monthsCount}ヶ月の実績平均を基に、残り{remainingMonths}ヶ月を予測
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        ※ 月平均: シフト{Math.round(avgShiftsPerMonth)}回、労働時間{avgHoursPerMonth.toFixed(1)}h、人件費¥{Math.round(avgCostPerMonth).toLocaleString()}
                      </p>
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Dashboard
