import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { TrendingUp, DollarSign, Database, Clock, BarChart3, Calendar } from 'lucide-react'
import { AnalyticsRepository } from '../../infrastructure/repositories/AnalyticsRepository'
import { ShiftRepository } from '../../infrastructure/repositories/ShiftRepository'
import { getCurrentYear } from '../../config/constants'
import { useTenant } from '../../contexts/TenantContext'

const analyticsRepository = new AnalyticsRepository()
const shiftRepository = new ShiftRepository()
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

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

const Dashboard = ({
  onNext,
  onHistory,
  onShiftManagement,
  onMonitoring,
  onStaffManagement,
  onStoreManagement,
  onConstraintManagement,
  onLineMessages,
  onBudgetActualManagement,
  onDevTools,
}) => {
  const { tenantId } = useTenant()
  const [annualSummary, setAnnualSummary] = useState(null)
  const [loadingAnnualSummary, setLoadingAnnualSummary] = useState(true)
  const [monthlyData, setMonthlyData] = useState([])

  useEffect(() => {
    if (tenantId) {
      loadAnnualSummary()
    }
  }, [tenantId])

  const loadAnnualSummary = async () => {
    try {
      setLoadingAnnualSummary(true)

      // Load all data from Analytics API and Shift API
      const currentYear = getCurrentYear()
      const [actualPayrollData, actualSalesData, salesForecastData, shiftSummaryData] =
        await Promise.all([
          analyticsRepository.getPayroll({ year: currentYear, tenantId }),
          analyticsRepository.getSalesActual({ year: currentYear, tenantId }),
          analyticsRepository.getSalesForecast({ year: currentYear, tenantId }),
          shiftRepository.getSummary({ year: currentYear, tenantId }),
        ])

      // シフトデータをAPIから取得
      const actualShiftsData = shiftSummaryData || []
      const plannedShiftsData = shiftSummaryData || []

      // Always set monthlyData (empty array if no actual data) to show graph framework
      setMonthlyData([])

      // Calculate annual summary only if actual data exists
      if (actualPayrollData.length > 0) {
        const summary = calculateAnnualSummary(
          plannedShiftsData,
          actualShiftsData,
          actualPayrollData,
          salesForecastData,
          actualSalesData
        )
        setAnnualSummary(summary)

        const monthly = calculateMonthlyData(
          plannedShifts2025,
          actualShifts2025,
          actualPayroll2025,
          salesForecastData,
          actualSalesData
        )
        setMonthlyData(monthly)
      } else {
        setAnnualSummary(null)
      }
    } catch (err) {
      console.error('年次サマリー読み込みエラー:', err)
      setAnnualSummary(null)
    } finally {
      setLoadingAnnualSummary(false)
    }
  }

  const calculateAnnualSummary = (
    plannedShifts,
    actualShifts,
    actualPayroll,
    salesForecast,
    actualSales
  ) => {
    const summary = {
      year: 2025,
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
      forecastSales: 0,
      actualSalesTotal: 0,
      salesDiff: 0,
      salesDiffPercent: 0,
      monthsWithData: new Set(),
      monthsWithSalesData: new Set(),
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

    // Calculate sales forecast
    salesForecast.forEach(forecast => {
      summary.forecastSales += parseInt(forecast.forecasted_sales || 0)
    })

    // Calculate actual sales
    actualSales.forEach(sale => {
      summary.actualSalesTotal += parseInt(sale.actual_sales || 0)
      summary.monthsWithSalesData.add(`${sale.year}-${sale.month}`)
    })

    // Calculate differences
    summary.shiftCountDiff = summary.actualShifts - summary.plannedShifts
    summary.hoursDiff = summary.actualHours - summary.plannedHours
    summary.costDiff = summary.actualCost - summary.plannedCost
    summary.costDiffPercent =
      summary.plannedCost > 0 ? ((summary.costDiff / summary.plannedCost) * 100).toFixed(1) : 0
    summary.monthsCount = summary.monthsWithData.size

    // Calculate sales difference (only for months with actual sales data)
    if (summary.monthsWithSalesData.size > 0) {
      const avgForecastPerMonth = summary.forecastSales / 12
      const forecastForActualMonths = avgForecastPerMonth * summary.monthsWithSalesData.size
      summary.salesDiff = summary.actualSalesTotal - forecastForActualMonths
      summary.salesDiffPercent =
        forecastForActualMonths > 0
          ? ((summary.salesDiff / forecastForActualMonths) * 100).toFixed(1)
          : 0
    }
    summary.salesMonthsCount = summary.monthsWithSalesData.size

    // Calculate profit (sales - labor cost)
    if (summary.salesMonthsCount > 0 && summary.monthsCount > 0) {
      // Calculate profit for the same months
      const avgForecastPerMonth = summary.forecastSales / 12
      const forecastForActualMonths = avgForecastPerMonth * summary.monthsCount
      const plannedProfit = forecastForActualMonths - summary.plannedCost
      const actualProfit =
        (summary.actualSalesTotal / summary.salesMonthsCount) * summary.monthsCount -
        summary.actualCost

      summary.plannedProfit = Math.round(plannedProfit)
      summary.actualProfit = Math.round(actualProfit)
      summary.profitDiff = summary.actualProfit - summary.plannedProfit
      summary.profitDiffPercent =
        summary.plannedProfit !== 0
          ? ((summary.profitDiff / summary.plannedProfit) * 100).toFixed(1)
          : 0
    } else {
      summary.plannedProfit = 0
      summary.actualProfit = 0
      summary.profitDiff = 0
      summary.profitDiffPercent = 0
    }

    return summary
  }

  const calculateMonthlyData = (
    plannedShifts,
    actualShifts,
    actualPayroll,
    salesForecast,
    actualSales
  ) => {
    const months = []

    for (let month = 1; month <= 12; month++) {
      const monthPlannedShifts = plannedShifts.filter(s => s.month === month)
      const monthActualShifts = actualShifts.filter(s => s.month === month)
      const monthActualPayroll = actualPayroll.filter(p => p.month === month)
      const monthForecast = salesForecast.filter(f => parseInt(f.month) === month)
      const monthSales = actualSales.filter(s => s.month === month)

      const plannedCost = monthPlannedShifts.reduce(
        (sum, s) => sum + parseFloat(s.daily_wage || 0),
        0
      )
      const actualCost = monthActualPayroll.reduce(
        (sum, p) => sum + parseInt(p.gross_salary || 0),
        0
      )
      const forecastSales =
        monthForecast.length > 0 ? parseInt(monthForecast[0].forecasted_sales || 0) : 0
      const actualSalesValue = monthSales.length > 0 ? parseInt(monthSales[0].actual_sales || 0) : 0

      const plannedProfit = forecastSales - plannedCost
      const actualProfit = actualSalesValue > 0 ? actualSalesValue - actualCost : null

      const laborCostRatePlanned = forecastSales > 0 ? (plannedCost / forecastSales) * 100 : 0
      const laborCostRateActual =
        actualSalesValue > 0 ? (actualCost / actualSalesValue) * 100 : null

      months.push({
        month: `${month}月`,
        monthNum: month,
        forecastSales,
        actualSales: actualSalesValue || null,
        plannedCost: Math.round(plannedCost),
        actualCost: actualCost || null,
        plannedProfit: Math.round(plannedProfit),
        actualProfit: actualProfit !== null ? Math.round(actualProfit) : null,
        laborCostRatePlanned: laborCostRatePlanned.toFixed(1),
        laborCostRateActual: laborCostRateActual !== null ? laborCostRateActual.toFixed(1) : null,
        hasActualData: monthActualShifts.length > 0 && monthActualPayroll.length > 0,
      })
    }

    return months
  }

  // 募集状況を判定（締め切り前/締め切り済み/募集終了を区別）
  const getRecruitmentStatus = () => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 0-indexed to 1-indexed
    const currentDay = now.getDate()

    // 募集対象月を決定
    // 20日以前：来月のシフトを募集中
    // 21日以降：再来月のシフトを募集中
    let targetYear = currentYear
    let targetMonth = currentMonth
    if (currentDay <= 20) {
      targetMonth = currentMonth + 1
      if (targetMonth > 12) {
        targetMonth = 1
        targetYear += 1
      }
    } else {
      targetMonth = currentMonth + 2
      if (targetMonth > 12) {
        targetMonth = targetMonth - 12
        targetYear += 1
      }
    }

    // 締め切り日を計算（対象月の前月20日）
    const deadlineDate = new Date(targetYear, targetMonth - 2, 20)
    // 対象月の翌月1日（対象月が完全に終わる日）
    const nextMonthStart = new Date(targetYear, targetMonth, 1)

    // 締め切り前（募集中）
    if (now < deadlineDate) {
      return {
        status: '募集中',
        color: 'green',
        bgColor: 'from-green-50 to-green-100',
        borderColor: 'border-green-200',
        targetYear,
        targetMonth,
        deadline: `締切: ${deadlineDate.getMonth() + 1}/${deadlineDate.getDate()}`,
      }
    }

    // 締め切り後だが対象月内または対象月前（変更可能）
    if (now >= deadlineDate && now < nextMonthStart) {
      return {
        status: '締切済',
        color: 'orange',
        bgColor: 'from-orange-50 to-orange-100',
        borderColor: 'border-orange-200',
        targetYear,
        targetMonth,
        deadline: '変更可能',
      }
    }

    // 対象月が完全に過去（募集終了）
    return {
      status: '募集終了',
      color: 'gray',
      bgColor: 'from-gray-50 to-gray-100',
      borderColor: 'border-gray-300',
      targetYear,
      targetMonth,
      deadline: '確定済み',
    }
  }

  const recruitmentStatus = getRecruitmentStatus()

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-slate-50 pt-8"
    >
      {/* メインコンテンツ */}
      <div className="app-container py-8">
        {/* シフト募集状況カード */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className={`border-2 shadow-sm ${recruitmentStatus.borderColor}`}>
            <CardContent className="p-4">
              <div className={`flex items-center gap-4 px-4 py-3 bg-gradient-to-br rounded-xl ${recruitmentStatus.bgColor}`}>
                <Clock
                  className={`h-8 w-8 ${
                    recruitmentStatus.color === 'green'
                      ? 'text-green-600'
                      : recruitmentStatus.color === 'orange'
                        ? 'text-orange-600'
                        : 'text-gray-600'
                  }`}
                />
                <div className="flex-1">
                  <div
                    className={`text-sm font-semibold mb-1 ${
                      recruitmentStatus.color === 'green'
                        ? 'text-green-700'
                        : recruitmentStatus.color === 'orange'
                          ? 'text-orange-700'
                          : 'text-gray-700'
                    }`}
                  >
                    シフト募集状況
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      recruitmentStatus.color === 'green'
                        ? 'text-green-600'
                        : recruitmentStatus.color === 'orange'
                          ? 'text-orange-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {recruitmentStatus.status}
                  </div>
                  <div
                    className={`text-sm mt-1 ${
                      recruitmentStatus.color === 'green'
                        ? 'text-green-600'
                        : recruitmentStatus.color === 'orange'
                          ? 'text-orange-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {recruitmentStatus.targetYear}年{recruitmentStatus.targetMonth}月分 -{' '}
                    {recruitmentStatus.deadline}
                  </div>
                </div>
                <Calendar
                  className={`h-6 w-6 ${
                    recruitmentStatus.color === 'green'
                      ? 'text-green-600'
                      : recruitmentStatus.color === 'orange'
                        ? 'text-orange-600'
                        : 'text-gray-600'
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 年次予実差分サマリー - コンパクト版 */}
        {!loadingAnnualSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            {!annualSummary ? (
              <Card className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">実績データがありません</p>
                      <p className="text-xs text-gray-500">
                        予実管理画面からデータをインポートしてください
                      </p>
                    </div>
                    <Button onClick={onBudgetActualManagement} size="sm" className="ml-auto">
                      予実管理へ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-slate-700" />
                      <h3 className="text-sm font-semibold text-slate-900">
                        2025年 予実差分サマリー
                      </h3>
                    </div>
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {annualSummary.monthsCount}ヶ月分
                    </span>
                  </div>
                  {annualSummary.salesMonthsCount > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-slate-600 mb-1">売上</p>
                        <p
                          className={`text-xl font-bold ${annualSummary.salesDiff > 0 ? 'text-blue-600' : 'text-red-600'}`}
                        >
                          {annualSummary.salesDiff > 0 ? '+' : ''}¥
                          {annualSummary.salesDiff.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          ({annualSummary.salesDiffPercent > 0 ? '+' : ''}
                          {annualSummary.salesDiffPercent}%)
                        </p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-slate-600 mb-1">人件費</p>
                        <p
                          className={`text-xl font-bold ${annualSummary.costDiff > 0 ? 'text-red-600' : 'text-blue-600'}`}
                        >
                          {annualSummary.costDiff > 0 ? '+' : ''}¥
                          {annualSummary.costDiff.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          ({annualSummary.costDiffPercent > 0 ? '+' : ''}
                          {annualSummary.costDiffPercent}%)
                        </p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-slate-600 mb-1">営業利益</p>
                        <p
                          className={`text-xl font-bold ${annualSummary.profitDiff > 0 ? 'text-blue-600' : 'text-red-600'}`}
                        >
                          {annualSummary.profitDiff > 0 ? '+' : ''}¥
                          {annualSummary.profitDiff.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          ({annualSummary.profitDiffPercent > 0 ? '+' : ''}
                          {annualSummary.profitDiffPercent}%)
                        </p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-slate-600 mb-1">人件費率</p>
                        <p
                          className={`text-xl font-bold ${(() => {
                            const plannedRate =
                              (annualSummary.plannedCost /
                                ((annualSummary.forecastSales / 12) * annualSummary.monthsCount)) *
                              100
                            const actualRate =
                              (annualSummary.actualCost / annualSummary.actualSalesTotal) * 100
                            return actualRate < plannedRate ? 'text-blue-600' : 'text-red-600'
                          })()}`}
                        >
                          {(() => {
                            const plannedRate =
                              (annualSummary.plannedCost /
                                ((annualSummary.forecastSales / 12) * annualSummary.monthsCount)) *
                              100
                            const actualRate =
                              (annualSummary.actualCost / annualSummary.actualSalesTotal) * 100
                            const diff = actualRate - plannedRate
                            return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}pt`
                          })()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          実績{' '}
                          {(
                            (annualSummary.actualCost / annualSummary.actualSalesTotal) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">売上実績データがありません</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* 2024年着地見込み - コンパクト版 */}
        {!loadingAnnualSummary && annualSummary && annualSummary.monthsCount < 12 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                {(() => {
                  const remainingMonths = 12 - annualSummary.monthsCount
                  const avgCostPerMonth = annualSummary.actualCost / annualSummary.monthsCount
                  const predictedCost = Math.round(avgCostPerMonth * remainingMonths)
                  const totalCost = annualSummary.actualCost + predictedCost
                  const plannedAnnualCost = Math.round(
                    (annualSummary.plannedCost / annualSummary.monthsCount) * 12
                  )
                  const costDiff = totalCost - plannedAnnualCost

                  return (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-slate-700" />
                          <h3 className="text-sm font-semibold text-slate-900">
                            2025年 着地見込み
                          </h3>
                        </div>
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          実績{annualSummary.monthsCount}ヶ月 + 予測{remainingMonths}ヶ月
                        </span>
                      </div>
                      {annualSummary.salesMonthsCount > 0 ? (
                        (() => {
                          const avgSalesPerMonth =
                            annualSummary.actualSalesTotal / annualSummary.salesMonthsCount
                          const predictedSales = Math.round(avgSalesPerMonth * remainingMonths)
                          const totalSales = annualSummary.actualSalesTotal + predictedSales
                          const salesDiff = totalSales - annualSummary.forecastSales
                          const salesDiffPercent = (
                            (salesDiff / annualSummary.forecastSales) *
                            100
                          ).toFixed(1)

                          const avgProfitPerMonth =
                            annualSummary.actualProfit / annualSummary.monthsCount
                          const predictedProfit = Math.round(avgProfitPerMonth * remainingMonths)
                          const totalProfit = annualSummary.actualProfit + predictedProfit
                          const plannedAnnualProfit = Math.round(
                            (annualSummary.plannedProfit / annualSummary.monthsCount) * 12
                          )
                          const profitDiff = totalProfit - plannedAnnualProfit
                          const profitDiffPercent =
                            plannedAnnualProfit !== 0
                              ? ((profitDiff / plannedAnnualProfit) * 100).toFixed(1)
                              : 0

                          const costDiffPercent = ((costDiff / plannedAnnualCost) * 100).toFixed(1)

                          const plannedLaborRate =
                            (plannedAnnualCost / annualSummary.forecastSales) * 100
                          const forecastLaborRate = (totalCost / totalSales) * 100
                          const laborRateDiff = forecastLaborRate - plannedLaborRate

                          return (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-white border border-slate-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-slate-600 mb-1">
                                  売上（年間）
                                </p>
                                <p className="text-xl font-bold text-slate-900">
                                  ¥{totalSales.toLocaleString()}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${salesDiff > 0 ? 'text-blue-600' : 'text-red-600'}`}
                                >
                                  予定比 {salesDiff > 0 ? '+' : ''}¥{salesDiff.toLocaleString()} (
                                  {salesDiffPercent > 0 ? '+' : ''}
                                  {salesDiffPercent}%)
                                </p>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-slate-600 mb-1">
                                  人件費（年間）
                                </p>
                                <p className="text-xl font-bold text-slate-900">
                                  ¥{totalCost.toLocaleString()}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${costDiff > 0 ? 'text-red-600' : 'text-blue-600'}`}
                                >
                                  予定比 {costDiff > 0 ? '+' : ''}¥{costDiff.toLocaleString()} (
                                  {costDiffPercent > 0 ? '+' : ''}
                                  {costDiffPercent}%)
                                </p>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-slate-600 mb-1">
                                  営業利益（年間）
                                </p>
                                <p className="text-xl font-bold text-slate-900">
                                  ¥{totalProfit.toLocaleString()}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${profitDiff > 0 ? 'text-blue-600' : 'text-red-600'}`}
                                >
                                  予定比 {profitDiff > 0 ? '+' : ''}¥{profitDiff.toLocaleString()} (
                                  {profitDiffPercent > 0 ? '+' : ''}
                                  {profitDiffPercent}%)
                                </p>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-slate-600 mb-1">
                                  人件費率（見込）
                                </p>
                                <p className="text-xl font-bold text-slate-900">
                                  {forecastLaborRate.toFixed(1)}%
                                </p>
                                <p
                                  className={`text-xs mt-1 ${laborRateDiff < 0 ? 'text-blue-600' : 'text-red-600'}`}
                                >
                                  予定比 {laborRateDiff > 0 ? '+' : ''}
                                  {laborRateDiff.toFixed(1)}pt
                                </p>
                              </div>
                            </div>
                          )
                        })()
                      ) : (
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600">売上実績データがありません</p>
                        </div>
                      )}
                    </>
                  )
                })()}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* グラフ可視化セクション */}
        {!loadingAnnualSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-8"
          >
            {/* 売上推移グラフ */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="bg-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-slate-700" />
                  <CardTitle className="text-base font-semibold text-slate-900">
                    売上推移（予測 vs 実績）
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#475569" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                      tickFormatter={value => `¥${(value / 1000).toLocaleString()}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                      }}
                      formatter={value => `¥${value?.toLocaleString() || 0}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Area
                      type="monotone"
                      dataKey="forecastSales"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      fill="url(#colorForecast)"
                      name="予測売上"
                    />
                    <Area
                      type="monotone"
                      dataKey="actualSales"
                      stroke="#475569"
                      strokeWidth={2.5}
                      fill="url(#colorActual)"
                      name="実績売上"
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 人件費推移グラフ */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader className="bg-white border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-slate-700" />
                  <CardTitle className="text-base font-semibold text-slate-900">
                    人件費推移（計画 vs 実績）
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                      tickFormatter={value => `¥${(value / 1000).toLocaleString()}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                      }}
                      formatter={value => `¥${value?.toLocaleString() || 0}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar
                      dataKey="plannedCost"
                      fill="#cbd5e1"
                      name="計画人件費"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="actualCost"
                      fill="#64748b"
                      name="実績人件費"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 利益推移と人件費率の2段グラフ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 利益推移グラフ */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="bg-white border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-slate-700" />
                    <CardTitle className="text-base font-semibold text-slate-900">
                      月次利益推移
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '11px' }} />
                      <YAxis
                        stroke="#64748b"
                        style={{ fontSize: '11px' }}
                        tickFormatter={value => `¥${(value / 1000).toLocaleString()}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                        }}
                        formatter={value =>
                          value !== null ? `¥${value?.toLocaleString()}` : 'データなし'
                        }
                      />
                      <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey="plannedProfit"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        name="計画利益"
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="actualProfit"
                        stroke="#475569"
                        strokeWidth={2.5}
                        name="実績利益"
                        dot={{ r: 4, fill: '#475569' }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 人件費率推移グラフ */}
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="bg-white border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-slate-700" />
                    <CardTitle className="text-base font-semibold text-slate-900">
                      人件費率推移
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '11px' }} />
                      <YAxis
                        stroke="#64748b"
                        style={{ fontSize: '11px' }}
                        tickFormatter={value => `${value}%`}
                        domain={[0, 50]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                        }}
                        formatter={value => (value !== null ? `${value}%` : 'データなし')}
                      />
                      <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey="laborCostRatePlanned"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        name="計画人件費率"
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="laborCostRateActual"
                        stroke="#475569"
                        strokeWidth={2.5}
                        name="実績人件費率"
                        dot={{ r: 4, fill: '#475569' }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default Dashboard
