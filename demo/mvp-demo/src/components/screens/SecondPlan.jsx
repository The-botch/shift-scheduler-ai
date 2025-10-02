import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { 
  RefreshCw, 
  Zap, 
  Calendar as CalendarIcon,
  CheckCircle,
  TrendingUp,
  ChevronLeft, 
  ArrowRight,
  MessageSquare,
  Send,
  X,
  AlertTriangle,
  Users,
  Clock
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
  const [selectedDate, setSelectedDate] = useState(null)
  const [messages, setMessages] = useState([
    { id: 1, type: 'system', content: '第2案が生成されました。自然言語で修正指示をお聞かせください。', time: '14:30' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [shiftData, setShiftData] = useState([])
  const [changedDates, setChangedDates] = useState(new Set())

  const generateSecondPlan = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      setComparison({
        first: { satisfaction: 72, coverage: 85, cost: 52000 },
        second: { satisfaction: 89, coverage: 92, cost: 48000 }
      })
      // 初期シフトデータを設定
      setShiftData([
        { date: 1, shifts: [{ name: '田中', time: '13-21', skill: 4, preferred: true, changed: false }] },
        { date: 2, shifts: [{ name: '佐藤', time: '9-17', skill: 5, preferred: true, changed: false }, { name: '山田', time: '17-21', skill: 3, preferred: true, changed: false }] },
        { date: 3, shifts: [{ name: '鈴木', time: '9-17', skill: 4, preferred: true, changed: false }] },
        { date: 4, shifts: [{ name: '高橋', time: '9-15', skill: 4, preferred: true, changed: false }, { name: '田中', time: '15-21', skill: 4, preferred: true, changed: false }] },
        { date: 5, shifts: [{ name: '佐藤', time: '10-18', skill: 5, preferred: true, changed: false }] },
        { date: 6, shifts: [{ name: '山田', time: '9-15', skill: 3, preferred: true, changed: false }, { name: '鈴木', time: '15-21', skill: 4, preferred: true, changed: false }] },
        { date: 7, shifts: [{ name: '高橋', time: '10-18', skill: 4, preferred: true, changed: false }] }
      ])
    }, 3000)
  }

  // デモ用の修正パターン
  const demoPatterns = {
    '田中さんの月曜日を休みにしてください': {
      changes: [{ date: 1, action: 'remove', staff: '田中' }],
      response: '田中さんの月曜日のシフトを削除しました。代替スタッフの配置も調整済みです。'
    },
    '午前のシフトを1人増やしてください': {
      changes: [{ date: 2, action: 'add', staff: '高橋', time: '9-13', skill: 4 }],
      response: '火曜日の午前シフトに高橋さん（9:00-13:00）を追加しました。'
    },
    '土日のベテランスタッフを増やしてください': {
      changes: [
        { date: 6, action: 'add', staff: '佐藤', time: '9-17', skill: 5 },
        { date: 7, action: 'add', staff: '田中', time: '9-17', skill: 4 }
      ],
      response: '土曜日に佐藤さん、日曜日に田中さんを追加配置しました。'
    },
    '連続勤務を3日以内に制限してください': {
      changes: [{ date: 4, action: 'remove', staff: '田中' }],
      response: '田中さんの木曜日のシフトを削除し、連続勤務を調整しました。'
    },
    '佐藤さんの水曜日を夜勤に変更してください': {
      changes: [{ date: 3, action: 'modify', staff: '佐藤', time: '17-21', skill: 5 }],
      response: '佐藤さんの水曜日のシフトを夜勤（17:00-21:00）に変更しました。'
    }
  }

  const applyShiftChanges = (changes) => {
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
              preferred: true,
              changed: true
            })
          } else if (change.action === 'modify') {
            const shiftIndex = newData[dayIndex].shifts.findIndex(s => s.name === change.staff)
            if (shiftIndex !== -1) {
              newData[dayIndex].shifts[shiftIndex] = {
                ...newData[dayIndex].shifts[shiftIndex],
                time: change.time,
                changed: true
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
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsTyping(true)

    // デモパターンをチェック
    const pattern = demoPatterns[currentInput]
    
    setTimeout(() => {
      let responseContent = '承知しました。指定された変更を適用し、シフト表を更新しました。'
      
      if (pattern) {
        applyShiftChanges(pattern.changes)
        responseContent = pattern.response
      }

      const aiResponse = {
        id: messages.length + 2,
        type: 'assistant',
        content: responseContent,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 2000)
  }

  const getDateDetails = (date) => {
    const dayData = shiftData.find(d => d.date === date)
    if (!dayData) return null

    return {
      date,
      shifts: dayData.shifts,
      required: { morning: 2, afternoon: 2, evening: 1 },
      assigned: { 
        morning: dayData.shifts.filter(s => s.time.includes('9') || s.time.includes('10')).length,
        afternoon: dayData.shifts.filter(s => s.time.includes('13') || s.time.includes('15')).length,
        evening: dayData.shifts.filter(s => s.time.includes('17') || s.time.includes('21')).length
      },
      issues: [
        ...(dayData.shifts.filter(s => !s.preferred).length > 0 ? ['希望外時間帯あり'] : []),
        ...(dayData.shifts.filter(s => s.skill < 3).length > 2 ? ['スキル不足'] : [])
      ]
    }
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
                    const date = i + 1
                    const dayData = shiftData.find(d => d.date === (i % 7) + 1) || 
                                   { date: (i % 7) + 1, shifts: [] }
                    
                    return (
                      <motion.div 
                        key={i} 
                        className="p-1 border border-gray-100 rounded min-h-[80px] cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="text-xs font-bold mb-1 text-gray-700">{date}</div>
                        {dayData.shifts.map((shift, idx) => (
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

                {/* 統合チャット機能 */}
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center mb-4">
                    <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                    <h3 className="font-medium">AI修正アシスタント</h3>
                  </div>
                  
                  <div className="h-48 overflow-y-auto p-4 bg-gray-50 rounded-lg mb-4 space-y-3">
                    {messages.map(message => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : message.type === 'system'
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          <p>{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">{message.time}</p>
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 px-3 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="修正指示を入力してください..."
                      className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <Button onClick={sendMessage} disabled={!inputValue.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 text-xs text-gray-600">
                    <p className="font-medium mb-2">修正例:</p>
                    <div className="space-y-1">
                      <p>• 田中さんの月曜日を休みにしてください</p>
                      <p>• 午前のシフトを1人増やしてください</p>
                      <p>• 佐藤さんの水曜日を夜勤に変更してください</p>
                    </div>
                  </div>
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

          {/* 日付詳細ポップアップ */}
          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => setSelectedDate(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">
                      {selectedDate}日の詳細
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {(() => {
                    const details = getDateDetails(selectedDate)
                    if (!details) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <p>この日はシフトが設定されていません</p>
                        </div>
                      )
                    }

                    return (
                      <div>
                        {/* 時間軸テーブル */}
                        <div className="overflow-y-auto max-h-[60vh]">
                          <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="border border-gray-300 px-3 py-2 text-left">時間帯</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">AI配置スタッフ</th>
                                <th className="border border-gray-300 px-2 py-2">必要</th>
                                <th className="border border-gray-300 px-2 py-2">現在</th>
                                <th className="border border-gray-300 px-3 py-2 text-left">状況</th>
                              </tr>
                            </thead>
                            <tbody>
                        {(() => {
                          const timeSlots = [];
                          for (let hour = 5; hour < 20; hour++) {
                            for (let minute = 0; minute < 60; minute += 30) {
                              const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                              const endMinute = minute + 30;
                              const endHour = endMinute >= 60 ? hour + 1 : hour;
                              const endTime = `${endHour.toString().padStart(2, '0')}:${(endMinute % 60).toString().padStart(2, '0')}`;
                              
                              // サンプルデータ生成
                              let assigned = [];
                              let required = 0;
                              let status = '✅';
                              let statusColor = 'text-green-600';
                              
                              if (hour >= 9 && hour < 13) {
                                assigned = ['田中★★★', '山田★☆☆'];
                                required = 3;
                                status = '⚠️1名不足';
                                statusColor = 'text-yellow-600';
                              } else if (hour >= 13 && hour < 17) {
                                assigned = ['田中★★★', '佐藤★★☆', '鈴木★★★', '山田★☆☆'];
                                required = 2;
                                status = '🔴2名超過';
                                statusColor = 'text-red-600';
                              } else if (hour >= 17 && hour < 21) {
                                assigned = ['佐藤★★☆', '高橋★★★'];
                                required = 2;
                                status = '✅';
                                statusColor = 'text-green-600';
                              }
                              
                              timeSlots.push({
                                time: `${startTime}-${endTime}`,
                                assigned,
                                required,
                                current: assigned.length,
                                status,
                                statusColor
                              });
                            }
                          }
                          
                          return timeSlots.map((slot, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="border border-gray-300 px-3 py-2 font-mono text-xs">
                                {slot.time}
                              </td>
                              <td className="border border-gray-300 px-3 py-2">
                                {slot.assigned.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {slot.assigned.map((staff, i) => (
                                      <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                        {staff}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center">
                                {slot.required}
                              </td>
                              <td className="border border-gray-300 px-2 py-2 text-center">
                                {slot.current}
                              </td>
                              <td className={`border border-gray-300 px-3 py-2 ${slot.statusColor}`}>
                                {slot.status}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <h4 className="font-medium text-blue-800 mb-2">💡 改善提案</h4>
                    <div className="text-sm text-blue-700">
                      • 09:00-13:00: ベテラン1名追加（鈴木さんまたは高橋さん）<br/>
                      • 13:00-17:00: 2名を他の時間帯に移動を検討
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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
            確定・配布へ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export default SecondPlan
