import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { 
  RefreshCw, 
  Zap, 
  Calendar as CalendarIcon,
  CheckCircle,
  TrendingUp,
  ChevronLeft, 
  ArrowRight
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
        second: { satisfaction: 89, coverage: 92, cost: 48000 }
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
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
                      animate={{ width: "100%" }}
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
          {/* 第1案 vs 第2案 並列比較 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* 第1案 */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  第1案（AI自動生成）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-bold bg-blue-50 rounded">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 30 }, (_, i) => {
                    const firstPlanShifts = [
                      { date: 1, shifts: [{ name: '田中', time: '9-17', skill: 4, preferred: false }] },
                      { date: 2, shifts: [{ name: '佐藤', time: '13-21', skill: 5, preferred: true }, { name: '山田', time: '9-15', skill: 3, preferred: false }] },
                      { date: 3, shifts: [{ name: '鈴木', time: '10-18', skill: 4, preferred: true }] },
                      { date: 4, shifts: [{ name: '田中', time: '9-17', skill: 4, preferred: false }, { name: '佐藤', time: '17-21', skill: 5, preferred: false }] },
                      { date: 5, shifts: [{ name: '山田', time: '9-15', skill: 3, preferred: true }, { name: '高橋', time: '15-21', skill: 4, preferred: false }] },
                      { date: 6, shifts: [{ name: '佐藤', time: '10-18', skill: 5, preferred: false }, { name: '田中', time: '18-22', skill: 4, preferred: false }] },
                      { date: 7, shifts: [{ name: '鈴木', time: '9-17', skill: 4, preferred: true }, { name: '山田', time: '17-21', skill: 3, preferred: false }] }
                    ]
                    
                    const dayData = firstPlanShifts.find(d => d.date === (i % 7) + 1)
                    return (
                      <div key={i} className="p-1 border border-gray-100 rounded min-h-[80px]">
                        <div className="text-xs font-bold mb-1 text-gray-700">{i + 1}</div>
                        {dayData?.shifts.map((shift, idx) => (
                          <div 
                            key={idx}
                            className={`text-xs p-1 rounded mb-1 ${
                              shift.preferred
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            <div className="font-medium">{shift.name}</div>
                            <div className="text-xs opacity-80">{shift.time}</div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 第2案 */}
            <Card className="shadow-lg border-0 ring-2 ring-green-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                  第2案（希望反映版）
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">改善版</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-bold bg-green-50 rounded">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 30 }, (_, i) => {
                    const improvedShifts = [
                      { date: 1, shifts: [{ name: '田中', time: '13-21', skill: 4, preferred: true, changed: true }] },
                      { date: 2, shifts: [{ name: '佐藤', time: '9-17', skill: 5, preferred: true, changed: false }, { name: '山田', time: '17-21', skill: 3, preferred: true, changed: true }] },
                      { date: 3, shifts: [{ name: '鈴木', time: '9-17', skill: 4, preferred: true, changed: false }] },
                      { date: 4, shifts: [{ name: '高橋', time: '9-15', skill: 4, preferred: true, changed: true }, { name: '田中', time: '15-21', skill: 4, preferred: true, changed: true }] },
                      { date: 5, shifts: [{ name: '佐藤', time: '10-18', skill: 5, preferred: true, changed: true }] },
                      { date: 6, shifts: [{ name: '山田', time: '9-15', skill: 3, preferred: true, changed: true }, { name: '鈴木', time: '15-21', skill: 4, preferred: true, changed: true }] },
                      { date: 7, shifts: [{ name: '高橋', time: '10-18', skill: 4, preferred: true, changed: true }] }
                    ]
                    
                    const dayData = improvedShifts.find(d => d.date === (i % 7) + 1)
                    return (
                      <motion.div 
                        key={i} 
                        className="p-1 border border-gray-100 rounded min-h-[80px]"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <div className="text-xs font-bold mb-1 text-gray-700">{i + 1}</div>
                        {dayData?.shifts.map((shift, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`text-xs p-1 rounded mb-1 ${
                              shift.changed
                                ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-300' 
                                : shift.preferred
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            <div className="font-medium flex items-center">
                              {shift.name}
                              {shift.preferred && <CheckCircle className="h-2 w-2 ml-1 text-green-600" />}
                              {shift.changed && <TrendingUp className="h-2 w-2 ml-1 text-orange-600" />}
                            </div>
                            <div className="text-xs opacity-80">{shift.time}</div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 凡例 */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-center space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
                  <span>希望時間帯</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded mr-2"></div>
                  <span>調整時間帯</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
                  <span>希望外時間帯</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded mr-2"></div>
                  <span>第2案で変更</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 比較統計 */}
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
                      <span className="text-lg font-bold text-gray-600">{comparison.first.satisfaction}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">第2案</span>
                      <span className="text-lg font-bold text-green-600">{comparison.second.satisfaction}%</span>
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
                      <span className="text-lg font-bold text-gray-600">{comparison.first.coverage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">第2案</span>
                      <span className="text-lg font-bold text-green-600">{comparison.second.coverage}%</span>
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
                      <span className="text-lg font-bold text-gray-600">¥{comparison.first.cost.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">第2案</span>
                      <span className="text-lg font-bold text-green-600">¥{comparison.second.cost.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      ¥{(comparison.first.cost - comparison.second.cost).toLocaleString()} 削減
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 主な改善点 */}
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
          <Button onClick={onNext} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            チャット修正へ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default SecondPlan
