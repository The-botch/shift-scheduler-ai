import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Clock } from 'lucide-react'

const SHIFT_PATTERNS = [
  { id: 'morning', name: '午前', start: '09:00', end: '18:00', color: 'bg-blue-500', icon: '🌅' },
  { id: 'afternoon', name: '午後', start: '13:00', end: '22:00', color: 'bg-orange-500', icon: '🌆' },
  { id: 'night', name: '夜間', start: '10:00', end: '20:00', color: 'bg-purple-500', icon: '🌙' },
  { id: 'custom', name: 'カスタム', start: '', end: '', color: 'bg-gray-500', icon: '⚙️' }
]

const ShiftPatternSelector = ({ onSelect, selectedDatesCount = 0 }) => {
  const [selectedPattern, setSelectedPattern] = useState(null)
  const [customStart, setCustomStart] = useState('09:00')
  const [customEnd, setCustomEnd] = useState('18:00')

  const handlePatternSelect = (pattern) => {
    setSelectedPattern(pattern.id)

    if (pattern.id !== 'custom') {
      onSelect({
        start_time: pattern.start,
        end_time: pattern.end,
        pattern_name: pattern.name
      })
    }
  }

  const handleCustomSubmit = () => {
    if (customStart && customEnd) {
      onSelect({
        start_time: customStart,
        end_time: customEnd,
        pattern_name: 'カスタム'
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          シフトパターンを選択
        </CardTitle>
        {selectedDatesCount > 0 && (
          <p className="text-sm text-gray-600">
            選択した{selectedDatesCount}日分のシフト時間を設定します
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* パターンボタン */}
        <div className="grid grid-cols-2 gap-2">
          {SHIFT_PATTERNS.map((pattern) => (
            <motion.button
              key={pattern.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePatternSelect(pattern)}
              className={`
                p-4 rounded-lg text-white font-medium text-sm
                transition-all relative overflow-hidden
                ${pattern.color}
                ${
                  selectedPattern === pattern.id
                    ? 'ring-4 ring-offset-2 ring-blue-300 shadow-xl'
                    : 'opacity-90 hover:opacity-100 shadow-md hover:shadow-lg'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">{pattern.icon}</span>
                <div className="font-bold">{pattern.name}</div>
                {pattern.start && (
                  <div className="text-xs opacity-90">
                    {pattern.start} - {pattern.end}
                  </div>
                )}
              </div>
              {selectedPattern === pattern.id && (
                <motion.div
                  layoutId="selected-pattern"
                  className="absolute inset-0 border-4 border-white rounded-lg pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* カスタム時間入力 */}
        <AnimatePresence>
          {selectedPattern === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-3 border-t"
            >
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  開始時刻
                </label>
                <input
                  type="time"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  終了時刻
                </label>
                <input
                  type="time"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button
                onClick={handleCustomSubmit}
                className="w-full"
                disabled={!customStart || !customEnd}
              >
                カスタム時間を設定
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

export default ShiftPatternSelector
