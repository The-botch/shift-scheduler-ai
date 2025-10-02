import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import {
  ChevronLeft,
  ArrowRight,
  Check,
  X,
  Calendar,
  MessageSquare
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

const LineShiftInput = ({ onNext, onPrev, shiftStatus }) => {
  const [selectedDates, setSelectedDates] = useState(new Set())
  const [showLineMessage, setShowLineMessage] = useState(true)
  const [showLiffApp, setShowLiffApp] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // デモ用の日付データ
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1)

  const handleSubmit = () => {
    setIsSubmitted(true)
    setShowLiffApp(false)
    setShowLineMessage(true)
  }

  const toggleDate = (date) => {
    const newSelected = new Set(selectedDates)
    if (newSelected.has(date)) {
      newSelected.delete(date)
    } else {
      newSelected.add(date)
    }
    setSelectedDates(newSelected)
  }

  const getDayOfWeek = (date) => {
    const day = new Date(2024, 9, date).getDay()
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    return weekdays[day]
  }

  const isWeekend = (date) => {
    const day = new Date(2024, 9, date).getDay()
    return day === 0 || day === 6
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
      {/* スタッフのスマホ画面風デモ */}
      <div className="flex justify-center">
        <div className="w-full max-w-[380px]">
          <Card className="shadow-2xl border-4 border-gray-800 rounded-[2rem] overflow-hidden bg-white">
            {/* スマホのステータスバー */}
            <div className="bg-black text-white px-4 py-1.5 flex items-center justify-between text-xs">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-2.5 border border-white rounded-sm"></div>
                <div className="w-3 h-2.5 border border-white rounded-sm"></div>
                <div className="w-3 h-2.5 border border-white rounded-sm"></div>
              </div>
            </div>

            {showLineMessage ? (
              /* LINEトーク画面 */
              <div className="bg-[#7CB4D3] h-[600px] p-3 overflow-y-auto">
                {/* LINEヘッダー */}
                <div className="bg-white rounded-t-lg px-3 py-2 flex items-center gap-2 border-b">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">カフェ○○ 店舗公式</p>
                    <p className="text-xs text-gray-500">営業時間 9:00-22:00</p>
                  </div>
                </div>

                {/* トークエリア */}
                <div className="bg-white px-3 py-4 space-y-3">
                  {/* 店舗からのメッセージ */}
                  <div className="flex items-start gap-1.5">
                    <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
                        <p className="text-xs text-gray-800 mb-2">
                          お疲れ様です！<br />
                          <span className="font-bold">10月分のシフト希望</span>の提出をお願いします。
                        </p>
                        <p className="text-xs text-gray-600 mb-2">
                          📅 提出期限: 9月25日(月) 23:59まで<br />
                          ⚠️ シフトが確定するまで、何度でも変更可能です
                        </p>
                        <div className="mt-2 p-2 bg-green-50 border-2 border-green-600 rounded-lg">
                          <p className="text-xs text-green-800 font-bold mb-1.5">
                            👇 こちらから入力してください
                          </p>
                          <Button
                            onClick={() => {
                              setShowLineMessage(false)
                              setShowLiffApp(true)
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1.5"
                          >
                            シフト希望を入力する
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 ml-1">14:30</p>
                    </div>
                  </div>

                  {/* 注意事項メッセージ */}
                  <div className="flex items-start gap-1.5">
                    <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
                        <p className="text-xs text-gray-700">
                          💡 <span className="font-bold">入力のポイント</span><br />
                          ・勤務できる日を全て選択してください<br />
                          ・確定前なら何度でも修正できます<br />
                          ・質問があればこのトークで連絡してください
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 ml-1">14:31</p>
                    </div>
                  </div>

                  {/* 送信完了メッセージ */}
                  {isSubmitted && (
                    <>
                      {/* ユーザーからの送信メッセージ */}
                      <div className="flex items-end justify-end gap-1.5">
                        <div className="flex-1 flex flex-col items-end">
                          <div className="bg-green-500 text-white rounded-lg p-2 shadow-sm max-w-[80%]">
                            <p className="text-xs">送信しました！</p>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 mr-1">14:35</p>
                        </div>
                      </div>

                      {/* システム自動返信 */}
                      <div className="flex items-start gap-1.5">
                        <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="bg-green-50 border-2 border-green-600 rounded-lg p-2.5 shadow-sm">
                            <p className="text-xs font-bold text-green-800 mb-1">
                              ✅ シフト希望を受け付けました
                            </p>
                            <p className="text-xs text-green-700">
                              田中太郎さんが10月のシフト希望を送信しました。<br />
                              <span className="font-bold">選択日数: {selectedDates.size}日</span>
                            </p>
                            <p className="text-xs text-gray-600 mt-1.5">
                              シフトが確定するまで、いつでも変更可能です。<br />
                              変更する場合は、もう一度上のボタンから入力してください。
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 ml-1">14:35</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* シフト承認完了メッセージ */}
                  {shiftStatus?.[10] === 'completed' && (
                    <div className="flex items-start gap-1.5">
                      <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-2.5 shadow-sm">
                          <p className="text-xs font-bold text-blue-800 mb-1">
                            📅 10月のシフトが確定しました
                          </p>
                          <p className="text-xs text-blue-700 mb-2">
                            お疲れ様です！<br />
                            10月のシフトが承認され、確定しました。
                          </p>
                          <div className="mt-2 p-2 bg-white border border-blue-300 rounded-lg">
                            <p className="text-xs text-blue-800 font-bold mb-1.5">
                              👇 シフトを確認する
                            </p>
                            <Button
                              size="sm"
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5"
                            >
                              10月のシフトを見る
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 ml-1">16:20</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* LINE入力エリア */}
                <div className="bg-white rounded-b-lg px-3 py-2 flex items-center gap-2 border-t">
                  <input
                    type="text"
                    placeholder="メッセージを入力"
                    className="flex-1 px-2.5 py-1.5 bg-gray-100 rounded-full text-xs"
                    disabled
                  />
                  <Button size="sm" className="rounded-full text-xs px-3 py-1" disabled>
                    送信
                  </Button>
                </div>
              </div>
            ) : showLiffApp ? (
              /* LIFF入力画面 */
              <div className="bg-white h-[600px] overflow-y-auto">
                {/* LIFFヘッダー */}
                <div className="bg-green-600 text-white px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="font-bold text-sm">シフト希望入力</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowLiffApp(false)
                      setShowLineMessage(true)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-3 bg-gray-50">
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      ⚠️ <span className="font-bold">シフトが確定するまでの間、何度でも変更可能です</span>
                    </p>
                  </div>

                  <div className="mb-3">
                    <h3 className="text-base font-bold text-gray-800 mb-0.5">10月のシフト希望</h3>
                    <p className="text-xs text-gray-600">勤務可能な日をタップしてください</p>
                  </div>

                  {/* カレンダー選択UI */}
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                      <div key={day} className="text-center text-xs font-bold text-gray-500 py-0.5">
                        {day}
                      </div>
                    ))}

                    {daysInMonth.map((date) => {
                      const isSelected = selectedDates.has(date)
                      const weekend = isWeekend(date)

                      return (
                        <button
                          key={date}
                          onClick={() => toggleDate(date)}
                          className={`
                            aspect-square rounded-lg text-xs font-medium transition-all
                            ${isSelected
                              ? 'bg-green-600 text-white shadow-md scale-95'
                              : weekend
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                            }
                          `}
                        >
                          {date}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mb-3 p-2.5 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">選択した日数</p>
                    <p className="text-xl font-bold text-green-600">{selectedDates.size}日</p>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2"
                  >
                    <Check className="mr-2 h-3.5 w-3.5" />
                    送信する
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-2">
                    シフト確定前なら何度でも変更できます
                  </p>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

export default LineShiftInput
