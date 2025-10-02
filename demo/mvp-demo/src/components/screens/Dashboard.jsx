import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  Bell,
  Settings,
  TrendingUp,
  Clock,
  Zap,
  DollarSign,
  Download,
  Calendar as CalendarIcon,
  Users,
  BarChart3,
  ArrowRight,
  ChevronDown
} from 'lucide-react'

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

const Dashboard = ({ onNext, onMasterData }) => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const weekday = weekdays[date.getDay()]
    return `${year}年${month}月${day}日（${weekday}）`
  }

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
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
      <div className="flex justify-between items-center mb-8">
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
        <div className="flex space-x-3">
          <Button variant="outline" size="sm" onClick={onMasterData}>
            <Users className="h-4 w-4 mr-2" />
            マスターデータ
          </Button>
        </div>
      </div>

      {/* 通知バー */}
      <div className="space-y-3 mb-8">
        <motion.div
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
          <div className="flex-1">
            <p className="text-blue-800 font-medium">システムメンテナンスは9/30 2:00-4:00に実施予定です</p>
          </div>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">2時間前</span>
        </motion.div>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">作業進捗</p>
                  <p className="text-3xl font-bold text-blue-900">10%</p>
                  <p className="text-xs text-blue-700 mt-1">ステップ完了率 <span className="text-green-600">+12%</span></p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">推定作業時間</p>
                  <p className="text-3xl font-bold text-green-900">2.5時間</p>
                  <p className="text-xs text-green-700 mt-1">従来比 85% 短縮 <span className="text-red-600">85% ↓</span></p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">自動化率</p>
                  <p className="text-3xl font-bold text-purple-900">92%</p>
                  <p className="text-xs text-purple-700 mt-1">手動調整 8% <span className="text-green-600">高効率</span></p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">コスト削減</p>
                  <p className="text-3xl font-bold text-orange-900">¥45,000</p>
                  <p className="text-xs text-orange-700 mt-1">月間削減額 <span className="text-green-600">+18%</span></p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 次のアクション */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                次のアクション
              </CardTitle>
              <p className="text-sm text-gray-600">現在のステップで実行可能なタスク</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Download className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-800">CSVデータを取り込む</p>
                    <p className="text-sm text-green-600">スタッフ情報とシフト制約をインポート</p>
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">5</span>
              </div>

              <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-pink-600 mr-3" />
                  <div>
                    <p className="font-medium text-pink-800">第1案を生成</p>
                    <p className="text-sm text-pink-600">AIによる初期シフト案作成</p>
                  </div>
                </div>
                <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">6</span>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-purple-800">希望回収リンクを発行</p>
                    <p className="text-sm text-purple-600">スタッフ希望収集システム起動</p>
                  </div>
                </div>
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">7</span>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-orange-600 mr-3" />
                  <div>
                    <p className="font-medium text-orange-800">チャットで微調整</p>
                    <p className="text-sm text-orange-600">自然言語でシフト修正</p>
                  </div>
                </div>
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">8</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* システム状態 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  システム状態
                </CardTitle>
                <p className="text-sm text-gray-600">現在の処理状況</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">データ導入</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">待機中</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">第1案生成</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">待機中</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">希望回収</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">待機中</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">シフト確定</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">待機中</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* チーム概要 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  チーム概要
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">総スタッフ数</span>
                    <span className="text-lg font-bold">12名</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">フルタイム</span>
                    <span className="text-sm font-medium">8名</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">パートタイム</span>
                    <span className="text-sm font-medium">4名</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">平均スキルレベル</span>
                    <span className="text-sm font-medium">3.8/5</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  詳細を見る
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="mt-8 flex justify-end">
        <Button onClick={onNext} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          データ導入を開始
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

export default Dashboard
