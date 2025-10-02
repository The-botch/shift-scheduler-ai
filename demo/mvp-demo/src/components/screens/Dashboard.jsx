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
  Shield
} from 'lucide-react'
import Papa from 'papaparse'

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

const Dashboard = ({ onNext, onHistory, onShiftManagement, onMonitoring, onStaffManagement, onStoreManagement, onConstraintManagement }) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadMetrics()
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
            <Button variant="outline" size="sm" onClick={onMonitoring} className="bg-blue-50 border-blue-300">
              <ClipboardList className="h-4 w-4 mr-2" />
              希望回収状況
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
            <Button variant="outline" size="sm" onClick={onHistory}>
              <HistoryIcon className="h-4 w-4 mr-2" />
              履歴
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
    </motion.div>
  )
}

export default Dashboard
