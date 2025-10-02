import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { 
  MessageSquare, 
  Target, 
  Send, 
  ChevronLeft, 
  ArrowRight,
  CalendarIcon,
  Star
} from 'lucide-react'
import { useChat } from '../../hooks/useChat'
import { useShiftData } from '../../hooks/useShiftData'
import ShiftCalendar from '../common/ShiftCalendar'

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

const ChatModification = ({ onNext, onPrev }) => {
  const { shiftData, changedDates, applyShiftChanges } = useShiftData()
  const { messages, inputValue, setInputValue, isTyping, sendMessage } = useChat(applyShiftChanges)

  const demoExamples = [
    '田中さんの月曜日を休みにしてください',
    '午前のシフトを1人増やしてください',
    '土日のベテランスタッフを増やしてください',
    '連続勤務を3日以内に制限してください',
    '佐藤さんの水曜日を夜勤に変更してください'
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
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : message.type === 'system'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-green-100 text-green-800'
                  }`}>
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
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
            <ShiftCalendar 
              shiftData={shiftData} 
              changedDates={changedDates}
            />
            
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
            <p className="text-sm text-gray-600 mt-1">以下の例文をクリックすると、実際にシフトが変更されます</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">🎯 デモ用修正指示（クリックで実行）</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {demoExamples.map((example, idx) => (
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
        <Button onClick={onNext} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          確定・配布へ
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

export default ChatModification
