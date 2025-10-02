import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { CheckCircle, ChevronLeft, ArrowRight } from 'lucide-react'

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
    { id: 7, name: '日', date: '9/8' }
  ]

  const timeSlots = ['9:00-13:00', '13:00-17:00', '17:00-21:00']

  const toggleDay = (dayId) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
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
            シフト希望の提出が完了しました。<br />
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
                        onChange={(e) => setTimePreferences(prev => ({
                          ...prev,
                          [slot]: e.target.checked
                        }))}
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

export default StaffInput
