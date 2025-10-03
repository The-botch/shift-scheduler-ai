import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import AppHeader from '../shared/AppHeader'
import {
  TrendingUp,
  DollarSign,
  Database,
  Clock,
  BarChart3
} from 'lucide-react'
import Papa from 'papaparse'
import { getAllData, getAllSalesActual } from '../../utils/indexedDB'
import { INDEXED_DB } from '../../config/constants'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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

const Dashboard = ({ onNext, onHistory, onShiftManagement, onMonitoring, onStaffManagement, onStoreManagement, onConstraintManagement, onLineMessages, onBudgetActualManagement }) => {
  const [annualSummary, setAnnualSummary] = useState(null)
  const [loadingAnnualSummary, setLoadingAnnualSummary] = useState(true)
  const [monthlyData, setMonthlyData] = useState([])

  useEffect(() => {
    loadAnnualSummary()
  }, [])

  const loadAnnualSummary = async () => {
    try {
      setLoadingAnnualSummary(true)

      // Load all actual data from IndexedDB
      const actualShifts = await getAllData(INDEXED_DB.STORES.ACTUAL_SHIFTS)
      const actualPayroll = await getAllData(INDEXED_DB.STORES.PAYROLL)
      const actualSales = await getAllSalesActual()

      // Filter to only include 2024 data
      const actualShifts2024 = actualShifts.filter(shift => shift.year === 2024)
      const actualPayroll2024 = actualPayroll.filter(payroll => payroll.year === 2024)
      const actualSales2024 = actualSales.filter(sale => sale.year === 2024)

      // If no actual data exists, don't show the summary
      if (actualShifts2024.length === 0 || actualPayroll2024.length === 0) {
        setAnnualSummary(null)
        return
      }

      // Load planned shifts from CSV
      const shiftsResponse = await fetch('/data/history/shift_history_2023-2024.csv')
      const shiftsText = await shiftsResponse.text()

      const shiftsResult = await new Promise((resolve) => {
        Papa.parse(shiftsText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve
        })
      })

      // Filter to only include 2024 data
      const plannedShifts2024 = shiftsResult.data.filter(shift => shift.year === 2024)

      // Load sales forecast from CSV
      const forecastResponse = await fetch('/data/forecast/sales_forecast_2024.csv')
      const forecastText = await forecastResponse.text()

      const forecastResult = await new Promise((resolve) => {
        Papa.parse(forecastText, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: resolve
        })
      })

      const salesForecast2024 = forecastResult.data.filter(f => parseInt(f.year) === 2024)

      // Calculate annual summary
      const summary = calculateAnnualSummary(plannedShifts2024, actualShifts2024, actualPayroll2024, salesForecast2024, actualSales2024)
      setAnnualSummary(summary)

      // Calculate monthly data for graphs
      const monthly = calculateMonthlyData(plannedShifts2024, actualShifts2024, actualPayroll2024, salesForecast2024, actualSales2024)
      setMonthlyData(monthly)
    } catch (err) {
      console.error('年次サマリー読み込みエラー:', err)
      setAnnualSummary(null)
    } finally {
      setLoadingAnnualSummary(false)
    }
  }

  const calculateAnnualSummary = (plannedShifts, actualShifts, actualPayroll, salesForecast, actualSales) => {
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
      forecastSales: 0,
      actualSalesTotal: 0,
      salesDiff: 0,
      salesDiffPercent: 0,
      monthsWithData: new Set(),
      monthsWithSalesData: new Set()
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
    summary.costDiffPercent = summary.plannedCost > 0
      ? ((summary.costDiff / summary.plannedCost) * 100).toFixed(1)
      : 0
    summary.monthsCount = summary.monthsWithData.size

    // Calculate sales difference (only for months with actual sales data)
    if (summary.monthsWithSalesData.size > 0) {
      const avgForecastPerMonth = summary.forecastSales / 12
      const forecastForActualMonths = avgForecastPerMonth * summary.monthsWithSalesData.size
      summary.salesDiff = summary.actualSalesTotal - forecastForActualMonths
      summary.salesDiffPercent = forecastForActualMonths > 0
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
      const actualProfit = (summary.actualSalesTotal / summary.salesMonthsCount * summary.monthsCount) - summary.actualCost

      summary.plannedProfit = Math.round(plannedProfit)
      summary.actualProfit = Math.round(actualProfit)
      summary.profitDiff = summary.actualProfit - summary.plannedProfit
      summary.profitDiffPercent = summary.plannedProfit !== 0
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

  const calculateMonthlyData = (plannedShifts, actualShifts, actualPayroll, salesForecast, actualSales) => {
    const months = []

    for (let month = 1; month <= 12; month++) {
      const monthPlannedShifts = plannedShifts.filter(s => s.month === month)
      const monthActualShifts = actualShifts.filter(s => s.month === month)
      const monthActualPayroll = actualPayroll.filter(p => p.month === month)
      const monthForecast = salesForecast.filter(f => parseInt(f.month) === month)
      const monthSales = actualSales.filter(s => s.month === month)

      const plannedCost = monthPlannedShifts.reduce((sum, s) => sum + parseFloat(s.daily_wage || 0), 0)
      const actualCost = monthActualPayroll.reduce((sum, p) => sum + parseInt(p.gross_salary || 0), 0)
      const forecastSales = monthForecast.length > 0 ? parseInt(monthForecast[0].forecasted_sales || 0) : 0
      const actualSalesValue = monthSales.length > 0 ? parseInt(monthSales[0].actual_sales || 0) : 0

      const plannedProfit = forecastSales - plannedCost
      const actualProfit = actualSalesValue > 0 ? actualSalesValue - actualCost : null

      const laborCostRatePlanned = forecastSales > 0 ? (plannedCost / forecastSales * 100) : 0
      const laborCostRateActual = actualSalesValue > 0 ? (actualCost / actualSalesValue * 100) : null

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
        hasActualData: monthActualShifts.length > 0 && monthActualPayroll.length > 0
      })
    }

    return months
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-slate-50"
    >
      <AppHeader
        onHome={() => window.location.reload()}
        onShiftManagement={onShiftManagement}
        onLineMessages={onLineMessages}
        onMonitoring={onMonitoring}
        onStaffManagement={onStaffManagement}
        onStoreManagement={onStoreManagement}
        onConstraintManagement={onConstraintManagement}
        onBudgetActualManagement={onBudgetActualManagement}
      />

      {/* メインコンテンツ */}
      <div className="app-container">

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
                    <p className="text-xs text-gray-500">予実管理画面からデータをインポートしてください</p>
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
                    <h3 className="text-sm font-semibold text-slate-900">2024年 予実差分サマリー</h3>
                  </div>
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {annualSummary.monthsCount}ヶ月分
                  </span>
                </div>
                {annualSummary.salesMonthsCount > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-600 mb-1">売上</p>
                      <p className={`text-xl font-bold ${annualSummary.salesDiff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {annualSummary.salesDiff > 0 ? '+' : ''}¥{annualSummary.salesDiff.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        ({annualSummary.salesDiffPercent > 0 ? '+' : ''}{annualSummary.salesDiffPercent}%)
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-600 mb-1">人件費</p>
                      <p className={`text-xl font-bold ${annualSummary.costDiff > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {annualSummary.costDiff > 0 ? '+' : ''}¥{annualSummary.costDiff.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        ({annualSummary.costDiffPercent > 0 ? '+' : ''}{annualSummary.costDiffPercent}%)
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-600 mb-1">営業利益</p>
                      <p className={`text-xl font-bold ${annualSummary.profitDiff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {annualSummary.profitDiff > 0 ? '+' : ''}¥{annualSummary.profitDiff.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        ({annualSummary.profitDiffPercent > 0 ? '+' : ''}{annualSummary.profitDiffPercent}%)
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-600 mb-1">人件費率</p>
                      <p className={`text-xl font-bold ${(() => {
                        const plannedRate = annualSummary.plannedCost / (annualSummary.forecastSales / 12 * annualSummary.monthsCount) * 100
                        const actualRate = annualSummary.actualCost / annualSummary.actualSalesTotal * 100
                        return actualRate < plannedRate ? 'text-blue-600' : 'text-red-600'
                      })()}`}>
                        {(() => {
                          const plannedRate = annualSummary.plannedCost / (annualSummary.forecastSales / 12 * annualSummary.monthsCount) * 100
                          const actualRate = annualSummary.actualCost / annualSummary.actualSalesTotal * 100
                          const diff = actualRate - plannedRate
                          return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}pt`
                        })()}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        実績 {(annualSummary.actualCost / annualSummary.actualSalesTotal * 100).toFixed(1)}%
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
                const plannedAnnualCost = Math.round((annualSummary.plannedCost / annualSummary.monthsCount) * 12)
                const costDiff = totalCost - plannedAnnualCost

                return (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-slate-700" />
                        <h3 className="text-sm font-semibold text-slate-900">2024年 着地見込み</h3>
                      </div>
                      <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        実績{annualSummary.monthsCount}ヶ月 + 予測{remainingMonths}ヶ月
                      </span>
                    </div>
                    {annualSummary.salesMonthsCount > 0 ? (
                      (() => {
                        const avgSalesPerMonth = annualSummary.actualSalesTotal / annualSummary.salesMonthsCount
                        const predictedSales = Math.round(avgSalesPerMonth * remainingMonths)
                        const totalSales = annualSummary.actualSalesTotal + predictedSales
                        const salesDiff = totalSales - annualSummary.forecastSales
                        const salesDiffPercent = ((salesDiff / annualSummary.forecastSales) * 100).toFixed(1)

                        const avgProfitPerMonth = annualSummary.actualProfit / annualSummary.monthsCount
                        const predictedProfit = Math.round(avgProfitPerMonth * remainingMonths)
                        const totalProfit = annualSummary.actualProfit + predictedProfit
                        const plannedAnnualProfit = Math.round((annualSummary.plannedProfit / annualSummary.monthsCount) * 12)
                        const profitDiff = totalProfit - plannedAnnualProfit
                        const profitDiffPercent = plannedAnnualProfit !== 0 ? ((profitDiff / plannedAnnualProfit) * 100).toFixed(1) : 0

                        const costDiffPercent = ((costDiff / plannedAnnualCost) * 100).toFixed(1)

                        const plannedLaborRate = (plannedAnnualCost / annualSummary.forecastSales * 100)
                        const forecastLaborRate = (totalCost / totalSales * 100)
                        const laborRateDiff = forecastLaborRate - plannedLaborRate

                        return (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white border border-slate-200 rounded-lg p-3">
                              <p className="text-xs font-medium text-slate-600 mb-1">売上（年間）</p>
                              <p className="text-xl font-bold text-slate-900">¥{totalSales.toLocaleString()}</p>
                              <p className={`text-xs mt-1 ${salesDiff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                予定比 {salesDiff > 0 ? '+' : ''}¥{salesDiff.toLocaleString()} ({salesDiffPercent > 0 ? '+' : ''}{salesDiffPercent}%)
                              </p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-3">
                              <p className="text-xs font-medium text-slate-600 mb-1">人件費（年間）</p>
                              <p className="text-xl font-bold text-slate-900">¥{totalCost.toLocaleString()}</p>
                              <p className={`text-xs mt-1 ${costDiff > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                予定比 {costDiff > 0 ? '+' : ''}¥{costDiff.toLocaleString()} ({costDiffPercent > 0 ? '+' : ''}{costDiffPercent}%)
                              </p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-3">
                              <p className="text-xs font-medium text-slate-600 mb-1">営業利益（年間）</p>
                              <p className="text-xl font-bold text-slate-900">¥{totalProfit.toLocaleString()}</p>
                              <p className={`text-xs mt-1 ${profitDiff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                予定比 {profitDiff > 0 ? '+' : ''}¥{profitDiff.toLocaleString()} ({profitDiffPercent > 0 ? '+' : ''}{profitDiffPercent}%)
                              </p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg p-3">
                              <p className="text-xs font-medium text-slate-600 mb-1">人件費率（見込）</p>
                              <p className="text-xl font-bold text-slate-900">{forecastLaborRate.toFixed(1)}%</p>
                              <p className={`text-xs mt-1 ${laborRateDiff < 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                予定比 {laborRateDiff > 0 ? '+' : ''}{laborRateDiff.toFixed(1)}pt
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
      {!loadingAnnualSummary && annualSummary && monthlyData.length > 0 && (
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
                <CardTitle className="text-base font-semibold text-slate-900">売上推移（予測 vs 実績）</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#475569" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(value) => `¥${(value / 1000).toLocaleString()}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    formatter={(value) => `¥${value?.toLocaleString() || 0}`}
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
                <CardTitle className="text-base font-semibold text-slate-900">人件費推移（計画 vs 実績）</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(value) => `¥${(value / 1000).toLocaleString()}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    formatter={(value) => `¥${value?.toLocaleString() || 0}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="plannedCost" fill="#cbd5e1" name="計画人件費" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualCost" fill="#64748b" name="実績人件費" radius={[4, 4, 0, 0]} />
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
                  <CardTitle className="text-base font-semibold text-slate-900">月次利益推移</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} tickFormatter={(value) => `¥${(value / 1000).toLocaleString()}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      formatter={(value) => value !== null ? `¥${value?.toLocaleString()}` : 'データなし'}
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
                  <CardTitle className="text-base font-semibold text-slate-900">人件費率推移</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} tickFormatter={(value) => `${value}%`} domain={[0, 50]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      formatter={(value) => value !== null ? `${value}%` : 'データなし'}
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
