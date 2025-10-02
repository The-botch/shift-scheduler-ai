import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { 
  Zap, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  CalendarIcon,
  ChevronLeft, 
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'
import ShiftCalendar from '../common/ShiftCalendar'
import { firstPlanShiftData } from '../../data/demoPatterns'

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

const FirstPlan = ({ onNext, onPrev }) => {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const generateShift = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
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
          第1案（自動生成）
        </h1>
        <p className="text-lg text-gray-600">AIによる初期シフト案の生成と法令チェック</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* シフト生成・表示 */}
        <div className="xl:col-span-2">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-600" />
                  AIシフト生成
                </CardTitle>
                <motion.div 
                  className="flex space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button 
                    onClick={generateShift}
                    disabled={generating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
                  {generated && (
                    <Button variant="outline" onClick={() => setGenerated(false)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      再生成
                    </Button>
                  )}
                </motion.div>
              </div>
            </CardHeader>
            <CardContent>
              {generating ? (
                <div className="h-96 flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
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
                  <ShiftCalendar shiftData={firstPlanShiftData} />
                </motion.div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-gray-500">
                  <CalendarIcon className="h-24 w-24 mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">シフト未生成</p>
                  <p className="text-sm">「自動生成」ボタンをクリックしてシフトを作成してください</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* 法令チェック */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                法令チェック
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generated ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="font-medium text-red-800">要注意</span>
                    </div>
                    <p className="text-sm text-red-700">田中さん: 週42時間（法定40時間超過）</p>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-800">警告</span>
                    </div>
                    <p className="text-sm text-yellow-700">佐藤さん: 7日連続勤務</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">正常</span>
                    </div>
                    <p className="text-sm text-green-700">その他のスタッフ: 問題なし</p>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">シフト生成後に法令チェックを実行</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 指標 */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                生成指標
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generated ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm">人件費予定</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">¥850,000</p>
                      <p className="text-xs text-green-600">前年比-3.2%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm">充足率</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">87%</p>
                      <p className="text-xs text-blue-600">目標85%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-sm">制約満足度</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">94%</p>
                      <p className="text-xs text-purple-600">24件適合</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">シフト生成後に指標を表示</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        {generated && (
          <Button onClick={onNext} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            希望回収設定へ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default FirstPlan
