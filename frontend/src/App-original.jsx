import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx'
import {
  Calendar,
  Upload,
  Users,
  MessageSquare,
  CheckCircle,
  History,
  ArrowRight,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Settings,
  Bell,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  RefreshCw,
  FileText,
  Zap,
  Target,
  DollarSign,
  Users2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Star,
  AlertCircle,
  Info,
  X,
  Link,
  Copy,
  Mail,
  QrCode,
  Share2,
  User,
  Shield,
  Phone,
  Globe,
} from 'lucide-react'
import './App.css'

// アニメーション設定
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 },
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3,
}

// ステッパーコンポーネント（改良版）
const Stepper = ({ currentStep, steps, onStepClick }) => {
  return (
    <div className="w-full py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between overflow-x-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center min-w-0">
              <motion.div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 cursor-pointer transition-all duration-300 ${
                  currentStep >= step.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-lg'
                    : currentStep === step.id - 1
                      ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-md'
                      : 'bg-white text-gray-400 border-gray-200'
                }`}
                onClick={() => onStepClick(step.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-bold">{step.id}</span>
                )}
              </motion.div>
              <div className="ml-3 hidden lg:block">
                <p
                  className={`text-sm font-medium whitespace-nowrap ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-400">{step.subtitle}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-4 transition-colors duration-300 ${
                    currentStep > step.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// KPIカードコンポーネント
const KPICard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  }

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5`} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
          <div className="flex items-center text-sm">
            <span className="text-gray-500">{subtitle}</span>
            {trend && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {trend}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ダッシュボード画面（完全版）
const Dashboard = ({ currentStep, onNext }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'info',
      message: 'システムメンテナンスは9/30 2:00-4:00に実施予定です',
      time: '2時間前',
    },
    { id: 2, type: 'warning', message: '田中さんの希望シフトに制約違反があります', time: '1日前' },
  ])

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="container mx-auto px-4 py-8"
    >
      {/* ヘッダーセクション */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              9月シフト管理ダッシュボード
            </h1>
            <p className="text-lg text-gray-600">AIによる自動シフト生成から配布まで</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              通知 ({notifications.length})
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              設定
            </Button>
          </div>
        </div>

        {/* 通知バー */}
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-2 p-3 rounded-lg border-l-4 ${
                notification.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                  : 'bg-blue-50 border-blue-400 text-blue-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {notification.type === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  ) : (
                    <Info className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-sm font-medium">{notification.message}</span>
                  <span className="text-xs ml-2 opacity-70">{notification.time}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setNotifications(prev => prev.filter(n => n.id !== notification.id))
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="作業進捗"
          value={`${Math.round((currentStep / 10) * 100)}%`}
          subtitle="ステップ完了率"
          icon={TrendingUp}
          trend="+12%"
          color="blue"
        />
        <KPICard
          title="推定作業時間"
          value="2.5時間"
          subtitle="従来比 85% 短縮"
          icon={Clock}
          trend="85% ↓"
          color="green"
        />
        <KPICard
          title="自動化率"
          value="92%"
          subtitle="手動調整 8%"
          icon={Zap}
          trend="高効率"
          color="purple"
        />
        <KPICard
          title="コスト削減"
          value="¥45,000"
          subtitle="月間削減額"
          icon={DollarSign}
          trend="+18%"
          color="orange"
        />
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 次のアクション */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                次のアクション
              </CardTitle>
              <CardDescription>現在のステップで実行可能なタスク</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Button
                  className="w-full justify-start h-14 text-left bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
                  onClick={() => currentStep === 1 && onNext()}
                  disabled={currentStep !== 1}
                >
                  <Upload className="mr-3 h-5 w-5" />
                  <div>
                    <div className="font-medium">CSVデータを取り込む</div>
                    <div className="text-xs opacity-90">スタッフ情報とシフト制約をインポート</div>
                  </div>
                </Button>
              </motion.div>

              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Button
                  className="w-full justify-start h-14 text-left"
                  variant={currentStep === 2 ? 'default' : 'outline'}
                  disabled={currentStep < 2}
                >
                  <Calendar className="mr-3 h-5 w-5" />
                  <div>
                    <div className="font-medium">第1案を生成</div>
                    <div className="text-xs opacity-70">AIによる初期シフト案作成</div>
                  </div>
                </Button>
              </motion.div>

              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Button
                  className="w-full justify-start h-14 text-left"
                  variant="outline"
                  disabled={currentStep < 4}
                >
                  <Users className="mr-3 h-5 w-5" />
                  <div>
                    <div className="font-medium">希望回収リンクを発行</div>
                    <div className="text-xs opacity-70">スタッフ希望シフト収集開始</div>
                  </div>
                </Button>
              </motion.div>

              <motion.div whileHover={{ x: 4 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Button
                  className="w-full justify-start h-14 text-left"
                  variant="outline"
                  disabled={currentStep < 8}
                >
                  <MessageSquare className="mr-3 h-5 w-5" />
                  <div>
                    <div className="font-medium">チャットで微調整</div>
                    <div className="text-xs opacity-70">自然言語でシフト修正</div>
                  </div>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </div>

        {/* システム状態とチーム情報 */}
        <div className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                システム状態
              </CardTitle>
              <CardDescription>現在の処理状況</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium">データ導入</span>
                </div>
                <Badge
                  variant={currentStep >= 2 ? 'default' : 'secondary'}
                  className="bg-green-100 text-green-800"
                >
                  {currentStep >= 2 ? '完了' : '待機中'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-3 ${currentStep >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}
                  ></div>
                  <span className="text-sm font-medium">第1案生成</span>
                </div>
                <Badge variant={currentStep >= 3 ? 'default' : 'secondary'}>
                  {currentStep >= 3 ? '完了' : '待機中'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-3 ${currentStep >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}
                  ></div>
                  <span className="text-sm font-medium">希望回収</span>
                </div>
                <Badge variant={currentStep >= 6 ? 'default' : 'secondary'}>
                  {currentStep >= 6 ? '完了' : '待機中'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-3 ${currentStep >= 9 ? 'bg-green-500' : 'bg-gray-300'}`}
                  ></div>
                  <span className="text-sm font-medium">シフト確定</span>
                </div>
                <Badge variant={currentStep >= 9 ? 'default' : 'secondary'}>
                  {currentStep >= 9 ? '完了' : '待機中'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users2 className="h-5 w-5 mr-2 text-orange-600" />
                チーム概要
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">総スタッフ数</span>
                  <span className="font-bold">12名</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">フルタイム</span>
                  <span className="font-bold">8名</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">パートタイム</span>
                  <span className="font-bold">4名</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">平均スキルレベル</span>
                  <div className="flex items-center">
                    {[1, 2, 3, 4].map(i => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <Star className="h-3 w-3 text-gray-300" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="mt-8 flex justify-end">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onNext}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            次のステップへ
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

// データ導入画面（完全版）
const DataImport = ({ onNext, onPrev }) => {
  const [dragOver, setDragOver] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationResults, setValidationResults] = useState(null)

  const handleDrop = e => {
    e.preventDefault()
    setDragOver(false)
    simulateUpload()
  }

  const simulateUpload = () => {
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploaded(true)
          setValidationResults({
            totalRows: 12,
            validRows: 10,
            warnings: 2,
            errors: 0,
          })
          return 100
        }
        return prev + 10
      })
    }, 200)
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          データ導入（CSV）
        </h1>
        <p className="text-lg text-gray-600">スタッフ情報とシフト制約をインポート</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2 text-blue-600" />
              CSVファイルアップロード
            </CardTitle>
            <CardDescription>スタッフ情報、スキル、制約条件を含むCSVファイル</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragOver
                  ? 'border-blue-400 bg-blue-50 scale-105'
                  : uploaded
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragOver={e => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <motion.div
                animate={{ scale: dragOver ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Upload
                  className={`mx-auto h-16 w-16 mb-4 ${
                    uploaded ? 'text-green-500' : dragOver ? 'text-blue-500' : 'text-gray-400'
                  }`}
                />
              </motion.div>

              {!uploaded ? (
                <>
                  <p className="text-xl font-semibold mb-2 text-gray-700">
                    ファイルをドラッグ&ドロップ
                  </p>
                  <p className="text-sm text-gray-500 mb-6">または</p>
                  <Button
                    variant="outline"
                    onClick={simulateUpload}
                    className="bg-white hover:bg-gray-50"
                  >
                    ファイルを選択
                  </Button>
                </>
              ) : (
                <div>
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                  <p className="text-xl font-semibold text-green-700 mb-2">アップロード完了</p>
                  <p className="text-sm text-gray-600">staff_data.csv (2.4 KB)</p>
                </div>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>アップロード中...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {uploaded && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">ファイル検証完了</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">総行数:</span>
                    <span className="font-medium ml-2">{validationResults?.totalRows}行</span>
                  </div>
                  <div>
                    <span className="text-gray-600">有効データ:</span>
                    <span className="font-medium ml-2 text-green-600">
                      {validationResults?.validRows}行
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2 text-purple-600" />
                サンプルファイル
              </CardTitle>
              <CardDescription>CSVフォーマットの参考例</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full mb-6 h-12">
                <Download className="mr-2 h-4 w-4" />
                サンプルCSVをダウンロード
              </Button>

              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-3">必須列:</p>
                  <div className="space-y-2">
                    {[
                      { name: '氏名 (name)', desc: 'スタッフの氏名' },
                      { name: 'スキルレベル (skill_level)', desc: '1-5の数値' },
                      { name: '勤務可能時間帯 (available_hours)', desc: '例: 9-17' },
                      { name: '週最大勤務時間 (max_weekly_hours)', desc: '例: 40' },
                    ].map((field, index) => (
                      <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{field.name}</p>
                          <p className="text-xs text-gray-600">{field.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-orange-600" />
                データ形式例
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <div className="text-gray-500"># CSV例</div>
                <div>name,skill_level,available_hours,max_weekly_hours</div>
                <div>田中太郎,4,9-17,40</div>
                <div>佐藤花子,5,13-21,35</div>
                <div>山田次郎,3,9-15,30</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {uploaded && validationResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mt-8 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                検証結果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {validationResults.validRows}
                  </div>
                  <div className="text-sm text-green-700">有効データ</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">
                    {validationResults.warnings}
                  </div>
                  <div className="text-sm text-yellow-700">警告</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {validationResults.errors}
                  </div>
                  <div className="text-sm text-red-700">エラー</div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-green-800">列名チェック: OK</span>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-green-800">
                    データ行数: {validationResults.totalRows}名分
                  </span>
                </div>
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                  <span className="text-sm font-medium text-yellow-800">
                    スキル列欠落: 2名（自動補完予定）
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev} className="px-8">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onNext}
            disabled={!uploaded}
            className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            第1案生成へ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

// 第1案生成画面（完全版）
const FirstPlan = ({ onNext, onPrev }) => {
  const [generated, setGenerated] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedView, setSelectedView] = useState('month')
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
    }, 3000)
  }

  // サンプルシフトデータ（1ヶ月分）
  const shiftData = [
    { date: 1, shifts: [{ name: '田中', time: '9-17', skill: 4 }] },
    {
      date: 2,
      shifts: [
        { name: '佐藤', time: '13-21', skill: 5 },
        { name: '山田', time: '9-15', skill: 3 },
      ],
    },
    { date: 3, shifts: [{ name: '鈴木', time: '10-18', skill: 4 }] },
    {
      date: 4,
      shifts: [
        { name: '田中', time: '9-17', skill: 4 },
        { name: '佐藤', time: '17-21', skill: 5 },
      ],
    },
    {
      date: 5,
      shifts: [
        { name: '山田', time: '9-15', skill: 3 },
        { name: '高橋', time: '15-21', skill: 4 },
      ],
    },
    {
      date: 6,
      shifts: [
        { name: '佐藤', time: '10-18', skill: 5 },
        { name: '田中', time: '18-22', skill: 4 },
      ],
    },
    {
      date: 7,
      shifts: [
        { name: '鈴木', time: '9-17', skill: 4 },
        { name: '山田', time: '17-21', skill: 3 },
      ],
    },
    { date: 8, shifts: [{ name: '高橋', time: '9-15', skill: 4 }] },
    {
      date: 9,
      shifts: [
        { name: '田中', time: '13-21', skill: 4 },
        { name: '佐藤', time: '9-13', skill: 5 },
      ],
    },
    { date: 10, shifts: [{ name: '山田', time: '10-18', skill: 3 }] },
    {
      date: 11,
      shifts: [
        { name: '鈴木', time: '9-17', skill: 4 },
        { name: '高橋', time: '17-21', skill: 4 },
      ],
    },
    {
      date: 12,
      shifts: [
        { name: '佐藤', time: '9-15', skill: 5 },
        { name: '田中', time: '15-21', skill: 4 },
      ],
    },
    {
      date: 13,
      shifts: [
        { name: '山田', time: '10-18', skill: 3 },
        { name: '鈴木', time: '18-22', skill: 4 },
      ],
    },
    {
      date: 14,
      shifts: [
        { name: '高橋', time: '9-17', skill: 4 },
        { name: '佐藤', time: '17-21', skill: 5 },
      ],
    },
    { date: 15, shifts: [{ name: '田中', time: '9-15', skill: 4 }] },
    {
      date: 16,
      shifts: [
        { name: '山田', time: '13-21', skill: 3 },
        { name: '鈴木', time: '9-13', skill: 4 },
      ],
    },
    { date: 17, shifts: [{ name: '佐藤', time: '10-18', skill: 5 }] },
    {
      date: 18,
      shifts: [
        { name: '高橋', time: '9-17', skill: 4 },
        { name: '田中', time: '17-21', skill: 4 },
      ],
    },
    {
      date: 19,
      shifts: [
        { name: '鈴木', time: '9-15', skill: 4 },
        { name: '山田', time: '15-21', skill: 3 },
      ],
    },
    {
      date: 20,
      shifts: [
        { name: '佐藤', time: '10-18', skill: 5 },
        { name: '高橋', time: '18-22', skill: 4 },
      ],
    },
    {
      date: 21,
      shifts: [
        { name: '田中', time: '9-17', skill: 4 },
        { name: '鈴木', time: '17-21', skill: 4 },
      ],
    },
    { date: 22, shifts: [{ name: '山田', time: '9-15', skill: 3 }] },
    {
      date: 23,
      shifts: [
        { name: '佐藤', time: '13-21', skill: 5 },
        { name: '高橋', time: '9-13', skill: 4 },
      ],
    },
    { date: 24, shifts: [{ name: '田中', time: '10-18', skill: 4 }] },
    {
      date: 25,
      shifts: [
        { name: '鈴木', time: '9-17', skill: 4 },
        { name: '山田', time: '17-21', skill: 3 },
      ],
    },
    {
      date: 26,
      shifts: [
        { name: '佐藤', time: '9-15', skill: 5 },
        { name: '高橋', time: '15-21', skill: 4 },
      ],
    },
    {
      date: 27,
      shifts: [
        { name: '田中', time: '10-18', skill: 4 },
        { name: '鈴木', time: '18-22', skill: 4 },
      ],
    },
    {
      date: 28,
      shifts: [
        { name: '山田', time: '9-17', skill: 3 },
        { name: '佐藤', time: '17-21', skill: 5 },
      ],
    },
    { date: 29, shifts: [{ name: '高橋', time: '9-15', skill: 4 }] },
    {
      date: 30,
      shifts: [
        { name: '田中', time: '13-21', skill: 4 },
        { name: '鈴木', time: '9-13', skill: 4 },
      ],
    },
  ]

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
          第1案（自動生成・法令チェック）
        </h1>
        <p className="text-lg text-gray-600">AIによる初期シフト案と労働基準法チェック</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  9月シフトカレンダー
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Tabs value={selectedView} onValueChange={setSelectedView}>
                    <TabsList>
                      <TabsTrigger value="month">月表示</TabsTrigger>
                      <TabsTrigger value="week">週表示</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || generated}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : generated ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        生成完了
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        自動生成
                      </>
                    )}
                  </Button>
                </motion.div>
                {generated && (
                  <Button variant="outline" onClick={() => setGenerated(false)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    再生成
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="h-96 flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Zap className="h-16 w-16 text-blue-500 mb-4" />
                  </motion.div>
                  <p className="text-lg font-medium text-gray-700 mb-2">AIがシフトを生成中...</p>
                  <p className="text-sm text-gray-500">制約条件を考慮して最適化しています</p>
                  <Progress value={66} className="w-64 mt-4" />
                </div>
              ) : generated ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                      <div
                        key={day}
                        className="p-3 text-center font-bold bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 30 }, (_, i) => {
                      const dayData = shiftData.find(d => d.date === i + 1)
                      return (
                        <motion.div
                          key={i}
                          className="p-2 border-2 border-gray-100 rounded-lg min-h-[120px] hover:border-blue-200 transition-colors"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="text-sm font-bold mb-2 text-gray-700">{i + 1}</div>
                          {dayData?.shifts.map((shift, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className={`text-xs p-2 rounded mb-1 ${
                                shift.skill >= 4
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-green-100 text-green-800 border border-green-200'
                              }`}
                            >
                              <div className="font-medium">{shift.name}</div>
                              <div className="text-xs opacity-80">{shift.time}</div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-gray-500">
                  <CalendarIcon className="h-24 w-24 mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">シフト未生成</p>
                  <p className="text-sm">
                    「自動生成」ボタンをクリックしてシフトを作成してください
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                法令チェック
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generated ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-sm font-medium text-yellow-800">週40時間超</span>
                    </div>
                    <p className="text-xs text-yellow-700">田中さん: 42時間 (要調整)</p>
                  </div>

                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-800">連続勤務6日超</span>
                    </div>
                    <p className="text-xs text-red-700">佐藤さん: 7日連続 (要修正)</p>
                  </div>

                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">深夜勤務制限</span>
                    </div>
                    <p className="text-xs text-green-700">すべて適正範囲内</p>
                  </div>
                </motion.div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">シフト生成後に表示されます</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                指標
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generated ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">人件費推定</span>
                      <span className="font-bold text-lg">¥850,000</span>
                    </div>
                    <div className="text-xs text-gray-500">前月比 -3.2%</div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">稼働率</span>
                      <span className="font-bold text-lg text-blue-600">87%</span>
                    </div>
                    <Progress value={87} className="mb-1" />
                    <div className="text-xs text-gray-500">目標: 85%</div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">制約満足率</span>
                      <span className="font-bold text-lg text-green-600">94%</span>
                    </div>
                    <Progress value={94} className="mb-1" />
                    <div className="text-xs text-gray-500">2件の制約違反</div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">スキルバランス</span>
                      <span className="font-bold text-lg text-purple-600">良好</span>
                    </div>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div key={level} className="flex-1 h-2 bg-gray-200 rounded">
                          <div
                            className="h-full bg-purple-500 rounded"
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">レベル1-5の分布</div>
                  </div>
                </motion.div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">シフト生成後に表示されます</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev} className="px-8">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onNext}
            disabled={!generated}
            className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            希望回収設定へ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

// 簡易的な他の画面コンポーネント（プレースホルダー）
// 希望回収設定画面（完全版）
const RequestCollection = ({ onNext, onPrev }) => {
  const [linkGenerated, setLinkGenerated] = useState(false)
  const [deadline, setDeadline] = useState('2024-09-20')
  const [reminderSettings, setReminderSettings] = useState({
    email: true,
    sms: false,
    push: true,
  })

  const generateLink = () => {
    setLinkGenerated(true)
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          希望回収設定
        </h1>
        <p className="text-lg text-gray-600">スタッフ希望シフト収集の設定と管理</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* リンク生成 */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link className="h-5 w-5 mr-2 text-blue-600" />
              希望入力リンク生成
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">締切日時</label>
              <input
                type="datetime-local"
                value={deadline + 'T23:59'}
                onChange={e => setDeadline(e.target.value.split('T')[0])}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">リマインダー設定</label>
              <div className="space-y-3">
                {Object.entries(reminderSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="capitalize">
                      {key === 'email' ? 'メール' : key === 'sms' ? 'SMS' : 'プッシュ通知'}
                    </span>
                    <button
                      onClick={() => setReminderSettings(prev => ({ ...prev, [key]: !value }))}
                      className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={generateLink}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              disabled={linkGenerated}
            >
              {linkGenerated ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  リンク生成完了
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  希望入力リンクを生成
                </>
              )}
            </Button>

            {linkGenerated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-sm text-green-800 mb-2">生成されたリンク:</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-white border rounded text-xs">
                    https://shift.example.com/request/abc123
                  </code>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* 配布方法 */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2 text-purple-600" />
              配布方法
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Mail className="h-6 w-6 mb-2" />
                メール送信
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <MessageSquare className="h-6 w-6 mb-2" />
                SMS送信
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <QrCode className="h-6 w-6 mb-2" />
                QRコード
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Share2 className="h-6 w-6 mb-2" />
                SNS共有
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">配布予定スタッフ</h4>
              <div className="space-y-2">
                {['田中太郎', '佐藤花子', '山田次郎', '鈴木美咲'].map((name, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{name}</span>
                    <div className="flex space-x-1">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <MessageSquare className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ナビゲーション */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          スタッフ入力画面へ
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// スタッフ入力画面（モバイル対応）
const StaffInput = ({ onNext, onPrev }) => {
  const [selectedDays, setSelectedDays] = useState([])
  const [timePreferences, setTimePreferences] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const days = [
    { id: 1, name: '月', date: '9/2' },
    { id: 2, name: '火', date: '9/3' },
    { id: 3, name: '水', date: '9/4' },
    { id: 4, name: '木', date: '9/5' },
    { id: 5, name: '金', date: '9/6' },
    { id: 6, name: '土', date: '9/7' },
    { id: 7, name: '日', date: '9/8' },
  ]

  const timeSlots = ['9:00-13:00', '13:00-17:00', '17:00-21:00']

  const toggleDay = dayId => {
    setSelectedDays(prev =>
      prev.includes(dayId) ? prev.filter(id => id !== dayId) : [...prev, dayId]
    )
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="container mx-auto px-4 py-8"
      >
        <div className="max-w-md mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="h-12 w-12 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">希望提出完了</h2>
          <p className="text-gray-600 mb-8">
            シフト希望の提出が完了しました。
            <br />
            結果は後日お知らせします。
          </p>
          <Button onClick={onNext} className="w-full">
            モニタリング画面へ
          </Button>
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
      className="container mx-auto px-4 py-8 max-w-md"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">シフト希望入力</h1>
        <p className="text-gray-600">9月第1週のシフト希望を入力してください</p>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">締切: 9/20 23:59</p>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* 勤務可能日選択 */}
            <div>
              <h3 className="font-medium mb-4">勤務可能日を選択</h3>
              <div className="grid grid-cols-7 gap-2">
                {days.map(day => (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`p-3 rounded-lg text-center transition-all ${
                      selectedDays.includes(day.id)
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-medium">{day.name}</div>
                    <div className="text-xs">{day.date}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 時間帯希望 */}
            {selectedDays.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <h3 className="font-medium mb-4">希望時間帯</h3>
                <div className="space-y-3">
                  {timeSlots.map(slot => (
                    <label key={slot} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 rounded"
                        onChange={e =>
                          setTimePreferences(prev => ({
                            ...prev,
                            [slot]: e.target.checked,
                          }))
                        }
                      />
                      <span>{slot}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {/* コメント */}
            <div>
              <label className="block font-medium mb-2">その他要望・コメント</label>
              <textarea
                className="w-full p-3 border rounded-lg resize-none"
                rows={3}
                placeholder="特別な要望があれば記入してください"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ナビゲーション */}
      <div className="mt-8 space-y-4">
        <Button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          disabled={selectedDays.length === 0}
        >
          希望を提出する
        </Button>
        <Button variant="outline" onClick={onPrev} className="w-full">
          戻る
        </Button>
      </div>
    </motion.div>
  )
}

// モニタリング画面
const Monitoring = ({ onNext, onPrev }) => {
  const [staffStatus, setStaffStatus] = useState([
    { id: 1, name: '田中太郎', submitted: true, submittedAt: '9/15 14:30' },
    { id: 2, name: '佐藤花子', submitted: true, submittedAt: '9/16 09:15' },
    { id: 3, name: '山田次郎', submitted: false, lastReminder: '9/17 10:00' },
    { id: 4, name: '鈴木美咲', submitted: false, lastReminder: '9/16 15:30' },
    { id: 5, name: '高橋健太', submitted: true, submittedAt: '9/17 20:45' },
  ])

  const submittedCount = staffStatus.filter(s => s.submitted).length
  const totalCount = staffStatus.length
  const submissionRate = Math.round((submittedCount / totalCount) * 100)

  const sendReminder = staffId => {
    setStaffStatus(prev =>
      prev.map(staff =>
        staff.id === staffId
          ? {
              ...staff,
              lastReminder: new Date().toLocaleString('ja-JP', {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : staff
      )
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          希望回収モニタリング
        </h1>
        <p className="text-lg text-gray-600">スタッフの希望提出状況を監視</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">提出率</p>
                <p className="text-3xl font-bold text-blue-600">{submissionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">提出済み</p>
                <p className="text-3xl font-bold text-green-600">{submittedCount}人</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">未提出</p>
                <p className="text-3xl font-bold text-red-600">{totalCount - submittedCount}人</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* スタッフ一覧 */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>スタッフ提出状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staffStatus.map(staff => (
              <div
                key={staff.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-3 h-3 rounded-full ${staff.submitted ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  <div>
                    <p className="font-medium">{staff.name}</p>
                    <p className="text-sm text-gray-600">
                      {staff.submitted
                        ? `提出済み: ${staff.submittedAt}`
                        : `最終催促: ${staff.lastReminder}`}
                    </p>
                  </div>
                </div>
                {!staff.submitted && (
                  <Button size="sm" variant="outline" onClick={() => sendReminder(staff.id)}>
                    <Bell className="h-4 w-4 mr-1" />
                    催促
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ナビゲーション */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          第2案生成へ
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// 第2案生成画面
const SecondPlan = ({ onNext, onPrev }) => {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [comparison, setComparison] = useState(null)

  const generateSecondPlan = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      setComparison({
        first: { satisfaction: 72, coverage: 85, cost: 52000 },
        second: { satisfaction: 89, coverage: 92, cost: 48000 },
      })
    }, 3000)
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          第2案（希望反映）
        </h1>
        <p className="text-lg text-gray-600">スタッフ希望を反映した最適化シフト</p>
      </div>

      {!generated ? (
        <Card className="shadow-lg border-0">
          <CardContent className="p-12 text-center">
            {generating ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Zap className="h-12 w-12 text-blue-600" />
                  </motion.div>
                </div>
                <h3 className="text-2xl font-bold mb-4">希望を反映した第2案を生成中...</h3>
                <div className="max-w-md mx-auto">
                  <div className="bg-gray-200 rounded-full h-2 mb-4">
                    <motion.div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3 }}
                    />
                  </div>
                  <p className="text-gray-600">スタッフ希望を分析し、最適化を実行中...</p>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RefreshCw className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4">希望反映シフトを生成</h3>
                <p className="text-gray-600 mb-8">
                  収集したスタッフ希望を基に、満足度を向上させた第2案を生成します
                </p>
                <Button
                  onClick={generateSecondPlan}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  第2案を生成
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* 第2案カレンダー表示 */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-purple-600" />
                第2案シフトカレンダー（希望反映版）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                  <div
                    key={day}
                    className="p-3 text-center font-bold bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 30 }, (_, i) => {
                  // 第2案用の改善されたシフトデータ
                  const improvedShifts = [
                    {
                      date: 1,
                      shifts: [{ name: '田中', time: '13-21', skill: 4, preferred: true }],
                    },
                    {
                      date: 2,
                      shifts: [
                        { name: '佐藤', time: '9-17', skill: 5, preferred: true },
                        { name: '山田', time: '17-21', skill: 3, preferred: false },
                      ],
                    },
                    {
                      date: 3,
                      shifts: [{ name: '鈴木', time: '9-17', skill: 4, preferred: true }],
                    },
                    {
                      date: 4,
                      shifts: [
                        { name: '高橋', time: '9-15', skill: 4, preferred: true },
                        { name: '田中', time: '15-21', skill: 4, preferred: true },
                      ],
                    },
                    {
                      date: 5,
                      shifts: [{ name: '佐藤', time: '10-18', skill: 5, preferred: true }],
                    },
                    {
                      date: 6,
                      shifts: [
                        { name: '山田', time: '9-15', skill: 3, preferred: true },
                        { name: '鈴木', time: '15-21', skill: 4, preferred: false },
                      ],
                    },
                    {
                      date: 7,
                      shifts: [{ name: '高橋', time: '10-18', skill: 4, preferred: true }],
                    },
                    {
                      date: 8,
                      shifts: [{ name: '田中', time: '9-17', skill: 4, preferred: true }],
                    },
                    {
                      date: 9,
                      shifts: [
                        { name: '佐藤', time: '13-21', skill: 5, preferred: true },
                        { name: '山田', time: '9-13', skill: 3, preferred: true },
                      ],
                    },
                    {
                      date: 10,
                      shifts: [{ name: '鈴木', time: '10-18', skill: 4, preferred: true }],
                    },
                    {
                      date: 11,
                      shifts: [
                        { name: '高橋', time: '9-17', skill: 4, preferred: true },
                        { name: '田中', time: '17-21', skill: 4, preferred: false },
                      ],
                    },
                    {
                      date: 12,
                      shifts: [{ name: '佐藤', time: '9-15', skill: 5, preferred: true }],
                    },
                    {
                      date: 13,
                      shifts: [
                        { name: '山田', time: '13-21', skill: 3, preferred: true },
                        { name: '鈴木', time: '9-13', skill: 4, preferred: true },
                      ],
                    },
                    {
                      date: 14,
                      shifts: [{ name: '高橋', time: '10-18', skill: 4, preferred: true }],
                    },
                    {
                      date: 15,
                      shifts: [{ name: '田中', time: '9-15', skill: 4, preferred: true }],
                    },
                    {
                      date: 16,
                      shifts: [
                        { name: '佐藤', time: '15-21', skill: 5, preferred: true },
                        { name: '山田', time: '9-15', skill: 3, preferred: true },
                      ],
                    },
                    {
                      date: 17,
                      shifts: [{ name: '鈴木', time: '9-17', skill: 4, preferred: true }],
                    },
                    {
                      date: 18,
                      shifts: [
                        { name: '高橋', time: '13-21', skill: 4, preferred: true },
                        { name: '田中', time: '9-13', skill: 4, preferred: true },
                      ],
                    },
                    {
                      date: 19,
                      shifts: [{ name: '佐藤', time: '10-18', skill: 5, preferred: true }],
                    },
                    {
                      date: 20,
                      shifts: [
                        { name: '山田', time: '9-15', skill: 3, preferred: true },
                        { name: '鈴木', time: '15-21', skill: 4, preferred: true },
                      ],
                    },
                    {
                      date: 21,
                      shifts: [{ name: '高橋', time: '9-17', skill: 4, preferred: true }],
                    },
                    {
                      date: 22,
                      shifts: [{ name: '田中', time: '13-21', skill: 4, preferred: true }],
                    },
                    {
                      date: 23,
                      shifts: [
                        { name: '佐藤', time: '9-15', skill: 5, preferred: true },
                        { name: '山田', time: '15-21', skill: 3, preferred: false },
                      ],
                    },
                    {
                      date: 24,
                      shifts: [{ name: '鈴木', time: '10-18', skill: 4, preferred: true }],
                    },
                    {
                      date: 25,
                      shifts: [
                        { name: '高橋', time: '9-17', skill: 4, preferred: true },
                        { name: '田中', time: '17-21', skill: 4, preferred: true },
                      ],
                    },
                    {
                      date: 26,
                      shifts: [{ name: '佐藤', time: '13-21', skill: 5, preferred: true }],
                    },
                    {
                      date: 27,
                      shifts: [
                        { name: '山田', time: '9-15', skill: 3, preferred: true },
                        { name: '鈴木', time: '15-21', skill: 4, preferred: true },
                      ],
                    },
                    {
                      date: 28,
                      shifts: [{ name: '高橋', time: '10-18', skill: 4, preferred: true }],
                    },
                    {
                      date: 29,
                      shifts: [{ name: '田中', time: '9-17', skill: 4, preferred: true }],
                    },
                    {
                      date: 30,
                      shifts: [
                        { name: '佐藤', time: '15-21', skill: 5, preferred: true },
                        { name: '山田', time: '9-15', skill: 3, preferred: true },
                      ],
                    },
                  ]

                  const dayData = improvedShifts.find(d => d.date === i + 1)
                  return (
                    <motion.div
                      key={i}
                      className="p-2 border-2 border-gray-100 rounded-lg min-h-[120px] hover:border-purple-200 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <div className="text-sm font-bold mb-2 text-gray-700">{i + 1}</div>
                      {dayData?.shifts.map((shift, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`text-xs p-2 rounded mb-1 ${
                            shift.preferred
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}
                        >
                          <div className="font-medium flex items-center">
                            {shift.name}
                            {shift.preferred && (
                              <CheckCircle className="h-3 w-3 ml-1 text-green-600" />
                            )}
                          </div>
                          <div className="text-xs opacity-80">{shift.time}</div>
                        </motion.div>
                      ))}
                      {!dayData && <div className="text-xs text-gray-400 italic">休業日</div>}
                    </motion.div>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
                  <span>希望時間帯</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded mr-2"></div>
                  <span>調整時間帯</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 比較表 */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>第1案 vs 第2案 比較</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h4 className="font-medium text-gray-600 mb-4">スタッフ満足度</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">第1案</span>
                      <span className="text-lg font-bold text-gray-600">
                        {comparison.first.satisfaction}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">第2案</span>
                      <span className="text-lg font-bold text-green-600">
                        {comparison.second.satisfaction}%
                      </span>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      +{comparison.second.satisfaction - comparison.first.satisfaction}% 改善
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="font-medium text-gray-600 mb-4">シフト充足率</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">第1案</span>
                      <span className="text-lg font-bold text-gray-600">
                        {comparison.first.coverage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">第2案</span>
                      <span className="text-lg font-bold text-green-600">
                        {comparison.second.coverage}%
                      </span>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      +{comparison.second.coverage - comparison.first.coverage}% 改善
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="font-medium text-gray-600 mb-4">人件費予測</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">第1案</span>
                      <span className="text-lg font-bold text-gray-600">
                        ¥{comparison.first.cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">第2案</span>
                      <span className="text-lg font-bold text-green-600">
                        ¥{comparison.second.cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      ¥{(comparison.first.cost - comparison.second.cost).toLocaleString()} 削減
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 改善点 */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>主な改善点</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">希望時間帯の反映</p>
                      <p className="text-sm text-gray-600">スタッフの希望時間帯を89%反映</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">連続勤務の調整</p>
                      <p className="text-sm text-gray-600">3日以上の連続勤務を削減</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">スキルバランス最適化</p>
                      <p className="text-sm text-gray-600">各時間帯のスキル配置を改善</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">コスト効率化</p>
                      <p className="text-sm text-gray-600">時給の高いスタッフの配置を最適化</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ナビゲーション */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        {generated && (
          <Button
            onClick={onNext}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            チャット修正へ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// チャット修正画面（インタラクティブデモ版）
const ChatModification = ({ onNext, onPrev }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'シフト第2案が生成されました。自然言語で修正指示をお聞かせください。',
      time: '14:30',
    },
    {
      id: 2,
      type: 'user',
      content: '田中さんの土曜日のシフトを午後に変更してください',
      time: '14:32',
    },
    {
      id: 3,
      type: 'assistant',
      content:
        '田中太郎さんの土曜日（9/7）のシフトを午後（13:00-17:00）に変更しました。他に調整が必要な箇所はありますか？',
      time: '14:32',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [shiftData, setShiftData] = useState([
    { date: 1, shifts: [{ name: '田中', time: '9-17', skill: 4, changed: false }] },
    {
      date: 2,
      shifts: [
        { name: '佐藤', time: '13-21', skill: 5, changed: false },
        { name: '山田', time: '9-15', skill: 3, changed: false },
      ],
    },
    { date: 3, shifts: [{ name: '鈴木', time: '10-18', skill: 4, changed: false }] },
    {
      date: 4,
      shifts: [
        { name: '田中', time: '9-17', skill: 4, changed: false },
        { name: '佐藤', time: '17-21', skill: 5, changed: false },
      ],
    },
    {
      date: 5,
      shifts: [
        { name: '山田', time: '9-15', skill: 3, changed: false },
        { name: '高橋', time: '15-21', skill: 4, changed: false },
      ],
    },
    {
      date: 6,
      shifts: [
        { name: '佐藤', time: '10-18', skill: 5, changed: false },
        { name: '田中', time: '18-22', skill: 4, changed: false },
      ],
    },
    {
      date: 7,
      shifts: [
        { name: '鈴木', time: '9-17', skill: 4, changed: false },
        { name: '山田', time: '17-21', skill: 3, changed: false },
      ],
    },
  ])
  const [changedDates, setChangedDates] = useState(new Set())

  // デモ用の修正パターン
  const demoPatterns = {
    田中さんの月曜日を休みにしてください: {
      changes: [{ date: 1, action: 'remove', staff: '田中' }],
      response: '田中さんの月曜日（9/1）のシフトを削除しました。代替スタッフの配置も調整済みです。',
    },
    午前のシフトを1人増やしてください: {
      changes: [{ date: 2, action: 'add', staff: '高橋', time: '9-13', skill: 4 }],
      response: '火曜日の午前シフトに高橋さん（9:00-13:00）を追加しました。',
    },
    土日のベテランスタッフを増やしてください: {
      changes: [
        { date: 6, action: 'add', staff: '佐藤', time: '9-17', skill: 5 },
        { date: 7, action: 'add', staff: '田中', time: '9-17', skill: 4 },
      ],
      response:
        '土曜日に佐藤さん、日曜日に田中さんを追加配置しました。ベテランスタッフの配置を強化しています。',
    },
    連続勤務を3日以内に制限してください: {
      changes: [{ date: 4, action: 'remove', staff: '田中' }],
      response: '田中さんの木曜日のシフトを削除し、連続勤務を3日以内に調整しました。',
    },
    佐藤さんの水曜日を夜勤に変更してください: {
      changes: [{ date: 3, action: 'modify', staff: '佐藤', time: '17-21', skill: 5 }],
      response: '佐藤さんの水曜日のシフトを夜勤（17:00-21:00）に変更しました。',
    },
  }

  const applyShiftChanges = changes => {
    setShiftData(prevData => {
      const newData = [...prevData]
      const newChangedDates = new Set(changedDates)

      changes.forEach(change => {
        const dayIndex = newData.findIndex(d => d.date === change.date)
        if (dayIndex !== -1) {
          newChangedDates.add(change.date)

          if (change.action === 'remove') {
            newData[dayIndex].shifts = newData[dayIndex].shifts.filter(s => s.name !== change.staff)
          } else if (change.action === 'add') {
            newData[dayIndex].shifts.push({
              name: change.staff,
              time: change.time,
              skill: change.skill,
              changed: true,
            })
          } else if (change.action === 'modify') {
            const shiftIndex = newData[dayIndex].shifts.findIndex(s => s.name === change.staff)
            if (shiftIndex !== -1) {
              newData[dayIndex].shifts[shiftIndex] = {
                ...newData[dayIndex].shifts[shiftIndex],
                time: change.time,
                changed: true,
              }
            }
          }
        }
      })

      setChangedDates(newChangedDates)
      return newData
    })
  }

  const sendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, newMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsTyping(true)

    // デモパターンをチェック
    const pattern = demoPatterns[currentInput]

    setTimeout(() => {
      let responseContent =
        '承知しました。指定された変更を適用し、シフト表を更新しました。法令チェックも問題ありません。'

      if (pattern) {
        applyShiftChanges(pattern.changes)
        responseContent = pattern.response
      }

      const aiResponse = {
        id: messages.length + 2,
        type: 'assistant',
        content: responseContent,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 2000)
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          チャット修正
        </h1>
        <p className="text-lg text-gray-600">自然言語でシフトを微調整</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* チャット画面 */}
        <Card className="shadow-lg border-0 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
              AI修正アシスタント
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'system'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">{message.time}</p>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  placeholder="修正指示を入力してください..."
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={sendMessage} disabled={!inputValue.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* リアルタイムシフトカレンダー */}
        <Card className="shadow-lg border-0 xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-purple-600" />
              リアルタイムシフト表示
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">チャットでの修正が即座に反映されます</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                <div
                  key={day}
                  className="p-2 text-center font-bold bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-sm"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {shiftData.map((dayData, index) => (
                <motion.div
                  key={dayData.date}
                  className={`p-3 border-2 rounded-lg min-h-[120px] transition-all duration-500 ${
                    changedDates.has(dayData.date)
                      ? 'border-orange-300 bg-orange-50 shadow-lg'
                      : 'border-gray-100 bg-white hover:border-blue-200'
                  }`}
                  animate={changedDates.has(dayData.date) ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-sm font-bold mb-2 text-gray-700 flex items-center justify-between">
                    {dayData.date}
                    {changedDates.has(dayData.date) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-orange-500 rounded-full"
                      />
                    )}
                  </div>
                  {dayData.shifts.map((shift, idx) => (
                    <motion.div
                      key={idx}
                      initial={shift.changed ? { scale: 0, opacity: 0 } : {}}
                      animate={shift.changed ? { scale: 1, opacity: 1 } : {}}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      className={`text-xs p-2 rounded mb-1 transition-all ${
                        shift.changed
                          ? 'bg-orange-100 text-orange-800 border border-orange-200 shadow-md'
                          : shift.skill >= 4
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                      }`}
                    >
                      <div className="font-medium flex items-center">
                        {shift.name}
                        {shift.changed && <Star className="h-3 w-3 ml-1 text-orange-600" />}
                      </div>
                      <div className="text-xs opacity-80">{shift.time}</div>
                    </motion.div>
                  ))}
                  {dayData.shifts.length === 0 && (
                    <div className="text-xs text-gray-400 italic">休業日</div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* 凡例 */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded mr-2"></div>
                <span>ベテラン</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
                <span>一般</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded mr-2"></div>
                <span>修正済み</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-orange-600 mr-1" />
                <span>新規追加</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 修正例・ヒント */}
        <Card className="shadow-lg border-0 xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-yellow-600" />
              インタラクティブデモ - 修正例
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              以下の例文をクリックすると、実際にシフトが変更されます
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">🎯 デモ用修正指示（クリックで実行）</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  '田中さんの月曜日を休みにしてください',
                  '午前のシフトを1人増やしてください',
                  '土日のベテランスタッフを増やしてください',
                  '連続勤務を3日以内に制限してください',
                  '佐藤さんの水曜日を夜勤に変更してください',
                ].map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputValue(example)}
                    className="text-left p-3 text-sm bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all border border-blue-200 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="font-medium text-blue-800">{example}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 修正のコツ</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 具体的な人名と日時を指定</li>
                  <li>• 「増やす」「減らす」「変更」など明確な動詞を使用</li>
                  <li>• 理由も併せて伝えると精度向上</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">✅ 現在の状況</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• 法令チェック: 問題なし</p>
                  <p>• スタッフ満足度: 89%</p>
                  <p>• シフト充足率: 92%</p>
                  <p>• 修正回数: {changedDates.size}回</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ナビゲーション */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          確定・配布へ
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// 確定・配布画面
const Publish = ({ onNext, onPrev }) => {
  const [finalCheck, setFinalCheck] = useState(false)
  const [published, setPublished] = useState(false)
  const [distributionMethod, setDistributionMethod] = useState('email')

  const handlePublish = () => {
    setPublished(true)
  }

  if (published) {
    return (
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="container mx-auto px-4 py-8"
      >
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="h-16 w-16 text-green-600" />
          </motion.div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">シフト配布完了</h2>
          <p className="text-xl text-gray-600 mb-8">9月第1週のシフトが全スタッフに配布されました</p>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium">メール送信</p>
              <p className="text-sm text-gray-600">5名に送信完了</p>
            </div>
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium">SMS送信</p>
              <p className="text-sm text-gray-600">5名に送信完了</p>
            </div>
          </div>

          <Button
            onClick={onNext}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            履歴・監査へ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          確定・配布
        </h1>
        <p className="text-lg text-gray-600">シフトの最終確認と配布</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 最終確認 */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              最終チェック
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  労働基準法チェック
                </span>
                <span className="text-green-600 font-medium">適合</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  シフト充足率
                </span>
                <span className="text-green-600 font-medium">92%</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  スタッフ満足度
                </span>
                <span className="text-green-600 font-medium">89%</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="flex items-center">
                  <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                  予算内収束
                </span>
                <span className="text-blue-600 font-medium">¥48,000</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="finalCheck"
                checked={finalCheck}
                onChange={e => setFinalCheck(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="finalCheck" className="text-sm">
                上記内容を確認し、シフトを確定します
              </label>
            </div>
          </CardContent>
        </Card>

        {/* 配布設定 */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2 text-blue-600" />
              配布設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block font-medium mb-3">配布方法</label>
              <div className="space-y-2">
                {[
                  { id: 'email', label: 'メール + PDF添付', icon: Mail },
                  { id: 'sms', label: 'SMS + リンク', icon: MessageSquare },
                  { id: 'both', label: 'メール + SMS', icon: Send },
                ].map(({ id, label, icon: Icon }) => (
                  <label
                    key={id}
                    className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="distribution"
                      value={id}
                      checked={distributionMethod === id}
                      onChange={e => setDistributionMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">配布対象スタッフ</h4>
              <div className="text-sm text-yellow-800 space-y-1">
                {['田中太郎', '佐藤花子', '山田次郎', '鈴木美咲', '高橋健太'].map(name => (
                  <div key={name} className="flex items-center justify-between">
                    <span>{name}</span>
                    <div className="flex space-x-1">
                      <Mail className="h-4 w-4" />
                      <MessageSquare className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 確定ボタン */}
      <div className="mt-8 text-center">
        <Button
          onClick={handlePublish}
          disabled={!finalCheck}
          size="lg"
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-12"
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          シフトを確定・配布する
        </Button>
      </div>

      {/* ナビゲーション */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
      </div>
    </motion.div>
  )
}

// 履歴・監査画面（完全版）
const HistoryAudit = ({ onPrev }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      timestamp: '2024-09-18 14:32',
      user: '管理者',
      action: 'シフト確定',
      details: '9月第1週シフトを確定・配布',
      status: 'success',
    },
    {
      id: 2,
      timestamp: '2024-09-18 14:30',
      user: 'AI',
      action: 'チャット修正',
      details: '田中太郎の土曜シフトを午後に変更',
      status: 'success',
    },
    {
      id: 3,
      timestamp: '2024-09-18 14:15',
      user: 'AI',
      action: '第2案生成',
      details: 'スタッフ希望を反映した最適化完了',
      status: 'success',
    },
    {
      id: 4,
      timestamp: '2024-09-17 16:45',
      user: '管理者',
      action: '希望回収締切',
      details: '希望回収を締切、5名中5名提出完了',
      status: 'success',
    },
    {
      id: 5,
      timestamp: '2024-09-15 10:00',
      user: '管理者',
      action: '希望回収開始',
      details: '希望入力リンクを全スタッフに配布',
      status: 'success',
    },
  ])

  const [shiftHistory, setShiftHistory] = useState([
    {
      period: '2024年9月第1週',
      status: '確定済み',
      satisfaction: 89,
      coverage: 92,
      cost: 48000,
      date: '2024-09-18',
    },
    {
      period: '2024年8月第4週',
      status: '完了',
      satisfaction: 85,
      coverage: 88,
      cost: 52000,
      date: '2024-08-25',
    },
    {
      period: '2024年8月第3週',
      status: '完了',
      satisfaction: 82,
      coverage: 90,
      cost: 49000,
      date: '2024-08-18',
    },
  ])

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
          履歴・監査ログ
        </h1>
        <p className="text-lg text-gray-600">シフト作成履歴と変更追跡</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 期間選択 */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              期間選択
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: 'current', label: '今月', desc: '2024年9月' },
                { id: 'last', label: '先月', desc: '2024年8月' },
                { id: 'quarter', label: '四半期', desc: '7-9月' },
                { id: 'year', label: '年間', desc: '2024年' },
              ].map(period => (
                <label
                  key={period.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="period"
                    value={period.id}
                    checked={selectedPeriod === period.id}
                    onChange={e => setSelectedPeriod(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <p className="font-medium">{period.label}</p>
                    <p className="text-sm text-gray-600">{period.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* シフト履歴 */}
        <Card className="shadow-lg border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2 text-green-600" />
              シフト作成履歴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shiftHistory.map((shift, idx) => (
                <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{shift.period}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        shift.status === '確定済み'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {shift.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">満足度:</span>
                      <span className="ml-1 font-medium">{shift.satisfaction}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">充足率:</span>
                      <span className="ml-1 font-medium">{shift.coverage}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">コスト:</span>
                      <span className="ml-1 font-medium">¥{shift.cost.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">作成日: {shift.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 監査ログ */}
      <Card className="shadow-lg border-0 mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-purple-600" />
            監査ログ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.map(log => (
              <div key={log.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div
                  className={`w-3 h-3 rounded-full ${
                    log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-sm text-gray-500">{log.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600">{log.details}</p>
                  <p className="text-xs text-gray-500">実行者: {log.user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">12</p>
            <p className="text-sm text-gray-600">作成シフト数</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">87%</p>
            <p className="text-sm text-gray-600">平均満足度</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">2.1h</p>
            <p className="text-sm text-gray-600">平均作成時間</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">15%</p>
            <p className="text-sm text-gray-600">コスト削減率</p>
          </CardContent>
        </Card>
      </div>

      {/* ナビゲーション */}
      <div className="mt-8 flex justify-center">
        <Button variant="outline" onClick={onPrev} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
      </div>
    </motion.div>
  )
}

function App() {
  const [currentStep, setCurrentStep] = useState(1)

  const steps = [
    { id: 1, title: 'ダッシュボード', subtitle: '概要確認' },
    { id: 2, title: 'データ導入', subtitle: 'CSV取込' },
    { id: 3, title: '第1案生成', subtitle: 'AI自動生成' },
    { id: 4, title: '希望回収設定', subtitle: 'リンク発行' },
    { id: 5, title: 'スタッフ入力', subtitle: 'モバイル対応' },
    { id: 6, title: 'モニタリング', subtitle: '提出状況' },
    { id: 7, title: '第2案', subtitle: '希望反映' },
    { id: 8, title: 'チャット修正', subtitle: '微調整' },
    { id: 9, title: '確定・配布', subtitle: '最終承認' },
    { id: 10, title: '履歴・監査', subtitle: '変更追跡' },
  ]

  const handleNext = () => {
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = stepId => {
    setCurrentStep(stepId)
  }

  const renderCurrentStep = () => {
    const components = {
      1: Dashboard,
      2: DataImport,
      3: FirstPlan,
      4: RequestCollection,
      5: StaffInput,
      6: Monitoring,
      7: SecondPlan,
      8: ChatModification,
      9: Publish,
      10: HistoryAudit,
    }

    const Component = components[currentStep] || Dashboard
    return <Component currentStep={currentStep} onNext={handleNext} onPrev={handlePrev} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Stepper currentStep={currentStep} steps={steps} onStepClick={handleStepClick} />
      <main className="relative">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep}>{renderCurrentStep()}</motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
