import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  TrendingUp,
  DollarSign,
  Calendar as CalendarIcon,
  Users,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Target,
  Wallet,
  Scale,
  Heart,
  Edit3,
  History as HistoryIcon,
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
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [annualSummary, setAnnualSummary] = useState(null)
  const [loadingAnnualSummary, setLoadingAnnualSummary] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadMetrics()
    loadAnnualSummary()
  }, [])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/data/dashboard/metrics.csv')
      const text = await response.text()

      const result = await new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        })
      })

      setMetrics(result.data)
    } catch (err) {
      console.error('メトリクスデータ読み込みエラー:', err)
    } finally {
      setLoading(false)
    }
  }

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

  const getMetricIcon = (metricId) => {
    const iconMap = {
      sales_personnel_fit: Target,
      cost_impact: Wallet,
      legal_compliance: Scale,
      fairness_preference: Heart,
      manager_adjustment: Edit3
    }
    return iconMap[metricId] || TrendingUp
  }

  const getMetricColor = (status) => {
    const colorMap = {
      success: { bg: 'from-green-50 to-green-100', icon: 'bg-green-500', text: 'text-green-900', badge: 'bg-green-100 text-green-800' },
      warning: { bg: 'from-yellow-50 to-yellow-100', icon: 'bg-yellow-500', text: 'text-yellow-900', badge: 'bg-yellow-100 text-yellow-800' },
      error: { bg: 'from-red-50 to-red-100', icon: 'bg-red-500', text: 'text-red-900', badge: 'bg-red-100 text-red-800' }
    }
    return colorMap[status] || colorMap.warning
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
      className="container mx-auto px-4 py-8"
    >
      {/* ヘッダー */}
      <div className="mb-8">
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            シフト管理ダッシュボード
          </h1>
          <p className="text-lg text-gray-600">AIによる自動シフト生成から配布まで</p>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>{formatDate(currentTime)}</span>
          </div>
        </div>
      </div>

      {/* メトリクスカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = getMetricIcon(metric.metric_id)
          const colors = getMetricColor(metric.status)
          const diff = metric.actual - metric.predicted
          const diffPercent = metric.unit === '%'
            ? diff.toFixed(1)
            : ((diff / metric.predicted) * 100).toFixed(1)

          return (
            <motion.div
              key={metric.metric_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`shadow-lg border-0 bg-gradient-to-br ${colors.bg}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2">{metric.metric_name}</p>
                    </div>
                    <div className={`w-12 h-12 ${colors.icon} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">予測</p>
                        <p className="text-2xl font-bold text-gray-700">
                          {metric.unit === '円' ? `¥${metric.predicted.toLocaleString()}` : `${metric.predicted}${metric.unit}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">実績</p>
                        <p className={`text-2xl font-bold ${colors.text}`}>
                          {metric.unit === '円' ? `¥${metric.actual.toLocaleString()}` : `${metric.actual}${metric.unit}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-600">乖離</span>
                      <span className={`text-sm font-bold ${diff > 0 && metric.metric_id !== 'cost_impact' ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {diff > 0 ? '+' : ''}{metric.unit === '円' ? `¥${diff.toLocaleString()}` : `${diff.toFixed(1)}${metric.unit}`}
                        {metric.unit !== '円' && ` (${diff > 0 ? '+' : ''}${diffPercent}%)`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
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
    </motion.div>
  )
}

export default Dashboard
